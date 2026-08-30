import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchLoyalty, placeOrder, type LoyaltyStatus } from "../api";
import { cartSubtotalCents, useCart } from "../cart";
import { formatCents, useI18n } from "../i18n";
import { getPushTokenOrNull } from "../push";
import { useStorefront } from "../storefront";
import { presentPaymentSheet } from "../stripe";
import { useTheme } from "../theme";
import { AppButton, Card, PriceRow, Screen, useRow, useTextAlign } from "../ui";
import type { ScreenProps } from "../navigation";
import type { Fulfillment } from "../types";

const SERVICE_FEE_CENTS = 79; // display only — the server owns the real number
const TIP_PERCENTS = [0, 10, 15, 20];
const PHONE_RE = /^[+()\-.\s\d]{7,20}$/;

/** 30-minute slots, 10:00–21:30, for a given day offset. */
function slotsFor(dayOffset: number): { iso: string; label: string }[] {
  const out: { iso: string; label: string }[] = [];
  const base = new Date();
  base.setDate(base.getDate() + dayOffset);
  for (let h = 10; h <= 21; h++) {
    for (const m of [0, 30]) {
      const d = new Date(base);
      d.setHours(h, m, 0, 0);
      if (d.getTime() < Date.now() + 30 * 60_000) continue; // ≥30 min out
      out.push({
        iso: d.toISOString(),
        label: d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      });
    }
  }
  return out;
}

