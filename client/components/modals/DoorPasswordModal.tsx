import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import LoadingSpinner from "../ui/LoadingSpinner";
import { DeviceService } from "@/service/device.service";
import Toast from "react-native-toast-message";

const DoorPasswordModal = ({
  doorModalVisible,
  setDoorModalVisible,
  pendingDoorDevice,
  pendingAction,
  doAction,
}: {
  doorModalVisible: boolean;
  setDoorModalVisible: (visible: boolean) => void;
  pendingDoorDevice: DeviceInstantControl | null | DeviceResponse;
  pendingAction: string | number;
  doAction: (
    id: string,
    action: string | number,
    password?: string,
  ) => Promise<void>;
}) => {
  const [pinDigits, setPinDigits] = useState(["", "", "", "", "", ""]);
  const [pinError, setPinError] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setPinDigits(["", "", "", "", "", ""]);
    setPinError("");
  }, [pendingDoorDevice, pendingAction]);

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePinChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...pinDigits];
    next[index] = value.slice(-1);
    setPinDigits(next);
    setPinError("");
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !pinDigits[index] && index > 0) {
      const next = [...pinDigits];
      next[index - 1] = "";
      setPinDigits(next);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleConfirmPin = async () => {
    const pin = pinDigits.join("");
    if (pin.length < 6) {
      setPinError("Vui lòng nhập đủ 6 ký tự.");
      triggerShake();
      return;
    }
    setPinLoading(true);
    try {
      const response = await DeviceService.sendCommand(pendingDoorDevice!.id, String(pendingAction), pin);
      if (response.data.code === 403) {
        Toast.show({
          type: "error",
          text1: "Mật khẩu không đúng. Vui lòng thử lại.",
        });
        setPinError("Mật khẩu không đúng. Thử lại.");
        inputRefs.current[0]?.focus();
      } else {
        setDoorModalVisible(false);
        Toast.show({
          type: "success",
          text1: `Đã ${pendingAction === "1" ? "đóng" : "mở"} ${pendingDoorDevice?.name ?? "thiết bị"}.`,
        });
      }
    } catch {
      setPinError("Mật khẩu không đúng. Thử lại.");
      triggerShake();
      inputRefs.current[0]?.focus();
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <Modal
      transparent
      visible={doorModalVisible}
      animationType="fade"
      onRequestClose={() => setDoorModalVisible(false)}
    >
      <Pressable
        style={modalStyles.backdrop}
        onPress={() => setDoorModalVisible(false)}
      >
        <Pressable
          style={modalStyles.sheet}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Icon cửa */}
          <View style={modalStyles.iconWrap}>
            <Text style={modalStyles.iconText}>🔐</Text>
          </View>

          <Text style={modalStyles.title}>Xác nhận mật khẩu</Text>
          <Text style={modalStyles.subtitle}>
            {pendingDoorDevice?.name ?? "Khóa cửa"} —{" "}
            {pendingAction === "1" ? "Đóng thiết bị" : "Mở thiết bị"}
          </Text>

          {/* 6 ô nhập */}
          <Animated.View
            style={[
              modalStyles.pinRow,
              { transform: [{ translateX: shakeAnim }] },
            ]}
          >
            {pinDigits.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => {
                  inputRefs.current[i] = ref;
                }}
                style={[
                  modalStyles.pinBox,
                  digit ? modalStyles.pinBoxFilled : null,
                ]}
                value={digit ? "●" : ""}
                onChangeText={(v) => handlePinChange(v, i)}
                onKeyPress={(e) => handlePinKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                caretHidden
              />
            ))}
          </Animated.View>

          {/* Thông báo lỗi */}
          {!!pinError && <Text style={modalStyles.errorText}>{pinError}</Text>}

          {/* Nút xác nhận */}
          <TouchableOpacity
            style={[
              modalStyles.confirmBtn,
              pinDigits.join("").length === 6 && modalStyles.confirmBtnActive,
              pinLoading && modalStyles.confirmBtnLoading,
            ]}
            onPress={handleConfirmPin}
            disabled={pinLoading}
            activeOpacity={0.8}
          >
            <Text style={modalStyles.confirmBtnText}>
              {pinLoading ? (
                <LoadingSpinner color="#ffffff" size={24} variant="wave" />
              ) : (
                "Xác nhận"
              )}
            </Text>
          </TouchableOpacity>

          {/* Nút huỷ */}
          <TouchableOpacity
            onPress={() => setDoorModalVisible(false)}
            style={modalStyles.cancelBtn}
          >
            <Text style={modalStyles.cancelText}>Huỷ bỏ</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 0,
  },
  sheet: {
    width: "100%",
    backgroundColor: "#fcfffc",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 40,
    alignItems: "center",
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
    marginBottom: 20,
  },

  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#DCFCE7",
    borderWidth: 2,
    borderColor: "#86EFAC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  iconText: { fontSize: 32 },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#14532D",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: "#4ADE80",
    marginBottom: 32,
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: 0.1,
  },

  pinRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  pinBox: {
    width: 46,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#86EFAC",
    backgroundColor: "#FFFFFF",
    color: "#15803D",
    fontSize: 22,
    textAlign: "center",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  pinBoxFilled: {
    borderColor: "#16A34A",
    backgroundColor: "#DCFCE7",
    shadowColor: "#22C55E",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },

  errorText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 12,
    letterSpacing: 0.1,
  },

  confirmBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#BBF7D0",
    alignItems: "center",
    marginTop: 4,
  },
  confirmBtnActive: {
    backgroundColor: "#22C55E",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmBtnLoading: {
    opacity: 0.65,
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  cancelBtn: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  cancelText: {
    color: "#86EFAC",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default DoorPasswordModal;
