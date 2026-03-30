interface UserResponse {
  id: string;
  username: string;
  passwordHash: string;
  fullName: string;
  role: "admin" | "user";
  avatarColor: string;
  avatarInitials: string;
}