export function CheckoutScreen({ navigation }: ScreenProps<"Checkout">) {
  const { t, l, locale } = useI18n();
  const { data } = useStorefront();
  const { restaurantSlug, lines, clear } = useCart();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const row = useRow();
  const textAlign = useTextAlign();

  const restaurant = data?.restaurant;
  const [fulfillment, setFulfillment] = useState<Fulfillment>(
    restaurant?.ordering.pickup ? "pickup" : "delivery",
  );
  const [scheduled, setScheduled] = useState(false);
  const [dayOffset, setDayOffset] = useState(0);
  const [slotIso, setSlotIso] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [address, setAddress] = useState("");
  const [tipPercent, setTipPercent] = useState(15);
  const [offerCode, setOfferCode] = useState("");
  const [loyalty, setLoyalty] = useState<LoyaltyStatus>(null);
  const [redeemRewardId, setRedeemRewardId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Punch-card lookup once the phone looks real (web parity).
  useEffect(() => {
    if (!restaurantSlug || !restaurant?.loyalty.enabled) return;
    if (!PHONE_RE.test(phone.trim()) || phone.trim().length < 10) return;
    const timer = setTimeout(() => {
      fetchLoyalty(restaurantSlug, phone.trim()).then(setLoyalty).catch(() => {});
    }, 600);
    return () => clearTimeout(timer);
  }, [phone, restaurantSlug, restaurant?.loyalty.enabled]);

  const subtotal = data ? cartSubtotalCents(data.menu, lines) : 0;
  const deliveryFee = fulfillment === "delivery" ? (restaurant?.ordering.deliveryFeeCents ?? 0) : 0;
  const tipCents = Math.round((subtotal * tipPercent) / 100);
  const estTotal = subtotal + SERVICE_FEE_CENTS + deliveryFee + tipCents;
  const slots = useMemo(() => slotsFor(dayOffset), [dayOffset]);

  const belowDeliveryMin =
    fulfillment === "delivery" &&
    !!restaurant &&
    subtotal < restaurant.ordering.deliveryMinimumCents;

  const canSubmit =
    !!restaurant &&
    lines.length > 0 &&
    name.trim().length > 0 &&
    PHONE_RE.test(phone.trim()) &&
    (fulfillment !== "delivery" || address.trim().length > 0) &&
    !belowDeliveryMin &&
    (!scheduled || slotIso !== null);

  const submit = async () => {
    if (!restaurant || !restaurantSlug) return;
    setBusy(true);
    setError(null);
    try {
      const pushToken = await getPushTokenOrNull();
      const result = await placeOrder({
        restaurantSlug,
        locale,
        fulfillment,
        scheduledFor: scheduled ? slotIso : null,
        customer: { name: name.trim(), phone: phone.trim(), smsOptIn },
        deliveryAddress: fulfillment === "delivery" ? address.trim() : null,
        tipCents,
        offerCode: offerCode.trim() || null,
        redeemRewardId,
        lines,
        pushToken,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.payment) {
        const sheet = await presentPaymentSheet({
          clientSecret: result.payment.clientSecret,
          publishableKey: result.payment.publishableKey,
          stripeAccountId: result.payment.stripeAccountId,
          merchantName: l(restaurant.name),
          locale,
        });
        if (sheet.status === "canceled") {
          setError(t("paymentCanceled"));
          return;
        }
        if (sheet.status !== "paid") {
          setError(sheet.status === "failed" ? sheet.message : t("checkoutError"));
          return;
        }
      }
      clear();
      navigation.replace("OrderStatus", { orderId: result.orderId });
    } catch {
      setError(t("checkoutError"));
    } finally {
      setBusy(false);
    }
  };

  if (!restaurant || !data) return <Screen />;

  const chip = (active: boolean) => [
    styles.chip,
    { borderColor: active ? theme.primary : theme.border },
    active && { backgroundColor: theme.primary },
  ];
  const chipText = (active: boolean) => ({
    color: active ? theme.onPrimary : theme.text,
    fontWeight: "700" as const,
    fontSize: 14,
  });

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
          {/* fulfillment */}
          <View style={[row, { gap: 10 }]}>
            {restaurant.ordering.pickup && (
              <Pressable
                style={[chip(fulfillment === "pickup"), { flex: 1, alignItems: "center" }]}
                onPress={() => setFulfillment("pickup")}
              >
                <Text style={chipText(fulfillment === "pickup")}>{t("pickup")}</Text>
              </Pressable>
            )}
            {restaurant.ordering.delivery && (
              <Pressable
                style={[chip(fulfillment === "delivery"), { flex: 1, alignItems: "center" }]}
                onPress={() => setFulfillment("delivery")}
              >
                <Text style={chipText(fulfillment === "delivery")}>{t("delivery")}</Text>
              </Pressable>
            )}
          </View>

          {/* timing */}
          <Card>
            <View style={[row, { gap: 10 }]}>
              <Pressable style={chip(!scheduled)} onPress={() => setScheduled(false)}>
                <Text style={chipText(!scheduled)}>
                  {t("whenAsap", { n: restaurant.ordering.prepMinutes })}
                </Text>
              </Pressable>
              <Pressable style={chip(scheduled)} onPress={() => setScheduled(true)}>
                <Text style={chipText(scheduled)}>{t("whenSchedule")}</Text>
              </Pressable>
            </View>
            {scheduled && (
              <View style={{ marginTop: 12, gap: 10 }}>
                <Text style={[{ color: theme.muted, fontSize: 12 }, textAlign]}>
                  {t("scheduleHint")}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={[row, { gap: 8 }]}>
                    {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                      const d = new Date();
                      d.setDate(d.getDate() + offset);
                      const active = dayOffset === offset;
                      return (
                        <Pressable
                          key={offset}
                          style={chip(active)}
                          onPress={() => {
                            setDayOffset(offset);
                            setSlotIso(null);
                          }}
                        >
                          <Text style={chipText(active)}>
                            {d.toLocaleDateString(locale === "ar" ? "ar" : "en-US", {
                              weekday: "short",
                              day: "numeric",
                            })}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={[row, { gap: 8 }]}>
                    {slots.map((slot) => {
                      const active = slotIso === slot.iso;
                      return (
                        <Pressable key={slot.iso} style={chip(active)} onPress={() => setSlotIso(slot.iso)}>
                          <Text style={chipText(active)}>{slot.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}
          </Card>

          {/* contact */}
          <Card style={{ gap: 10 }}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t("yourName")}
              placeholderTextColor={theme.muted}
              autoComplete="name"
              maxLength={80}
              style={[styles.input, { borderColor: theme.border, color: theme.text }, textAlign]}
            />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder={t("yourPhone")}
              placeholderTextColor={theme.muted}
              keyboardType="phone-pad"
              autoComplete="tel"
              maxLength={20}
              style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            />
            <Text style={[{ color: theme.muted, fontSize: 12 }, textAlign]}>{t("phoneHint")}</Text>
            <View style={[row, { alignItems: "center", justifyContent: "space-between" }]}>
              <Text style={[{ color: theme.text, fontSize: 14, flexShrink: 1 }, textAlign]}>
                {t("smsOptIn")}
              </Text>
              <Switch
                value={smsOptIn}
                onValueChange={setSmsOptIn}
                trackColor={{ true: theme.primary }}
              />
            </View>
            {fulfillment === "delivery" && (
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder={t("deliveryAddress")}
                placeholderTextColor={theme.muted}
                autoComplete="street-address"
                maxLength={200}
                style={[styles.input, { borderColor: theme.border, color: theme.text }, textAlign]}
              />
            )}
            {belowDeliveryMin && (
              <Text style={[{ color: theme.error, fontSize: 13, fontWeight: "600" }, textAlign]}>
                {t("deliveryMinimum", {
                  x: formatCents(restaurant.ordering.deliveryMinimumCents, locale),
                })}
              </Text>
            )}
          </Card>

          {/* loyalty rewards, once the phone matched an account */}
          {loyalty && loyalty.rewards.length > 0 && (
            <Card style={{ gap: 8 }}>
              <Text style={[{ color: theme.text, fontWeight: "800" }, textAlign]}>
                🎉 {loyalty.punches} / {Math.min(...loyalty.rewards.map((r) => r.punchesNeeded))}
              </Text>
              {loyalty.rewards.map((reward) => {
                const affordable = loyalty.punches >= reward.punchesNeeded;
                const active = redeemRewardId === reward.id;
                return (
                  <Pressable
                    key={reward.id}
                    disabled={!affordable}
                    onPress={() => setRedeemRewardId(active ? null : reward.id)}
                    style={[chip(active), !affordable && { opacity: 0.4 }]}
                  >
                    <Text style={chipText(active)}>
                      {l(reward.name)} · {formatCents(reward.valueCents, locale)}
                    </Text>
                  </Pressable>
                );
              })}
            </Card>
          )}

          {/* tip */}
          <Card style={{ gap: 10 }}>
            <Text style={[{ color: theme.text, fontWeight: "800" }, textAlign]}>{t("tip")}</Text>
            <View style={[row, { gap: 8 }]}>
              {TIP_PERCENTS.map((percent) => {
                const active = tipPercent === percent;
                return (
                  <Pressable
                    key={percent}
                    style={[chip(active), { flex: 1, alignItems: "center" }]}
                    onPress={() => setTipPercent(percent)}
                  >
                    <Text style={chipText(active)}>
                      {percent === 0 ? t("tipNone") : `${percent}%`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {/* offer code */}
          <TextInput
            value={offerCode}
            onChangeText={setOfferCode}
            placeholder={t("offerCode")}
            placeholderTextColor={theme.muted}
            autoCapitalize="characters"
            autoCorrect={false}
            style={[
              styles.input,
              { borderColor: theme.border, color: theme.text, backgroundColor: theme.card },
              textAlign,
            ]}
          />

          {/* totals (display estimate; server reprices) */}
          <Card>
            <PriceRow label={t("subtotal")} value={formatCents(subtotal, locale)} />
            <PriceRow label={t("serviceFee")} value={formatCents(SERVICE_FEE_CENTS, locale)} />
            {deliveryFee > 0 && (
              <PriceRow label={t("deliveryFee")} value={formatCents(deliveryFee, locale)} />
            )}
            {tipCents > 0 && <PriceRow label={t("tip")} value={formatCents(tipCents, locale)} />}
            <PriceRow label={t("total")} value={formatCents(estTotal, locale)} bold />
          </Card>

          {error && (
            <Text style={[{ color: theme.error, fontWeight: "600" }, textAlign]}>{error}</Text>
          )}

          <AppButton
            label={busy ? t("placing") : t("payNow", { x: formatCents(estTotal, locale) })}
            onPress={submit}
            disabled={!canSubmit}
            busy={busy}
            style={{ marginBottom: insets.bottom }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 48,
    fontSize: 15,
  },
});
