import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { DeviceService } from "@/service/device.service";
import { styles } from "@/styles/(tabs)/(settings)/index.styles";
import Ionicons from "@expo/vector-icons/Ionicons";
import Slider from "@react-native-community/slider";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/FontAwesome6";

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [thresholds, setThresholds] = useState<any[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sliderValues, setSliderValues] = useState<{ [type: string]: number }>(
    {},
  );

  useEffect(() => {
    DeviceService.getThresholdDevices()
      .then((res) => {
        setThresholds(res.data);
        const initial: { [type: string]: number } = {};
        res.data.forEach((d: any) => {
          initial[d.type] =
            typeof d.threshold === "number" ? d.threshold : Number(d.threshold);
        });
        setSliderValues(initial);
      })
      .catch(() => {
        setThresholds([]);
        setSliderValues({});
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSliderValueChange = (deviceType: string, value: number) => {
    setSliderValues((prev) => ({ ...prev, [deviceType]: value }));
  };

  const handleThresholdChange = async (
    deviceId: string,
    value: number,
    deviceType: string,
  ) => {
    setUpdating(deviceType);
    try {
      await DeviceService.updateThreshold(deviceId, value);
    } finally {
      setUpdating(null);
    }
  };

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
            <Text style={styles.userEmailGreen}>{user?.username}</Text>
          </View>
        </View>

        {/* User Management */}
        <Text style={styles.sectionLabel}>QUẢN LÝ NGƯỜI DÙNG</Text>
        <TouchableOpacity style={styles.sectionCard}>
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
    </SafeAreaView>
  );
}
