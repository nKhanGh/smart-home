import { authService } from "@/service/auth.service";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const checkAndRefreshToken = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem("smart-home-access-token");
    console.log("Current token:", token);
    if (!token) return false;

    const introspectRes = await authService.introspect(token);
    console.log("Introspect response:", introspectRes);
    const { valid } = introspectRes.data.valid ? introspectRes.data : { valid: false };
    if (valid) return true;

    const refreshToken = await AsyncStorage.getItem("smart-home-refresh-token");
    console.log("Current refresh token:", refreshToken);
    if (!refreshToken) return false;

    const refreshRes = await authService.refresh(refreshToken);
    console.log("Refresh response:", refreshRes);
    if (!refreshRes.data.success) return false;

    const { token: newToken, refreshToken: newRefresh } = refreshRes.data.result;
    await AsyncStorage.setItem("smart-home-access-token", newToken);
    await AsyncStorage.setItem("smart-home-refresh-token", newRefresh);
    return true;

  } catch {
    return false;
  }
};