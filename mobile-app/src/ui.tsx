import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useI18n } from "./i18n";
import { useTheme } from "./theme";

/**
 * Tiny shared UI kit — one place for the button/row/price idioms so all
 * six screens stay consistent (the same job the web's <Button> does).
 * `useRow` flips flexDirection for RTL; screens never hand-roll that.
 */

export function useRow(): ViewStyle {
  const { isRTL } = useI18n();
  return { flexDirection: isRTL ? "row-reverse" : "row" };
}

export function useTextAlign(): TextStyle {
  const { isRTL } = useI18n();
  return { textAlign: isRTL ? "right" : "left", writingDirection: isRTL ? "rtl" : "ltr" };
}

export function AppButton({
  label,
  onPress,
  disabled,
  busy,
  variant = "primary",
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  variant?: "primary" | "secondary";
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const isPrimary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        styles.button,
        isPrimary
          ? { backgroundColor: theme.primary }
          : { borderWidth: 1.5, borderColor: theme.primary },
        (disabled || busy) && { opacity: 0.5 },
        pressed && { transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={isPrimary ? theme.onPrimary : theme.primary} />
      ) : (
        <Text
          style={[
            styles.buttonLabel,
            { color: isPrimary ? theme.onPrimary : theme.primary },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, style]}>
      {children}
    </View>
  );
}

/** Label/value line used across cart, checkout, and the receipt. */
export function PriceRow({
  label,
  value,
  bold,
  color,
}: {
  label: string;
  value: string;
  bold?: boolean;
  color?: string;
}) {
  const theme = useTheme();
  const row = useRow();
  return (
    <View style={[row, styles.priceRow]}>
      <Text
        style={{
          color: color ?? (bold ? theme.text : theme.muted),
          fontWeight: bold ? "700" : "500",
          fontSize: bold ? 17 : 15,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: color ?? theme.text,
          fontWeight: bold ? "700" : "600",
          fontSize: bold ? 17 : 15,
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export function Screen({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return <View style={[styles.screen, { backgroundColor: theme.bg }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  button: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  buttonLabel: { fontSize: 16, fontWeight: "700" },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  priceRow: { justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
});
