import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import "../global.css";

import AuthProvider from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

// export const unstable_settings = {
//   anchor: "(tabs)",
// };

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <SocketProvider>
          <Stack screenOptions={{ headerShown: false }}></Stack>
        </SocketProvider>
        <Toast topOffset={60} />
      </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
