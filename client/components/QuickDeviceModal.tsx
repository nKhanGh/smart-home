import {
  Animated,
  Modal,
  Pressable,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { DeviceService } from "@/service/device.service";

const getDeviceIcon = (type: string) => {
  switch (type) {
    case "airConditionerDevice": return "❄️";
    case "heaterDevice": return "🔥";
    case "lightDevice": return "💡";
    case "fanDevice": return "🌀";
    case "doorDevice": return "🚪";
    default: return "🔌";
  }
};

const QuickDeviceModal = ({
  visible,
  setVisible,
  selectedDevices,
  onConfirm,
}: {
  visible: boolean;
  setVisible: (v: boolean) => void;
  selectedDevices: DeviceInstantControl[];
  onConfirm: (selectedIds: string[]) => Promise<void>;
}) => {
  const [chosen, setChosen] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [allDevices, setAllDevices] = useState<DeviceResponse[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;


  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await DeviceService.getAll();
        setAllDevices(response.data.filter(d => d.type.endsWith("Device")));
      } catch (err) {
        console.error("Failed to fetch devices:", err);
      }
    };
    if (visible) {
      setChosen(selectedDevices.map((d) => d.id));
      setError("");
      fetchDevices();
    }
  }, [visible]);

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  };

  const toggleDevice = (id: string) => {
    setError("");
    if (chosen.includes(id)) {
      setChosen((prev) => prev.filter((d) => d !== id));
    } else {
      if (chosen.length >= 4) {
        setError("Chỉ được chọn tối đa 4 thiết bị.");
        triggerShake();
        return;
      }
      setChosen((prev) => [...prev, id]);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(chosen);
      setVisible(false);
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Group theo phòng
  const grouped = allDevices.reduce<Record<string, DeviceResponse[]>>((acc, device) => {
    const roomName = device.roomId.name;
    if (!acc[roomName]) acc[roomName] = [];
    acc[roomName].push(device);
    return acc;
  }, {});

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
              <Text style={styles.iconText}>⚡</Text>
            </View>
            <Text style={styles.title}>Chọn thiết bị nhanh</Text>
            <Text style={styles.subtitle}>
              Đã chọn{" "}
              <Text style={styles.countHighlight}>{chosen.length}</Text>
              /4 thiết bị
            </Text>
          </View>

          {/* Slot indicators */}
          <Animated.View style={[styles.slotRow, { transform: [{ translateX: shakeAnim }] }]}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[styles.slot, i < chosen.length && styles.slotFilled]}
              >
                {i < chosen.length ? (
                  <Text style={styles.slotIcon}>
                    {getDeviceIcon(
                      allDevices.find((d) => d._id === chosen[i])?.type ?? ""
                    )}
                  </Text>
                ) : (
                  <Text style={styles.slotPlus}>+</Text>
                )}
              </View>
            ))}
          </Animated.View>

          {/* Error */}
          {!!error && <Text style={styles.errorText}>{error}</Text>}

          {/* Danh sách thiết bị theo phòng */}
          <FlatList
            data={Object.entries(grouped)}
            keyExtractor={([room]) => room}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: [roomName, devices] }) => (
              <View style={styles.roomGroup}>
                <Text style={styles.roomLabel}>{roomName}</Text>
                {devices.map((device) => {
                  const isSelected = chosen.includes(device._id);
                  const isDisabled = !isSelected && chosen.length >= 4;
                  return (
                    <TouchableOpacity
                      key={device._id}
                      style={[
                        styles.deviceRow,
                        isSelected && styles.deviceRowSelected,
                        isDisabled && styles.deviceRowDisabled,
                      ]}
                      onPress={() => toggleDevice(device._id)}
                      activeOpacity={0.7}
                      disabled={isDisabled}
                    >
                      <View style={[styles.deviceIconWrap, isSelected && styles.deviceIconWrapSelected]}>
                        <Text style={styles.deviceIcon}>{getDeviceIcon(device.type)}</Text>
                      </View>
                      <View style={styles.deviceInfo}>
                        <Text style={[styles.deviceName, isDisabled && styles.deviceNameDisabled]}>
                          {device.name}
                        </Text>
                        <Text style={styles.deviceDesc}>{device.description || device.type}</Text>
                      </View>
                      {/* Checkbox */}
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          />

          {/* Confirm */}
          <TouchableOpacity
            style={[styles.confirmBtn, chosen.length > 0 && styles.confirmBtnActive]}
            onPress={handleConfirm}
            disabled={loading || chosen.length === 0}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.confirmBtnText}>
                Xác nhận ({chosen.length} thiết bị)
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setVisible(false)} style={styles.cancelBtn}>
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

  // ── Header ──
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
  iconText: { fontSize: 28 },
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
  countHighlight: {
    color: "#22C55E",
    fontWeight: "700",
  },

  // ── Slot indicators ──
  slotRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginBottom: 8,
  },
  slot: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#86EFAC",
    borderStyle: "dashed",
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  slotFilled: {
    borderStyle: "solid",
    borderColor: "#16A34A",
    backgroundColor: "#DCFCE7",
  },
  slotIcon: { fontSize: 22 },
  slotPlus: {
    fontSize: 20,
    color: "#86EFAC",
    fontWeight: "300",
  },

  // ── Error ──
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.1,
  },

  // ── List ──
  list: {
    marginTop: 12,
    marginBottom: 16,
  },
  roomGroup: {
    marginBottom: 16,
  },
  roomLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#22C55E",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
    paddingLeft: 4,
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  deviceRowSelected: {
    borderColor: "#16A34A",
    backgroundColor: "#F0FDF4",
  },
  deviceRowDisabled: {
    opacity: 0.4,
  },
  deviceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  deviceIconWrapSelected: {
    backgroundColor: "#DCFCE7",
  },
  deviceIcon: { fontSize: 20 },
  deviceInfo: { flex: 1 },
  deviceName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  deviceNameDisabled: { color: "#9CA3AF" },
  deviceDesc: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: "#22C55E",
    borderColor: "#16A34A",
  },
  checkmark: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },

  // ── Buttons ──
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

export default QuickDeviceModal;