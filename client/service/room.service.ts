import axiosInstance from "@/utils/axios";

export const RoomService = {
  getRooms: () => axiosInstance.get<RoomResponse[]>("/rooms"),
  updateRoom: (id: string, data: RoomUpdateRequest) => axiosInstance.put(`/rooms/${id}`, data),
}