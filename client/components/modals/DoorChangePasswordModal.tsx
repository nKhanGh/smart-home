import { DeviceService } from "@/service/device.service";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/FontAwesome5";

interface DoorPasswordModalProps {
  visible: boolean;
  setVisible: (v: boolean) => void;
  device: DeviceResponse;
}

// ── PIN dots ──────────────────────────────────────────────────────────────────
const PinDots = ({
  value,
  shake,
  error,
}: {
  value: string;
  shake: Animated.Value;
  error?: boolean;
}) => (
  <Animated.View
    style={[
      pin.row,
      {
        transform: [
          {
            translateX: shake.interpolate({
              inputRange: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1],
              outputRange: [0, -8, 8, -8, 8, -4, 0],
            }),
          },
        ],
      },
    ]}
  >
    {Array.from({ length: 6 }).map((_, i) => (
      <View
        key={i}
        style={[
          pin.dot,
          i < value.length && (error ? pin.dotError : pin.dotFilled),
        ]}
      />
    ))}
  </Animated.View>
);

const pin = StyleSheet.create({
  row: { flexDirection: "row", gap: 10, justifyContent: "center" },
  dot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: "#BBF7D0",
    backgroundColor: "transparent",
  },
  dotFilled: { backgroundColor: "#22C55E", borderColor: "#22C55E" },
  dotError: { backgroundColor: "#EF4444", borderColor: "#EF4444" },
});

// ── Strength bar ──────────────────────────────────────────────────────────────
const StrengthBar = ({ value }: { value: string }) => {
  if (!value) return null;
  let level = 0, label = "", color = "#E5E7EB";
  if (value.length >= 4) { level = 1; label = "Yếu"; color = "#EF4444"; }
  if (value.length >= 5) { level = 2; label = "Trung bình"; color = "#F59E0B"; }
  if (value.length >= 6) { level = 3; label = "Mạnh"; color = "#22C55E"; }
  return (
    <View style={str.row}>
      {[1, 2, 3].map((l) => (
        <View key={l} style={[str.bar, { backgroundColor: l <= level ? color : "#E5E7EB" }]} />
      ))}
      <Text style={[str.label, { color }]}>{label}</Text>
    </View>
  );
};

const str = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  bar: { flex: 1, height: 3, borderRadius: 2 },
  label: { fontSize: 10, fontWeight: "700", width: 62, textAlign: "right" },
});

