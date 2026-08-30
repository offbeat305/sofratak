import type { NativeStackScreenProps } from "@react-navigation/native-stack";

export type RootStackParamList = {
  Picker: undefined;
  Menu: undefined;
  Item: { itemId: string };
  Cart: undefined;
  Checkout: undefined;
  OrderStatus: { orderId: string };
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
