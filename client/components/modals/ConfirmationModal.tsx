import { Toast } from "@/components/ui/Toast";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from "react-native-modal";

interface ConfirmationModalProps {
  readonly visible: boolean;
  readonly title: string;
  readonly message: string;
  readonly confirmText?: string;
  readonly cancelText?: string;
  readonly iconName?: string;
  readonly isDangerous?: boolean;
  readonly loading?: boolean;
  readonly onConfirm: () => void | Promise<void>;
  readonly onCancel: () => void;
  readonly notificationMessage?: string;
}

export default function ConfirmationModal({
  visible,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy bỏ",
  iconName = "alert-circle",
  isDangerous = false,
  loading = false,
  onConfirm,
  onCancel,
  notificationMessage,
}: ConfirmationModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
    if (notificationMessage) {
      Toast.show({
        type: "success",
        text1: notificationMessage,
      });
    }
  };

  return (
    <Modal
      isVisible={visible}
      onBackButtonPress={onCancel}
      animationIn="fadeIn"
      animationOut="fadeOut"
      backdropOpacity={0}
      style={{ margin: 0 }}
    >
      <Pressable style={s.backdrop} onPress={onCancel}>
        <Pressable style={s.center} onPress={(e) => e.stopPropagation()}>
          <View style={s.card}>
            <View style={[s.iconWrap, isDangerous && s.iconWrapDanger]}>
              <Ionicons
                name={iconName as any}
                size={32}
                color={isDangerous ? "#DC2626" : "#22C55E"}
              />
            </View>

            <Text style={s.title}>{title}</Text>
            <Text style={s.message}>{message}</Text>

            <View style={s.buttonRow}>
              <TouchableOpacity
                style={[s.btn, s.cancelBtn]}
                onPress={onCancel}
                disabled={loading}
              >
                <Text style={s.cancelBtnText}>{cancelText}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.btn, s.confirmBtn, isDangerous && s.confirmBtnDanger]}
                onPress={handleConfirm}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={s.confirmBtnText}>{confirmText}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  card: {
    backgroundColor: "#fcfffc",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
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
    marginBottom: 16,
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  iconWrapDanger: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FECACA",
    shadowColor: "#DC2626",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "400",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  confirmBtn: {
    backgroundColor: "#22C55E",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmBtnDanger: {
    backgroundColor: "#DC2626",
    shadowColor: "#991B1B",
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
