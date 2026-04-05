import { RoomService } from "@/service/room.service";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  View,
  Alert,
  ImageSourcePropType,
} from "react-native";
import Toast from "react-native-toast-message";

interface RoomBackground {
  name: string;
  url: ReturnType<typeof require>;
}

import Icon from "react-native-vector-icons/FontAwesome5";


const roomBackgrounds: RoomBackground[] = [
  { name: "living-room.png", url: require("../assets/images/living-room.png") },
  { name: "living-room1.png", url: require("../assets/images/living-room1.png") },
  { name: "living-room2.png", url: require("../assets/images/living-room2.png") },
  { name: "bedroom.png", url: require("../assets/images/bedroom.png") },
  { name: "bedroom1.png", url: require("../assets/images/bedroom1.png") },
  { name: "bedroom2.png", url: require("../assets/images/bedroom2.png") },
];

const RoomUpdateModal = ({
  visible,
  setVisible,
  onClose,
  room,
  onUpdate,
}: {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  onClose?: (room: RoomResponse) => void;
  room: RoomResponse;
  onUpdate: (roomId: string, name: string, backgroundName: string) => void;
}) => {
  const [name, setName] = useState<string>("");
  const [backgroundName, setBackgroundName] = useState<string>("");
  const [loading, setLoading] = useState(false);

  console.log("RoomUpdateModal rendered with room:", room);

  useEffect(() => {
    if (visible) {
      setName(room.name);
      setBackgroundName(room.backgroundName || "");
    }
  }, [visible, room]);

  const handleSave = async () => {
    if (!name?.trim()) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Tên phòng không được để trống.",
      });
      return;
    }
    if (!backgroundName) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng chọn hình nền cho phòng.",
      });
      return;
    }

    setLoading(true);
    try {
      await RoomService.updateRoom(room.id, {
        name: name.trim(),
        backgroundName,
      });

      onUpdate(room.id, name.trim(), backgroundName);
      setVisible(false);
      Toast.show({
        type: "success",
        text1: "Cập nhật thành công",
        text2: `Thông tin phòng đã được cập nhật.`,
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Đã xảy ra lỗi khi cập nhật phòng.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={() => setVisible(false)}
    >
      <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Text style={styles.iconText}><Icon name="door-open" /></Text>
            </View>
            <Text style={styles.title}>Cập nhật phòng</Text>
            <Text style={styles.subtitle}>Cập nhật thông tin phòng</Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Tên phòng"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
          />

          <FlatList
            data={roomBackgrounds}
            keyExtractor={(item) => item.name}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = backgroundName === item.name;
              return (
                <TouchableOpacity
                  style={[styles.roomGroup, isSelected && styles.roomGroupSelected]}
                  onPress={() => setBackgroundName(item.name)}
                  activeOpacity={0.8}
                >
                  <Image source={item.url as ImageSourcePropType} style={styles.roomImage} resizeMode="cover" />
                  {isSelected && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />

          <TouchableOpacity
            style={[styles.confirmBtn, name?.trim() ? styles.confirmBtnActive : null]}
            onPress={handleSave}
            disabled={loading || !name?.trim()}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.confirmBtnText}>Xác nhận Cập nhật</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setVisible(false)}
            style={styles.cancelBtn}
          >
            <Text style={styles.cancelText}>Huỷ bỏ</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fcfffc",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: "85%",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#BBF7D0",
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#DCFCE7",
    borderWidth: 2,
    borderColor: "#86EFAC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  iconText: { fontSize: 60, color: "#22C55E" },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#14532D",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "400",
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
    marginBottom: 12,
  },
  list: {
    marginTop: 4,
    marginBottom: 16,
  },
  roomGroup: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },
  roomGroupSelected: {
    borderColor: "#22C55E",
  },
  roomImage: {
    width: "100%",
    height: 160,
  },
  selectedBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  roomLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
    padding: 6,
    backgroundColor: "#F9FAFB",
  },
  confirmBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#BBF7D0",
    alignItems: "center",
  },
  confirmBtnActive: {
    backgroundColor: "#22C55E",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  cancelBtn: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 8,
  },
  cancelText: {
    color: "#86EFAC",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default RoomUpdateModal;