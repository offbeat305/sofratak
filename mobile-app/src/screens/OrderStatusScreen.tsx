import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { confirmOrder, fetchOrder } from "../api";
import { formatCents, useI18n } from "../i18n";
import { useTheme } from "../theme";
import { AppButton, Card, PriceRow, Screen, useRow, useTextAlign } from "../ui";
import type { ScreenProps } from "../navigation";
import type { OrderStatus, OrderView } from "../types";

const STEPS: OrderStatus[] = ["received", "preparing", "ready"];
const DELIVERY_STEPS: OrderStatus[] = ["received", "preparing", "out_for_delivery"];
const POLL_MS = 5000;

/**
 * Live status: one confirm call on mount (covers the finalize in case the
 * webhook hasn't landed yet), then a 5s poll while the screen is open.
 * Push arrives on top of this — the poll is the guarantee, push is the
 * nicety, SMS is the fallback that works with the phone in a pocket.
 */
export function OrderStatusScreen({ route, navigation }: ScreenProps<"OrderStatus">) {
  const { orderId } = route.params;
  const { t, l, locale } = useI18n();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const row = useRow();
  const textAlign = useTextAlign();
  const [order, setOrder] = useState<OrderView | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let alive = true;
    confirmOrder(orderId)
      .then(({ order: o }) => {
        if (alive) setOrder(o);
      })
      .catch(() => {
        fetchOrder(orderId)
          .then((o) => {
            if (alive) setOrder(o);
          })
          .catch(() => {});
      });
    timer.current = setInterval(() => {
      fetchOrder(orderId)
        .then((o) => {
          if (alive) setOrder(o);
          if (o.status === "completed" || o.status === "canceled") {
            if (timer.current) clearInterval(timer.current);
          }
        })
        .catch(() => {});
    }, POLL_MS);
    return () => {
      alive = false;
      if (timer.current) clearInterval(timer.current);
    };
  }, [orderId]);

  if (!order) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </Screen>
    );
  }

  const steps = order.fulfillment === "delivery" ? DELIVERY_STEPS : STEPS;
  const currentIndex =
    order.status === "completed" ? steps.length : steps.indexOf(order.status);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 24 }}>
        <View style={{ gap: 4 }}>
          <Text style={[styles.title, { color: theme.text }, textAlign]}>
            {t("statusTitle", { n: order.number })}
          </Text>
          <Text style={[{ color: theme.muted }, textAlign]}>
            {t("statusThanks", { name: order.customerName })}
          </Text>
        </View>

        {order.paymentStatus === "pending" ? (
          <Card style={styles.center}>
            <ActivityIndicator color={theme.primary} />
            <Text style={{ color: theme.muted, marginTop: 8 }}>{t("paymentPending")}</Text>
          </Card>
        ) : order.status === "canceled" ? (
          <Card>
            <Text style={[{ color: theme.error, fontWeight: "700" }, textAlign]}>
              {t("status_canceled")}
            </Text>
          </Card>
        ) : (
          <Card style={{ gap: 14 }}>
            {steps.map((step, index) => {
              const done = currentIndex > index;
              const active = currentIndex === index;
              return (
                <View key={step} style={[row, { alignItems: "center", gap: 12 }]}>
                  <View
                    style={[
                      styles.dot,
                      { borderColor: theme.border },
                      (done || active) && {
                        backgroundColor: theme.primary,
                        borderColor: theme.primary,
                      },
                    ]}
                  >
                    {done && <Text style={{ color: theme.onPrimary, fontSize: 12 }}>✓</Text>}
                  </View>
                  <Text
                    style={{
                      color: active ? theme.text : theme.muted,
                      fontWeight: active ? "800" : "500",
                      fontSize: 16,
                    }}
                  >
                    {t(`status_${step}` as `status_${OrderStatus}`)}
                  </Text>
                </View>
              );
            })}
          </Card>
        )}

        <Card>
          <Text style={[{ color: theme.text, fontWeight: "800", marginBottom: 8 }, textAlign]}>
            {t("receipt")}
          </Text>
          {order.lines.map((line, index) => (
            <PriceRow
              key={index}
              label={`${line.qty}× ${l(line.name)}`}
              value={formatCents(line.lineTotalCents, locale)}
            />
          ))}
          <View style={[styles.rule, { backgroundColor: theme.border }]} />
          <PriceRow label={t("subtotal")} value={formatCents(order.subtotalCents, locale)} />
          {order.discountCents > 0 && (
            <PriceRow
              label={t("discount")}
              value={`−${formatCents(order.discountCents, locale)}`}
              color={theme.positive}
            />
          )}
          <PriceRow label={t("serviceFee")} value={formatCents(order.serviceFeeCents, locale)} />
          {order.deliveryFeeCents > 0 && (
            <PriceRow label={t("deliveryFee")} value={formatCents(order.deliveryFeeCents, locale)} />
          )}
          {order.tipCents > 0 && (
            <PriceRow label={t("tip")} value={formatCents(order.tipCents, locale)} />
          )}
          <PriceRow label={t("total")} value={formatCents(order.totalCents, locale)} bold />
        </Card>

        <AppButton
          label={t("newOrder")}
          variant="secondary"
          onPress={() => navigation.reset({ index: 0, routes: [{ name: "Menu" }] })}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", padding: 20 },
  title: { fontSize: 26, fontWeight: "800" },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  rule: { height: 1, marginVertical: 8 },
});
