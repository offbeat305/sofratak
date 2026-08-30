import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_BASE, fetchRestaurants } from "../api";
import { useCart } from "../cart";
import { useI18n } from "../i18n";
import { SOFRATAK } from "../theme";
import { useRow, useTextAlign } from "../ui";
import type { ScreenProps } from "../navigation";
import type { RestaurantSummary } from "../types";

/**
 * App entry: pick a restaurant once, the app remembers it (cart context
 * persists the slug) and opens straight into that storefront next launch.
 * The only Sofratak-branded screen — everything after is the tenant.
 */
export function RestaurantPickerScreen({ navigation }: ScreenProps<"Picker">) {
  const { t, l, toggleLocale, isRTL } = useI18n();
  const { setRestaurant } = useCart();
  const insets = useSafeAreaInsets();
  const row = useRow();
  const textAlign = useTextAlign();
  const [restaurants, setRestaurants] = useState<RestaurantSummary[] | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(false);
      setRestaurants(await fetchRestaurants());
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pick = (slug: string) => {
    setRestaurant(slug);
    navigation.replace("Menu");
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={[row, styles.header]}>
        <View>
          <Text style={[styles.title, textAlign]}>{t("pickerTitle")}</Text>
          <Text style={[styles.sub, textAlign]}>{t("pickerSub")}</Text>
        </View>
        <Pressable onPress={toggleLocale} hitSlop={12}>
          <Text style={styles.langToggle}>{t("language")}</Text>
        </Pressable>
      </View>

      {error && <Text style={[styles.error, textAlign]}>{t("pickerError")}</Text>}

      <FlatList
        data={restaurants ?? []}
        keyExtractor={(r) => r.slug}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            tintColor={SOFRATAK.ivory}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => pick(item.slug)}
            style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.98 }] }]}
          >
            {item.coverUrl ? (
              <Image
                source={{ uri: item.coverUrl.startsWith("http") ? item.coverUrl : `${API_BASE}${item.coverUrl}` }}
                style={styles.cover}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.cover, { backgroundColor: item.brand.primary }]} />
            )}
            <View style={{ padding: 14 }}>
              <View style={[row, { justifyContent: "space-between", alignItems: "center" }]}>
                <Text style={[styles.cardName, textAlign]}>{l(item.name)}</Text>
                {item.halal && (
                  <View style={[styles.halalBadge, { backgroundColor: item.brand.accent }]}>
                    <Text style={styles.halalText}>{t("halal")}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.cardTagline, textAlign]} numberOfLines={2}>
                {l(item.tagline)}
              </Text>
              <Text style={[styles.cardCity, textAlign, { writingDirection: isRTL ? "rtl" : "ltr" }]}>
                {item.city}, {item.state}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: SOFRATAK.olive },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: { color: SOFRATAK.ivory, fontSize: 30, fontWeight: "800" },
  sub: { color: "rgba(247,242,232,0.7)", fontSize: 14, marginTop: 4 },
  langToggle: { color: SOFRATAK.sand, fontSize: 15, fontWeight: "700", paddingTop: 8 },
  error: { color: SOFRATAK.sand, paddingHorizontal: 16, paddingBottom: 4 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 18, overflow: "hidden" },
  cover: { height: 120, width: "100%" },
  cardName: { fontSize: 19, fontWeight: "800", color: SOFRATAK.charcoal, flexShrink: 1 },
  cardTagline: { fontSize: 13, color: SOFRATAK.stone, marginTop: 4 },
  cardCity: { fontSize: 12, color: SOFRATAK.stone, marginTop: 8, fontWeight: "600" },
  halalBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  halalText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
});
