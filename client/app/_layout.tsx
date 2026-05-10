import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
// import Toast from "react-native-toast-message";
import "setimmediate";
import "../global.css";

import AuthProvider from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { usePushNotification } from "@/hooks/usePushNotification";
import { RootSiblingParent } from "react-native-root-siblings";
import { SafeAreaProvider } from "react-native-safe-area-context";

// export const unstable_settings = {
//   anchor: "(tabs)",
// };

export default function RootLayout() {
  const colorScheme = useColorScheme();
  usePushNotification();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SafeAreaProvider>
        <RootSiblingParent>
          <AuthProvider>
            <SocketProvider>
              <Stack screenOptions={{ headerShown: false }}></Stack>
            </SocketProvider>
            {/* <Toast topOffset={60} /> */}
          </AuthProvider>
          <StatusBar style="auto" />
        </RootSiblingParent>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
