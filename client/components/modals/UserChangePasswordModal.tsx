import { Toast, ToastBanner, ToastType } from "@/components/ui/Toast";
import { userService } from "@/service/user.service";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from "react-native-modal";

interface UserChangePasswordModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
}

export default function UserChangePasswordModal({
  visible,
  onClose,
}: UserChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState<{
    type: ToastType;
    text1: string;
    text2?: string;
  } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hàm show toast nội bộ
  const showToast = (type: ToastType, text1: string, text2?: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, text1, text2 });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowOld(false);
    setShowNew(false);
    setShowConfirm(false);
    onClose();
  };

  const validate = () => {
    if (!oldPassword.trim()) {
      showToast("error", "Lỗi", "Vui lòng nhập mật khẩu cũ");
      return false;
    }
    if (!newPassword.trim()) {
      showToast("error", "Lỗi", "Vui lòng nhập mật khẩu mới");
      return false;
    }
    if (oldPassword === newPassword) {
      showToast("error", "Lỗi", "Mật khẩu mới phải khác mật khẩu cũ");
      return false;
    }
    if (newPassword.length < 8) {
      showToast("error", "Lỗi", "Mật khẩu mới phải ít nhất 8 ký tự");
      return false;
    }
    if (newPassword !== confirmPassword) {
      showToast("error", "Lỗi", "Mật khẩu xác nhận không trùng khớp");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await userService.changePassword(oldPassword, newPassword);
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã thay đổi mật khẩu thành công.",
      });
      handleClose();
    } catch (error: any) {
      const message = error?.response?.data?.msg || "Không thể đổi mật khẩu";
      showToast("error", "Lỗi", message);
      console.log("Change password error:", error.response);
    } finally {
      setLoading(false);
    }
  };

  const isValid =
    oldPassword.trim().length > 0 &&
    newPassword.trim().length >= 8 &&
    newPassword === confirmPassword;

  return (
    <Modal
      isVisible={visible}
      onBackButtonPress={handleClose}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0}
      style={{ margin: 0 }}
    >
      {toast && (
        <ToastBanner
          type={toast.type}
          text1={toast.text1}
          text2={toast.text2}
          onDismiss={() => setToast(null)}
        />
      )}
      <Pressable style={s.backdrop} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={s.keyboardAvoid}
        >
          <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={s.handle} />

            {/* ScrollView để cuộn khi bàn phím che input cuối */}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={s.header}>
                <View style={s.iconWrap}>
                  <Ionicons name="lock-closed" size={28} color="#22C55E" />
                </View>
                <Text style={s.title}>Đổi mật khẩu</Text>
                <Text style={s.subtitle}>
                  Cập nhật mật khẩu tài khoản của bạn
                </Text>
              </View>

              <Text style={s.label}>Mật khẩu cũ</Text>
              <View style={s.inputWrapper}>
                <TextInput
                  style={s.input}
                  placeholder="Nhập mật khẩu cũ"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showOld}
                  value={oldPassword}
                  onChangeText={setOldPassword}
                />
                <TouchableOpacity onPress={() => setShowOld(!showOld)}>
                  <Ionicons
                    name={showOld ? "eye" : "eye-off"}
                    size={20}
                    color="#A0A0A0"
                  />
                </TouchableOpacity>
              </View>

              <Text style={s.label}>Mật khẩu mới</Text>
              <View style={s.inputWrapper}>
                <TextInput
                  style={s.input}
                  placeholder="Nhập mật khẩu mới (ít nhất 8 ký tự)"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showNew}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                  <Ionicons
                    name={showNew ? "eye" : "eye-off"}
                    size={20}
                    color="#A0A0A0"
                  />
                </TouchableOpacity>
              </View>

              <Text style={s.label}>Xác nhận mật khẩu mới</Text>
              <View style={s.inputWrapper}>
                <TextInput
                  style={s.input}
                  placeholder="Nhập lại mật khẩu mới"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  <Ionicons
                    name={showConfirm ? "eye" : "eye-off"}
                    size={20}
                    color="#A0A0A0"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[s.submitBtn, isValid && s.submitBtnActive]}
                onPress={handleSubmit}
                disabled={loading || !isValid}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={s.submitText}>Đổi mật khẩu</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleClose} style={s.cancelBtn}>
                <Text style={s.cancelText}>Huỷ bỏ</Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
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
    maxHeight: "90%",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 24,
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: "flex-end",
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
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
    marginTop: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingHorizontal: 18,
    gap: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
  },
  submitBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#BBF7D0",
    alignItems: "center",
    marginTop: 24,
  },
  submitBtnActive: {
    backgroundColor: "#22C55E",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  submitText: {
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
