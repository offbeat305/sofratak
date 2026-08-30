import { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_BASE } from "../api";
import { useCart } from "../cart";
import { formatCents, useI18n } from "../i18n";
import { useStorefront } from "../storefront";
import { useTheme } from "../theme";
import { AppButton, Screen, useRow, useTextAlign } from "../ui";
import type { ScreenProps } from "../navigation";

/**
 * Item detail: modifier groups with min/max enforced in the UI (radio
 * behavior when max=1, checkboxes otherwise), notes, qty stepper. The
 * add button stays disabled until every required group has a selection —
 * the same rule the server enforces again at placement.
 */
export function ItemScreen({ route, navigation }: ScreenProps<"Item">) {
  const { itemId } = route.params;
  const { t, l, locale } = useI18n();
  const { data } = useStorefront();
  const { addLine } = useCart();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const row = useRow();
  const textAlign = useTextAlign();

  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  const item = data?.menu.items.find((i) => i.id === itemId);
  const groups = useMemo(
    () => data?.menu.modifierGroups.filter((g) => item?.modifierGroupIds.includes(g.id)) ?? [],
    [data, item],
  );

  if (!data || !item) return <Screen />;

  const toggle = (groupId: string, optionId: string, max: number) => {
    setSelected((prev) => {
      const current = prev[groupId] ?? [];
      if (current.includes(optionId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
      }
      // radio behavior for single-choice groups; cap multi-choice at max
      const next = max === 1 ? [optionId] : [...current, optionId].slice(0, max);
      return { ...prev, [groupId]: next };
    });
  };

  const missingRequired = groups.some((g) => (selected[g.id] ?? []).length < g.min);

  const deltaCents = groups.reduce(
    (sum, g) =>
      sum +
      (selected[g.id] ?? []).reduce(
        (s, id) => s + (g.options.find((o) => o.id === id)?.priceDeltaCents ?? 0),
        0,
      ),
    0,
  );
  const lineTotal = (item.priceCents + deltaCents) * qty;

  const add = () => {
    addLine({
      menuItemId: item.id,
      qty,
      options: selected,
      notes: notes.trim() ? notes.trim() : null,
    });
    navigation.goBack();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {item.imageUrl && (
          <Image
            source={{
              uri: item.imageUrl.startsWith("http") ? item.imageUrl : `${API_BASE}${item.imageUrl}`,
            }}
            style={styles.hero}
          />
        )}
        <View style={{ padding: 16, gap: 6 }}>
          <Text style={[styles.name, { color: theme.text }, textAlign]}>{l(item.name)}</Text>
          {!!l(item.description) && (
            <Text style={[styles.desc, { color: theme.muted }, textAlign]}>{l(item.description)}</Text>
          )}
          <Text style={[styles.price, { color: theme.accent }, textAlign]}>
            {formatCents(item.priceCents, locale)}
          </Text>
        </View>

        {groups.map((group) => (
          <View key={group.id} style={{ paddingHorizontal: 16, paddingTop: 12 }}>
            <View style={[row, { alignItems: "center", gap: 8 }]}>
              <Text style={[styles.groupName, { color: theme.text }]}>{l(group.name)}</Text>
              <Text
                style={[
                  styles.groupBadge,
                  group.min > 0
                    ? { backgroundColor: theme.primary, color: theme.onPrimary }
                    : { backgroundColor: "rgba(31,31,31,0.07)", color: theme.muted },
                ]}
              >
                {group.min > 0 ? t("required") : t("chooseUpTo", { n: group.max })}
              </Text>
            </View>
            <View style={{ marginTop: 8, gap: 6 }}>
              {group.options.map((option) => {
                const isOn = (selected[group.id] ?? []).includes(option.id);
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => toggle(group.id, option.id, group.max)}
                    style={[
                      styles.option,
                      row,
                      { borderColor: isOn ? theme.primary : theme.border, backgroundColor: theme.card },
                      isOn && { borderWidth: 2 },
                    ]}
                  >
                    <View style={[row, { alignItems: "center", gap: 10, flex: 1 }]}>
                      <View
                        style={[
                          group.max === 1 ? styles.radio : styles.checkbox,
                          { borderColor: isOn ? theme.primary : theme.border },
                          isOn && { backgroundColor: theme.primary },
                        ]}
                      />
                      <Text style={{ color: theme.text, fontWeight: "600", flexShrink: 1 }}>
                        {l(option.name)}
                      </Text>
                    </View>
                    {option.priceDeltaCents > 0 && (
                      <Text style={{ color: theme.muted, fontWeight: "600" }}>
                        +{formatCents(option.priceDeltaCents, locale)}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <View style={{ paddingHorizontal: 16, paddingTop: 20, gap: 8 }}>
          <Text style={[styles.groupName, { color: theme.text }, textAlign]}>{t("itemNotes")}</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={t("itemNotesPlaceholder")}
            placeholderTextColor={theme.muted}
            maxLength={300}
            style={[styles.notes, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }, textAlign]}
          />
        </View>

        <View style={[row, styles.qtyRow]}>
          <Text style={[styles.groupName, { color: theme.text }]}>{t("quantity")}</Text>
          <View style={[row, { alignItems: "center", gap: 16 }]}>
            <Pressable
              onPress={() => setQty((q) => Math.max(1, q - 1))}
              style={[styles.stepBtn, { borderColor: theme.border }]}
              hitSlop={8}
            >
              <Text style={[styles.stepLabel, { color: theme.text }]}>−</Text>
            </Pressable>
            <Text style={[styles.qty, { color: theme.text }]}>{qty}</Text>
            <Pressable
              onPress={() => setQty((q) => Math.min(20, q + 1))}
              style={[styles.stepBtn, { borderColor: theme.border }]}
              hitSlop={8}
            >
              <Text style={[styles.stepLabel, { color: theme.text }]}>+</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10, backgroundColor: theme.bg }]}>
        <AppButton
          label={`${t("addToCart")} · ${formatCents(lineTotal, locale)}`}
          onPress={add}
          disabled={missingRequired || item.soldOut}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { width: "100%", height: 200 },
  name: { fontSize: 24, fontWeight: "800" },
  desc: { fontSize: 14, lineHeight: 20 },
  price: { fontSize: 17, fontWeight: "800", marginTop: 2 },
  groupName: { fontSize: 16, fontWeight: "800" },
  groupBadge: {
    fontSize: 11,
    fontWeight: "800",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: "hidden",
  },
  option: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 2 },
  notes: { borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 44, fontSize: 15 },
  qtyRow: {
    paddingHorizontal: 16,
    paddingTop: 20,
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLabel: { fontSize: 20, fontWeight: "700" },
  qty: { fontSize: 18, fontWeight: "800", minWidth: 24, textAlign: "center" },
  footer: { position: "absolute", left: 16, right: 16, bottom: 0, paddingTop: 8 },
});
