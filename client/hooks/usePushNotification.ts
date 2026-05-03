import axiosInstance from "@/utils/axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

// Set handler ở ngoài hook, chạy 1 lần khi module load
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowList: true,
  }),
});

export const registerPushToken = async () => {
  if (Platform.OS === "web") return;
  await registerAndSaveToken();
};

export const usePushNotification = () => {
  const isInitialized = useRef(false);
  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null,
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    if (Platform.OS === "web") return;

    registerAndSaveToken();

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Thông báo đã nhận:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        console.log("Notification tapped:", data);
      });

    // Bắt token rotation nửa chừng
    const tokenRefreshListener = Notifications.addPushTokenListener(
      async ({ data: newToken }) => {
        const savedToken = await AsyncStorage.getItem("smart-home-push-token");
        if (newToken === savedToken) {
          console.log("Token rotated, unchanged, skip");
          return;
        }

        console.log("Token rotated, updating...");
        await AsyncStorage.setItem("smart-home-push-token", newToken);

        const accessToken = await AsyncStorage.getItem(
          "smart-home-access-token",
        );
        if (!accessToken) {
          console.log("Token rotated, no auth token, skip API");
          return;
        }

        await axiosInstance.post("/users/push-token", { token: newToken });
      },
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
      tokenRefreshListener.remove();
    };
  }, []);
};

const registerAndSaveToken = async () => {
  console.log("Push setup: start");

  // Chỉ chạy trên thiết bị thật
  if (!Device.isDevice) {
    console.log("Push setup: not a physical device");
    return;
  }

  // Android channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Thông báo chung",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#16A34A",
    });
  }

  // Xin permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  console.log("Push setup: existingStatus =", existingStatus);

  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  console.log("Push setup: finalStatus =", finalStatus);
  if (finalStatus !== "granted") return;

  // Lấy token
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  console.log("Push setup: projectId =", projectId ?? "<missing>");

  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId,
  });
  console.log("Push setup: token =", token ? token : "<empty>");

  // So sánh với token cũ — chỉ gửi lên server nếu thay đổi
  const savedToken = await AsyncStorage.getItem("smart-home-push-token");
  if (token === savedToken) {
    console.log("Push setup: token unchanged, skip");
    return;
  }

  try {
    await AsyncStorage.setItem("smart-home-push-token", token);

    const accessToken = await AsyncStorage.getItem("smart-home-access-token");
    if (!accessToken) {
      console.log("Push setup: no auth token, skip API");
      return;
    }

    await axiosInstance.post("/users/push-token", { token });
    console.log("Push setup: token sent to API ✓");
  } catch (error) {
    console.error("Không thể lưu push token:", error);
  }
};
