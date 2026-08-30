import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_BASE } from "../api";
import { cartSubtotalCents, useCart } from "../cart";
import { formatCents, useI18n } from "../i18n";
import { useStorefront } from "../storefront";
import { useTheme } from "../theme";
import { AppButton, Screen, useRow, useTextAlign } from "../ui";
import type { ScreenProps } from "../navigation";
import type { MenuItem } from "../types";

/**
 * The storefront: tenant-branded header, horizontally scrolling category
 * chips, and the menu as a native SectionList. Mirrors the web storefront
 * layout the way a native app should — list-first, thumb-reachable cart.
 */
export function MenuScreen({ navigation }: ScreenProps<"Menu">) {
  const { t, l, toggleLocale, locale } = useI18n();
  const { data, loading, error, reload } = useStorefront();
  const { lines, restaurantSlug, setRestaurant } = useCart();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const row = useRow();
  const textAlign = useTextAlign();
  const listRef = useRef<SectionList<MenuItem>>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const sections = useMemo(() => {
    if (!data) return [];
    return data.menu.categories
      .map((cat) => ({
        id: cat.id,
        title: l(cat.name),
        data: data.menu.items.filter((i) => i.categoryId === cat.id),
      }))
      .filter((s) => s.data.length > 0);
  }, [data, l]);

  if (!data) {
    return (
      <Screen style={styles.center}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} />
        ) : error ? (
          <View style={{ gap: 16, alignItems: "center" }}>
            <Text style={{ color: theme.muted }}>{t("menuError")}</Text>
            <AppButton label={t("retry")} onPress={reload} variant="secondary" />
          </View>
        ) : null}
      </Screen>
    );
  }

  const { restaurant, menu } = data;
  const cartCount = lines.reduce((sum, line) => sum + line.qty, 0);
  const subtotal = cartSubtotalCents(menu, lines);

  const jumpTo = (categoryId: string) => {
    setActiveCategory(categoryId);
    const index = sections.findIndex((s) => s.id === categoryId);
    if (index >= 0) {
      listRef.current?.scrollToLocation({ sectionIndex: index, itemIndex: 0, viewOffset: 8 });
    }
  };

  return (
    <Screen>
      {/* tenant-branded header */}
      <View style={[styles.header, { backgroundColor: theme.primary, paddingTop: insets.top + 8 }]}>
        <View style={[row, { justifyContent: "space-between", alignItems: "center" }]}>
          <View style={[row, { alignItems: "center", gap: 10, flexShrink: 1 }]}>
            {restaurant.logoUrl && (
              <Image
                source={{
                  uri: restaurant.logoUrl.startsWith("http")
                    ? restaurant.logoUrl
                    : `${API_BASE}${restaurant.logoUrl}`,
                }}
                style={styles.logo}
              />
            )}
            <Text style={[styles.headerName, { color: theme.onPrimary }]} numberOfLines={1}>
              {l(restaurant.name)}
            </Text>
          </View>
          <Pressable onPress={toggleLocale} hitSlop={12}>
            <Text style={{ color: theme.onPrimary, fontWeight: "700" }}>{t("language")}</Text>
          </Pressable>
        </View>
        <Text style={[styles.headerTagline, { color: theme.onPrimary }, textAlign]} numberOfLines={1}>
          {l(restaurant.tagline)}
        </Text>
        <Pressable
          onPress={() => {
            setRestaurant(""); // clears cart + slug
            navigation.replace("Picker");
          }}
          hitSlop={8}
        >
          <Text style={[styles.switchLink, { color: theme.onPrimary }, textAlign]}>
            {t("switchRestaurant")}
          </Text>
        </Pressable>
      </View>

      {restaurant.ordering.paused && (
        <View style={[styles.pausedBanner, { backgroundColor: theme.error }]}>
          <Text style={styles.pausedText}>{t("menuPaused")}</Text>
        </View>
      )}

      {/* category chips */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.chips, row]}
        >
          {sections.map((section) => {
            const active = activeCategory === section.id;
            return (
              <Pressable
                key={section.id}
                onPress={() => jumpTo(section.id)}
                style={[
                  styles.chip,
                  { borderColor: theme.border },
                  active && { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}
              >
                <Text style={{ color: active ? theme.onPrimary : theme.text, fontWeight: "600" }}>
                  {section.title}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <SectionList
        ref={listRef}
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        onScrollToIndexFailed={() => {}}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={reload} tintColor={theme.primary} />
        }
        contentContainerStyle={{ paddingBottom: cartCount > 0 ? 120 : 32 }}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionTitle, { color: theme.text }, textAlign]}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <Pressable
            disabled={item.soldOut || restaurant.ordering.paused}
            onPress={() => navigation.navigate("Item", { itemId: item.id })}
            style={({ pressed }) => [
              styles.itemRow,
              row,
              { borderColor: theme.border, backgroundColor: theme.card },
              (item.soldOut || restaurant.ordering.paused) && { opacity: 0.45 },
              pressed && { transform: [{ scale: 0.99 }] },
            ]}
          >
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[styles.itemName, { color: theme.text }, textAlign]}>{l(item.name)}</Text>
              {!!l(item.description) && (
                <Text style={[styles.itemDesc, { color: theme.muted }, textAlign]} numberOfLines={2}>
                  {l(item.description)}
                </Text>
              )}
              <Text style={[styles.itemPrice, { color: theme.accent }, textAlign]}>
                {item.soldOut ? t("soldOut") : formatCents(item.priceCents, locale)}
              </Text>
            </View>
            {item.imageUrl && (
              <Image
                source={{
                  uri: item.imageUrl.startsWith("http") ? item.imageUrl : `${API_BASE}${item.imageUrl}`,
                }}
                style={styles.itemImage}
              />
            )}
          </Pressable>
        )}
      />

      {/* floating cart bar */}
      {cartCount > 0 && restaurantSlug && (
        <View style={[styles.cartBar, { paddingBottom: insets.bottom + 10 }]}>
          <AppButton
            label={`${t("viewCart")} · ${cartCount} · ${formatCents(subtotal, locale)}`}
            onPress={() => navigation.navigate("Cart")}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  header: { paddingHorizontal: 16, paddingBottom: 14, gap: 4 },
  logo: { width: 34, height: 34, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.2)" },
  headerName: { fontSize: 21, fontWeight: "800", flexShrink: 1 },
  headerTagline: { fontSize: 13, opacity: 0.75 },
  switchLink: { fontSize: 12, opacity: 0.7, textDecorationLine: "underline", marginTop: 2 },
  pausedBanner: { padding: 10 },
  pausedText: { color: "#FFF", textAlign: "center", fontWeight: "700", fontSize: 13 },
  chips: { gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 6,
  },
  itemRow: {
    marginHorizontal: 16,
    marginVertical: 5,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 12,
    alignItems: "center",
  },
  itemName: { fontSize: 16, fontWeight: "700" },
  itemDesc: { fontSize: 13, lineHeight: 18 },
  itemPrice: { fontSize: 14, fontWeight: "800", marginTop: 2 },
  itemImage: { width: 72, height: 72, borderRadius: 10 },
  cartBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 0,
  },
});
