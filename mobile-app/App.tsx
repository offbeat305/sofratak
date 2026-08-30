import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CartProvider, useCart } from "./src/cart";
import { I18nProvider, useI18n } from "./src/i18n";
import { StorefrontProvider, useStorefront } from "./src/storefront";
import { ThemeProvider } from "./src/theme";
import type { RootStackParamList } from "./src/navigation";
import { CartScreen } from "./src/screens/CartScreen";
import { CheckoutScreen } from "./src/screens/CheckoutScreen";
import { ItemScreen } from "./src/screens/ItemScreen";
import { MenuScreen } from "./src/screens/MenuScreen";
import { OrderStatusScreen } from "./src/screens/OrderStatusScreen";
import { RestaurantPickerScreen } from "./src/screens/RestaurantPickerScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

function Navigator() {
  const { restaurantSlug, hydrated } = useCart();
  const { data } = useStorefront();
  const { t, l } = useI18n();

  // Initial route depends on the persisted restaurant choice; rendering
  // the navigator before AsyncStorage hydrates would lock in "Picker"
  // even for a returning diner (initialRouteName only applies at mount).
  if (!hydrated) return null;

  return (
    <ThemeProvider restaurant={data?.restaurant ?? null}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={restaurantSlug ? "Menu" : "Picker"}
          screenOptions={{
            headerTintColor: data?.restaurant.brand.primary,
            headerTitleStyle: { fontWeight: "700" },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen
            name="Picker"
            component={RestaurantPickerScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Menu" component={MenuScreen} options={{ headerShown: false }} />
          <Stack.Screen
            name="Item"
            component={ItemScreen}
            options={{ presentation: "modal", title: "" }}
          />
          <Stack.Screen
            name="Cart"
            component={CartScreen}
            options={{ title: t("cartTitle") }}
          />
          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={{ title: t("checkoutTitle") }}
          />
          <Stack.Screen
            name="OrderStatus"
            component={OrderStatusScreen}
            options={{
              title: data ? l(data.restaurant.name) : "",
              headerBackVisible: false,
              gestureEnabled: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <CartProvider>
          <StorefrontProvider>
            <StatusBar style="light" />
            <Navigator />
          </StorefrontProvider>
        </CartProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
