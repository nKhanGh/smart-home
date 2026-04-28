import { DeviceService } from "@/service/device.service";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardEvent,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

interface DeviceEditModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly device?: DeviceResponse;
  readonly onSuccess?: () => void;
}

export default function DeviceEditModal({
  visible,
  onClose,
  device,
  onSuccess,
}: DeviceEditModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (visible && device) {
      setName(device.name);
      setDescription(device.description || "");
    }
  }, [visible, device]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (e: KeyboardEvent) =>
      setKeyboardHeight(e.endCoordinates.height);
    const onHide = () => setKeyboardHeight(0);

    const sub1 = Keyboard.addListener(showEvent, onShow);
    const sub2 = Keyboard.addListener(hideEvent, onHide);
    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, []);

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const validate = () => {
    if (!name.trim()) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng nhập tên thiết bị",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate() || !device) return;
    setLoading(true);
    try {
      await DeviceService.updateDevice(device.id, {
        name: name.trim(),
        description: description.trim(),
      });
      Toast.show({
        type: "success",
        text1: "Cập nhật thành công",
        text2: "Thông tin thiết bị đã được cập nhật.",
      });
      onSuccess?.();
      handleClose();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Không thể cập nhật thông tin thiết bị";
      Toast.show({ type: "error", text1: "Lỗi", text2: message });
    } finally {
      setLoading(false);
    }
  };

  const isValid = name.trim().length > 0;
  const hasChanges =
    name !== device?.name || description !== (device?.description || "");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={s.backdrop} onPress={handleClose}>
        <Pressable
          style={[
            s.sheet,
            { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 16 : 40 },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={s.handle} />

          <View style={s.header}>
            <View style={s.iconWrap}>
              <Ionicons name="settings" size={28} color="#22C55E" />
            </View>
            <Text style={s.title}>Chỉnh sửa thiết bị</Text>
            <Text style={s.subtitle}>Cập nhật thông tin thiết bị</Text>
          </View>

          <ScrollView
            contentContainerStyle={s.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={s.label}>Tên thiết bị</Text>
            <TextInput
              style={s.input}
              placeholder="VD: Đèn phòng khách"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
            />

            <Text style={s.label}>Mô tả</Text>
            <TextInput
              style={[s.input, s.textArea]}
              placeholder="VD: Đèn LED RGB ở góc phòng khách"
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </ScrollView>

          <TouchableOpacity
            style={[s.submitBtn, isValid && hasChanges && s.submitBtnActive]}
            onPress={handleSubmit}
            disabled={loading || !isValid || !hasChanges}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={s.submitText}>Lưu thay đổi</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleClose} style={s.cancelBtn}>
            <Text style={s.cancelText}>Huỷ bỏ</Text>
          </TouchableOpacity>
        </Pressable>
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
    paddingBottom: 40,
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
  scrollContainer: {
    paddingBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
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
