import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
  Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { styles } from "@/styles/(tabs)/(settings)/user-management.styles";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { userService } from "@/service/user.service";

interface User {
  id?: string;
  _id?: string;
  fullName?: string;
  username?: string;
  email?: string;
  role: "admin" | "user";
  avatarColor?: string;
  avatarInitials?: string;
}

const PERMISSIONS = [
  { label: "Xem cảm biến", admin: true, user: true },
  { label: "Điều khiển thiết bị", admin: true, user: true },
  { label: "Xuất dữ liệu", admin: true, user: true },
  { label: "Thêm / xóa phòng", admin: true, user: false },
  { label: "Thay đổi ngưỡng", admin: true, user: false },
  { label: "Quản lý người dùng", admin: true, user: false },
];

const AVATAR_COLORS = ["#4CAF50", "#2196F3", "#9C27B0", "#FF9800", "#F44336", "#00BCD4"];

function getInitials(fullName?: string, username?: string) {
  const name = fullName || username || "";
  return name.split(" ").filter(Boolean).map((n) => n[0].toUpperCase()).slice(-2).join("") || "?";
}

function getAvatarColor(id?: string) {
  if (!id) return AVATAR_COLORS[0];
  const idx = id.charCodeAt(id.length - 1) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

// ---------- Add/Edit Modal ----------
interface UserFormProps {
  visible: boolean;
  mode: "add" | "edit";
  initial?: User | null;
  existingUsernames: string[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

function UserFormModal({ visible, mode, initial, existingUsernames, onClose, onSave }: UserFormProps) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setFullName(initial?.fullName || "");
      setUsername(initial?.username || "");
      setPassword("");
      setRole(initial?.role || "user");
    }
  }, [visible, initial]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập họ tên");
      return;
    }
    if (!username.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên đăng nhập");
      return;
    }
    if (mode === "add" && !password.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mật khẩu");
      return;
    }
    if (mode === "add" && password.trim().length < 8) {
      Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }
    const isDuplicate = existingUsernames
      .filter((u) => mode === "edit" ? u !== initial?.username : true)
      .includes(username.trim().toLowerCase());
    if (isDuplicate) {
      Alert.alert("Lỗi", "Tên đăng nhập này đã tồn tại");
      return;
    }
    setSaving(true);
    try {
      const data: any = { fullName: fullName.trim(), username: username.trim(), role };
      if (mode === "add") data.password = password.trim();
      await onSave(data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {mode === "add" ? "Thêm người dùng mới" : "Chỉnh sửa người dùng"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Họ và tên</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Nguyễn Văn A"
            placeholderTextColor="#C0C0C0"
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.inputLabel}>Tên đăng nhập (Username)</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: nguyenvana"
            placeholderTextColor="#C0C0C0"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          {mode === "add" && (
            <>
              <Text style={styles.inputLabel}>Mật khẩu</Text>
              <TextInput
                style={styles.input}
                placeholder="Tối thiểu 8 ký tự"
                placeholderTextColor="#C0C0C0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </>
          )}

          <Text style={styles.inputLabel}>Vai trò</Text>
          <View style={styles.roleToggleRow}>
            <TouchableOpacity
              style={[styles.roleToggleBtn, role === "user" && styles.roleToggleBtnActive]}
              onPress={() => setRole("user")}
            >
              <Text style={[styles.roleToggleTxt, role === "user" && styles.roleToggleTxtActive]}>
                👤  User
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleToggleBtn, role === "admin" && styles.roleToggleBtnAdminActive]}
              onPress={() => setRole("admin")}
            >
              <Text style={[styles.roleToggleTxt, role === "admin" && styles.roleToggleTxtAdminActive]}>
                👑  Admin
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>{mode === "add" ? "Thêm" : "Lưu"}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---------- Main Screen ----------
export default function UserManagementScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editTarget, setEditTarget] = useState<User | null>(null);

  const isAdmin = user?.role === "admin";

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.getAllUsers();
      setUsers(res.data);
    } catch {
      Alert.alert("Lỗi", "Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAdd = () => {
    setModalMode("add");
    setEditTarget(null);
    setModalVisible(true);
  };

  const openEdit = (u: User) => {
    setModalMode("edit");
    setEditTarget(u);
    setModalVisible(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (modalMode === "add") {
        await userService.addUser(data);
      } else {
        const id = editTarget?._id || editTarget?.id || "";
        await userService.updateUser(id, data);
      }
      setModalVisible(false);
      fetchUsers();
    } catch {
      Alert.alert("Lỗi", modalMode === "add" ? "Không thể thêm người dùng" : "Không thể cập nhật người dùng");
      throw new Error("save failed");
    }
  };

  const handleDelete = (u: User) => {
    const name = u.fullName || u.username || "người dùng này";
    Alert.alert("Xác nhận xóa", `Bạn có chắc muốn xóa "${name}"?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            const id = u._id || u.id || "";
            await userService.deleteUser(id);
            fetchUsers();
          } catch {
            Alert.alert("Lỗi", "Không thể xóa người dùng");
          }
        },
      },
    ]);
  };

  const sortedUsers = [...users].sort((a, b) => {
    const selfId = (user as any)?._id || user?.id;
    const aId = a._id || a.id;
    const bId = b._id || b.id;
    if (aId === selfId) return -1;
    if (bId === selfId) return 1;
    return 0;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F7FAF9" }}>
      <ScrollView contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}>

        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.push("/(tabs)/(settings)")}>
            <Ionicons name="arrow-back" size={28} color="#222" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Người dùng</Text>
            <Text style={styles.headerSub}>Quản lý thành viên hộ gia đình</Text>
          </View>
          {isAdmin && (
            <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
              <Ionicons name="add" size={22} color="#16A34A" />
              <Text style={styles.addBtnText}>Thêm</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Danh sách thành viên */}
        <Text style={styles.memberListHeader}>DANH SÁCH THÀNH VIÊN</Text>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <View style={styles.userList}>
            {sortedUsers.map((u, idx) => {
              const uId = u._id || u.id;
              const selfId = (user as any)?._id || user?.id;
              const isSelf = uId === selfId;
              const initials = u.avatarInitials || getInitials(u.fullName, u.username);
              const avatarBg = u.avatarColor || getAvatarColor(uId);

              return (
                <View key={uId || idx} style={styles.userCard}>
                  <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{u.fullName || u.username || "—"}</Text>
                    {u.username && (
                      <Text style={styles.userUsername}>@{u.username}</Text>
                    )}
                    {u.email && (
                      <Text style={styles.userEmail}>{u.email}</Text>
                    )}
                    <View style={styles.roleRow}>
                      <View style={[styles.roleBadge, u.role === "admin" ? styles.adminBadge : styles.userBadge]}>
                        <Text style={[styles.roleBadgeText, u.role === "admin" ? styles.adminBadgeText : styles.userBadgeText]}>
                          {u.role === "admin" ? "👑  Admin" : "👤  User"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {isSelf ? (
                    <View style={styles.selfBadge}>
                      <Text style={styles.selfBadgeText}>Bạn</Text>
                    </View>
                  ) : isAdmin ? (
                    <View style={styles.actionCol}>
                      <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(u)}>
                        <Ionicons name="create-outline" size={18} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(u)}>
                        <Ionicons name="trash-outline" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        {/* Permissions Table */}
        <View style={styles.permissionTable}>
          <Text style={styles.permissionTitle}>🔒  Quyền hạn theo vai trò</Text>
          <View style={styles.permissionHeaderRow}>
            <Text style={styles.permissionFeatureCell}>Tính năng</Text>
            <Text style={styles.permissionAdminHeader}>Admin</Text>
            <Text style={styles.permissionUserHeader}>User</Text>
          </View>
          <View style={styles.permissionDivider} />
          {PERMISSIONS.map((p, i) => (
            <View
              key={p.label}
              style={[styles.permissionRow, i < PERMISSIONS.length - 1 && styles.permissionRowBorder]}
            >
              <Text style={styles.permissionLabel}>{p.label}</Text>
              <View style={styles.permissionIconCell}>
                <Ionicons
                  name={p.admin ? "checkmark-circle" : "close-circle"}
                  size={26}
                  color={p.admin ? "#22C55E" : "#EF4444"}
                />
              </View>
              <View style={styles.permissionIconCell}>
                <Ionicons
                  name={p.user ? "checkmark-circle" : "close-circle"}
                  size={26}
                  color={p.user ? "#22C55E" : "#EF4444"}
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <UserFormModal
        visible={modalVisible}
        mode={modalMode}
        initial={editTarget}
        existingUsernames={users.map((u) => (u.username || "").toLowerCase())}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}
