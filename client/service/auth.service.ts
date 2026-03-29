import AxiosInstance from "../utils/axios";

export const authService = {
  login: (username: string, password: string) => {
    return AxiosInstance.post("/auth/login", { username, password });
  },

  introspect: (token: string) => {
    return AxiosInstance.post("/auth/introspect", { token });
  },

  refresh: (refreshToken: string) => {
    return AxiosInstance.post("/auth/refresh", { token: refreshToken });
  },

  logout: () => {
    return AxiosInstance.post("/auth/logout");
  },
};
