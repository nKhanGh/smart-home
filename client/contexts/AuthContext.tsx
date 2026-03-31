import { authService } from "@/service/auth.service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";

import { EventEmitter } from 'eventemitter3';
export const emitter = new EventEmitter();

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

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('smart-home-access-token');
    await AsyncStorage.removeItem('smart-home-refresh-token');
    setIsLoggedIn(false);
    setAccessToken(null);
    setUser(null);
    emitter.emit('logout');
  }, []);

  const fetchUserInfo = useCallback(async () => {
    const accessToken = await AsyncStorage.getItem("smart-home-access-token");
    if (accessToken){
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
    const handleLogout = () => {
      setIsLoggedIn(false);
      setAccessToken(null);
      AsyncStorage.removeItem('smart-home-access-token');
      AsyncStorage.removeItem('smart-home-refresh-token');
      setUser(null);
      router.replace("/login");
    };

    fetchUserInfo();

     emitter.on('logout', handleLogout);

    return () => {
      emitter.off('logout', handleLogout);
    };
  }, [])

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
    [isLoggedIn, user, accessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export default AuthProvider;