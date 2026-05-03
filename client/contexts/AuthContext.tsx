import { authService } from "@/service/auth.service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";
import { authEvents } from "./auth-events";

interface AuthContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  user: UserResponse | null;
  setUser: (user: UserResponse | null) => void;
  fetchUserInfo: () => Promise<void>;
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  setIsLoggedIn: () => {},
  user: null,
  setUser: () => {},
  fetchUserInfo: async () => {},
  accessToken: null,
  setAccessToken: () => {},
  logout: async () => {},
});

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const router = useRouter();

  const getCurrentPushToken = useCallback(async () => {
    if (Platform.OS === "web") return null;
    try {
      const Constants = (await import("expo-constants")).default;
      const Notifications = await import("expo-notifications");
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      return tokenData.data;
    } catch (error) {
      console.error("Failed to get push token:", error);
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    const pushToken = await getCurrentPushToken();
    try {
      await authService.logout(pushToken);
    } catch (error) {
      console.error("Logout API error:", error);
    }
    await AsyncStorage.removeItem("smart-home-access-token");
    await AsyncStorage.removeItem("smart-home-refresh-token");
    setIsLoggedIn(false);
    setAccessToken(null);
    setUser(null);
    router.replace("/login");
  }, [router]);

  const fetchUserInfo = useCallback(async () => {
    const accessToken = await AsyncStorage.getItem("smart-home-access-token");
    if (accessToken) {
      setIsLoggedIn(true);
      setAccessToken(accessToken);
      try {
        const response = await authService.getMe();
        setUser(response.data);
      } catch (error) {
        console.error("Failed to fetch user info:", error);
        setIsLoggedIn(false);
        setAccessToken(null);
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    const handleLogout = async () => {
      const pushToken = await getCurrentPushToken();
      try {
        await authService.logout(pushToken);
      } catch (error) {
        console.error("Logout API error:", error);
      }
      setIsLoggedIn(false);
      setAccessToken(null);
      await AsyncStorage.removeItem("smart-home-access-token");
      await AsyncStorage.removeItem("smart-home-refresh-token");
      setUser(null);
      router.replace("/login");
    };

    fetchUserInfo();

    authEvents.on("logout", handleLogout);

    return () => {
      authEvents.off("logout", handleLogout);
    };
  }, [getCurrentPushToken]);

  const value = useMemo(
    () => ({
      isLoggedIn,
      setIsLoggedIn,
      user,
      setUser,
      fetchUserInfo,
      accessToken,
      setAccessToken,
      logout,
    }),
    [isLoggedIn, user, accessToken, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};

export default AuthProvider;
