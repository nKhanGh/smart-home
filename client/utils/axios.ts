import { authEvents } from "@/contexts/auth-events";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    skipAuth?: boolean;
    _retry?: boolean;
  }
}

const axiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

const axiosNoAuth = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

axiosInstance.interceptors.request.use(async (config) => {
  if (!config.skipAuth) {
    const token = await AsyncStorage.getItem("smart-home-access-token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    console.log("Response:", response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem(
          "smart-home-refresh-token",
        );

        const res = await axiosNoAuth.post("/auth/refresh", {
          token: refreshToken,
        });
        console.log("Token refresh response:", res.data);
        const newAccessToken = res.data.accessToken;
        const newRefreshToken = res.data.refreshToken;

        await AsyncStorage.setItem("smart-home-access-token", newAccessToken);
        await AsyncStorage.setItem("smart-home-refresh-token", newRefreshToken);

        axiosInstance.defaults.headers.common["Authorization"] =
          `Bearer ${newAccessToken}`;

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        await AsyncStorage.removeItem("smart-home-access-token");
        await AsyncStorage.removeItem("smart-home-refresh-token");

        authEvents.emit("logout");

        throw refreshError;
      }
    }

    throw error;
  },
);

export default axiosInstance;
