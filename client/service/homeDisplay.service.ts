import axiosInstance from "@/utils/axios";

export const HomeDisplayService = {
  getHomeDisplayData: () => axiosInstance.get<HomeDisplayResponse>("/home-display"),
  updateHomeDisplayData: (data: UpdateHomeDisplayData) => axiosInstance.put("/home-display", data),
}