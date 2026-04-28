import AxiosInstance from "@/utils/axios";

export const userService = {
  getAllUsers: () => AxiosInstance.get("/users"),
  addUser: (data: {
    username: string;
    fullName: string;
    password: string;
    role: "admin" | "user";
  }) => AxiosInstance.post("/users", data),
  updateUser: (
    id: string,
    data: { fullName?: string; username?: string; role?: "admin" | "user" },
  ) => AxiosInstance.put(`/users/${id}`, data),
  inactivateUser: (id: string) => AxiosInstance.patch(`/users/${id}/inactive`),
  activateUser: (id: string) => AxiosInstance.patch(`/users/${id}/reactivate`),
};
