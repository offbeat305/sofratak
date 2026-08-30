import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { priceCartLine, useCart } from "../cart";
import { formatCents, useI18n } from "../i18n";
import { useStorefront } from "../storefront";
import { useTheme } from "../theme";
import { AppButton, Card, PriceRow, Screen, useRow, useTextAlign } from "../ui";
import type { ScreenProps } from "../navigation";

export function CartScreen({ navigation }: ScreenProps<"Cart">) {
  const { t, l, locale } = useI18n();
  const { data } = useStorefront();
  const { lines, updateQty, removeLine } = useCart();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const row = useRow();
  const textAlign = useTextAlign();

  if (!data) return <Screen />;
  const { menu } = data;

  if (lines.length === 0) {
    return (
      <Screen style={styles.empty}>
        <Text style={{ color: theme.muted, fontSize: 16 }}>{t("cartEmpty")}</Text>
        <AppButton label={t("browseMenu")} variant="secondary" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  const subtotal = lines.reduce((sum, line) => sum + priceCartLine(menu, line), 0);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 160 }}>
        {lines.map((line, index) => {
          const item = menu.items.find((i) => i.id === line.menuItemId);
          if (!item) return null;
          const chosen = menu.modifierGroups
            .flatMap((g) => (line.options[g.id] ?? []).map((id) => g.options.find((o) => o.id === id)))
            .filter(Boolean)
            .map((o) => l(o!.name));
          return (
            <Card key={`${line.menuItemId}-${index}`}>
              <View style={[row, { justifyContent: "space-between", gap: 8 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.lineName, { color: theme.text }, textAlign]}>{l(item.name)}</Text>
                  {chosen.length > 0 && (
                    <Text style={[styles.lineMods, { color: theme.muted }, textAlign]}>
                      {chosen.join(" · ")}
                    </Text>
                  )}
                  {line.notes && (
                    <Text style={[styles.lineMods, { color: theme.muted }, textAlign]}>“{line.notes}”</Text>
                  )}
                </View>
                <Text style={{ color: theme.text, fontWeight: "700" }}>
                  {formatCents(priceCartLine(menu, line), locale)}
                </Text>
              </View>
              <View style={[row, styles.lineActions]}>
                <View style={[row, { alignItems: "center", gap: 14 }]}>
                  <Pressable
                    onPress={() => updateQty(index, line.qty - 1)}
                    style={[styles.stepBtn, { borderColor: theme.border }]}
                    hitSlop={8}
                  >
                    <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>−</Text>
                  </Pressable>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: theme.text }}>{line.qty}</Text>
                  <Pressable
                    onPress={() => updateQty(index, line.qty + 1)}
                    style={[styles.stepBtn, { borderColor: theme.border }]}
                    hitSlop={8}
                  >
                    <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>+</Text>
                  </Pressable>
                </View>
                <Pressable onPress={() => removeLine(index)} hitSlop={8}>
                  <Text style={{ color: theme.error, fontWeight: "700", fontSize: 13 }}>
                    {t("remove")}
                  </Text>
                </Pressable>
              </View>
            </Card>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10, backgroundColor: theme.bg }]}>
        <PriceRow label={t("subtotal")} value={formatCents(subtotal, locale)} bold />
        <AppButton label={t("goToCheckout")} onPress={() => navigation.navigate("Checkout")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: "center", justifyContent: "center", gap: 16, padding: 24 },
  lineName: { fontSize: 16, fontWeight: "700" },
  lineMods: { fontSize: 13, marginTop: 3 },
  lineActions: { justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: { position: "absolute", left: 16, right: 16, bottom: 0, gap: 10, paddingTop: 8 },
});
