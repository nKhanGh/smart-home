import UserChangePasswordModal from "@/components/modals/UserChangePasswordModal";
import UserProfileModal from "@/components/modals/UserProfileModal";
import { useAuth } from "@/contexts/AuthContext";
import { styles } from "@/styles/(tabs)/(settings)/index.styles";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/FontAwesome6";

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error("Logout failed:", e);
      Alert.alert("Lỗi", "Đăng xuất thất bại");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Cài đặt</Text>
            <Text style={styles.headerSub}>Cấu hình & Tài khoản</Text>
          </View>
          <View
            style={[
              styles.avatar,
              { backgroundColor: user?.avatarColor || "#22C55E" },
            ]}
          >
            <Text style={styles.avatarText}>{user?.avatarInitials || "U"}</Text>
          </View>
        </View>

        {/* User Card */}
        <View style={styles.userCardGreen}>
          <View style={styles.avatarBig}>
            <Text style={styles.avatarBigText}>
              {user?.avatarInitials || "U"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userNameGreen}>
              {user?.fullName || "Chưa đăng nhập"}
            </Text>
            <Text style={styles.userRoleGreen}>
              {user?.role === "admin" ? "👑 Quản trị viên" : "👤 Thành viên"}
            </Text>
            <Text style={styles.userEmailGreen}>@{user?.username}</Text>
          </View>
        </View>

        {/* User Action Buttons */}
        <View style={styles.userActionRow}>
          <TouchableOpacity
            style={styles.userActionBtn}
            onPress={() => setProfileVisible(true)}
          >
            <Ionicons name="pencil-outline" size={18} color="#fff" />
            <Text style={styles.userActionText}>Hồ sơ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.userActionBtn}
            onPress={() => setChangePasswordVisible(true)}
          >
            <Ionicons name="lock-closed-outline" size={18} color="#fff" />
            <Text style={styles.userActionText}>Mật khẩu</Text>
          </TouchableOpacity>
        </View>

        {/* User Management */}
        <Text style={styles.sectionLabel}>QUẢN LÝ NGƯỜI DÙNG</Text>
        <TouchableOpacity
          style={styles.sectionCard}
          onPress={() => router.push("/(tabs)/(settings)/user-management")}
        >
          <View style={styles.sectionIcon}>
            <Text style={{ fontSize: 20 }}>👥</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionText}>Thành viên hộ gia đình</Text>
            <Text style={styles.sectionSubText}>
              Thêm, xóa, phân quyền người dùng
            </Text>
          </View>
          <Icon name="angle-right" size={20} color="#A0A0A0" />
        </TouchableOpacity>

        {/* Data Section */}
        <Text style={styles.sectionLabel}>DỮ LIỆU</Text>
        <TouchableOpacity style={styles.sectionCard}>
          <View style={styles.sectionIcon}>
            <Text style={{ fontSize: 20 }}>📋</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionText}>Toàn bộ nhật ký hoạt động</Text>
            <Text style={styles.sectionSubText}>
              Xem lịch sử bật, tắt thiết bị
            </Text>
          </View>
          <Icon name="angle-right" size={20} color="#A0A0A0" />
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="exit-outline" size={22} color="#DC2626" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>

      <UserChangePasswordModal
        visible={changePasswordVisible}
        onClose={() => setChangePasswordVisible(false)}
      />

      <UserProfileModal
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
        initialFullName={user?.fullName}
        initialUsername={user?.username}
        onSuccess={() => {
          // Optionally refresh user data
        }}
      />
    </SafeAreaView>
  );
}