// ── Field ─────────────────────────────────────────────────────────────────────
const Field = ({
  label, icon, value, onChange, error, inputRef,
}: {
  label: string;
  icon: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  inputRef?: React.RefObject<TextInput>;
}) => {
  const [show, setShow] = useState(false);
  return (
    <View style={f.wrap}>
      <Text style={f.label}>{label}</Text>
      <View style={[f.row, !!error && f.rowError]}>
        <Icon name={icon} size={13} color={error ? "#EF4444" : "#9CA3AF"} style={{ width: 18 }} />
        <TextInput
          ref={inputRef}
          style={f.input}
          value={value}
          onChangeText={(t) => onChange(t.replace(/\D/g, ""))}
          placeholder="• • • • • •"
          placeholderTextColor="#D1D5DB"
          secureTextEntry={!show}
          keyboardType="number-pad"
          maxLength={6}
          autoCorrect={false}
        />
        <TouchableOpacity onPress={() => setShow((s) => !s)} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name={show ? "eye-slash" : "eye"} size={13} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
      {!!error && (
        <View style={f.errRow}>
          <Icon name="exclamation-circle" size={10} color="#EF4444" />
          <Text style={f.err}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const f = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 11, fontWeight: "700", color: "#6B7280", letterSpacing: 0.5, textTransform: "uppercase" },
  row: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#F3F4F6", borderRadius: 14,
    borderWidth: 1.5, borderColor: "transparent",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rowError: { borderColor: "#FCA5A5", backgroundColor: "#FFF5F5" },
  input: { flex: 1, fontSize: 18, fontWeight: "600", color: "#111827", letterSpacing: 4 },
  errRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  err: { fontSize: 11, color: "#EF4444", fontWeight: "500" },
});

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DoorChangePasswordModal({ visible, setVisible, device }: DoorPasswordModalProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ old?: string; new?: string; confirm?: string }>({});

  const shakeOld = useRef(new Animated.Value(0)).current;
  const shakeNew = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
    }
  }, [visible]);

  const triggerShake = (anim: Animated.Value) => {
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  };

  const validate = () => {
    const e: typeof errors = {};
    if (oldPassword.length < 4) e.old = "Mật khẩu cũ phải có ít nhất 4 chữ số.";
    if (newPassword.length < 4) e.new = "Mật khẩu mới phải có ít nhất 4 chữ số.";
    else if (newPassword === oldPassword) e.new = "Mật khẩu mới phải khác mật khẩu cũ.";
    if (confirmPassword !== newPassword) e.confirm = "Xác nhận mật khẩu không khớp.";
    setErrors(e);
    if (e.old) triggerShake(shakeOld);
    if (e.new || e.confirm) triggerShake(shakeNew);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!validate()) return;
    setLoading(true);
    try {
      await DeviceService.changePassword(device.id, newPassword, oldPassword);
      Toast.show({ type: "success", text1: "Đổi mật khẩu thành công", text2: "Cửa đã được cập nhật mật khẩu mới." });
      setVisible(false);
    } catch (err: any) {
      const msg: string = err?.response?.data?.message ?? "";
      if (/password|incorrect|wrong|invalid/i.test(msg)) {
        setErrors({ old: "Mật khẩu cũ không đúng." });
        triggerShake(shakeOld);
      } else {
        Toast.show({ type: "error", text1: "Đổi mật khẩu thất bại.", text2: "Vui lòng thử lại." });
      }
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = oldPassword.length >= 4 && newPassword.length >= 4 && confirmPassword.length >= 4;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={() => setVisible(false)}
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={s.backdrop} onPress={() => { Keyboard.dismiss(); setVisible(false); }}>
          <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
            {/* Handle */}
            <View style={s.handle} />

            {/* Header */}
            <View style={s.header}>
              <View style={s.iconWrap}>
                <Icon name="key" size={26} color="#22C55E" />
              </View>
              <Text style={s.title}>Đổi mật khẩu cửa</Text>
              <Text style={s.subtitle}>{device.name}</Text>
            </View>

            {/* PIN dots preview */}
            <View style={s.pinRow}>
              <View style={s.pinBlock}>
                <Text style={s.pinLabel}>Hiện tại</Text>
                <PinDots value={oldPassword} shake={shakeOld} error={!!errors.old} />
              </View>
              <View style={s.pinArrow}>
                <Icon name="long-arrow-alt-right" size={16} color="#BBF7D0" />
              </View>
              <View style={s.pinBlock}>
                <Text style={s.pinLabel}>Mới</Text>
                <PinDots value={newPassword} shake={shakeNew} error={!!errors.new} />
              </View>
            </View>

            {/* Fields */}
            <View style={s.fields}>
              <Field
                label="Mật khẩu hiện tại"
                icon="unlock"
                value={oldPassword}
                onChange={(v) => { setOldPassword(v); setErrors((e) => ({ ...e, old: undefined })); }}
                error={errors.old}
              />

              <Field
                label="Mật khẩu mới"
                icon="lock"
                value={newPassword}
                onChange={(v) => { setNewPassword(v); setErrors((e) => ({ ...e, new: undefined })); }}
                error={errors.new}
              />
              <StrengthBar value={newPassword} />

              <Field
                label="Xác nhận mật khẩu mới"
                icon="check-circle"
                value={confirmPassword}
                onChange={(v) => { setConfirmPassword(v); setErrors((e) => ({ ...e, confirm: undefined })); }}
                error={errors.confirm}
              />
            </View>

            {/* Confirm */}
            <TouchableOpacity
              style={[s.confirmBtn, canSubmit && s.confirmBtnActive]}
              onPress={handleSave}
              disabled={loading || !canSubmit}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.confirmBtnText}>Xác nhận đổi mật khẩu</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setVisible(false)} style={s.cancelBtn}>
              <Text style={s.cancelText}>Huỷ bỏ</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
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
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#BBF7D0",
    alignSelf: "center", marginBottom: 20,
  },

  // Header
  header: { alignItems: "center", marginBottom: 20 },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "#DCFCE7",
    borderWidth: 2, borderColor: "#86EFAC",
    alignItems: "center", justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  title: { fontSize: 20, fontWeight: "700", color: "#14532D", letterSpacing: -0.3, marginBottom: 4 },
  subtitle: { fontSize: 13, color: "#6B7280" },

  // PIN row
  pinRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F0FDF4", borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 20,
    marginBottom: 20, gap: 4,
  },
  pinBlock: { flex: 1, alignItems: "center", gap: 8 },
  pinLabel: { fontSize: 10, fontWeight: "700", color: "#86EFAC", textTransform: "uppercase", letterSpacing: 0.5 },
  pinArrow: { paddingHorizontal: 8 },

  // Fields
  fields: { gap: 14, marginBottom: 24 },

  // Confirm
  confirmBtn: {
    width: "100%", paddingVertical: 16,
    borderRadius: 16, backgroundColor: "#BBF7D0",
    alignItems: "center",
  },
  confirmBtnActive: {
    backgroundColor: "#22C55E",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  confirmBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", letterSpacing: 0.2 },

  cancelBtn: { marginTop: 12, alignItems: "center", paddingVertical: 8 },
  cancelText: { color: "#86EFAC", fontSize: 14, fontWeight: "500" },
});