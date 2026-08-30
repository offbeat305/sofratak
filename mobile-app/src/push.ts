import { Platform } from "react-native";

/**
 * Expo push token registration — best-effort by design. Remote push isn't
 * available in Expo Go (SDK 53+) and the diner can decline the permission;
 * either way ordering must work exactly the same, so every failure path
 * returns null and the order simply ships without a token (SMS still
 * covers status updates, same as web).
 */
export async function getPushTokenOrNull(): Promise<string | null> {
  try {
    const Notifications = await import("expo-notifications");
    const Device = await import("expo-device");
    if (!Device.isDevice) return null;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("orders", {
        name: "Order updates",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== "granted") return null;

    const projectId =
      (await import("expo-constants")).default.expoConfig?.extra?.eas?.projectId;
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return token.data ?? null;
  } catch {
    return null;
  }
}
