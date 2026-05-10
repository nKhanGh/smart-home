import { Toast, ToastBanner, ToastType } from "@/components/ui/Toast";
import { ScheduleService } from "@/service/schedule.service";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from "react-native-modal";
import Icon from "react-native-vector-icons/FontAwesome5";
import LoadingSpinner from "../ui/LoadingSpinner";

const SCREEN_H = Dimensions.get("window").height;
const SHEET_MAX_H = Math.round(SCREEN_H * 0.92);

const pad = (n: number) => String(n).padStart(2, "0");

const formatTimeInput = (value: string) => {
  const digits = value.replaceAll(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

const normalizeTimeInput = (value: string) => {
  const text = value.trim();
  if (!text) return null;

  if (text.includes(":")) {
    const [hRaw, mRaw] = text.split(":");
    if (hRaw == null || mRaw == null) return null;
    if (!/^\d{1,2}$/.test(hRaw) || !/^\d{1,2}$/.test(mRaw)) return null;
    const h = Number(hRaw);
    const m = Number(mRaw);
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return `${pad(h)}:${pad(m)}`;
  }

  const digits = text.replaceAll(/\D/g, "");
  if (digits.length < 3 || digits.length > 4) return null;
  const hourPart =
    digits.length === 3 ? digits.slice(0, 1) : digits.slice(0, 2);
  const minutePart = digits.slice(-2);
  const h = Number(hourPart);
  const m = Number(minutePart);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return `${pad(h)}:${pad(m)}`;
};

const getDefaultStartTime = () => {
  const now = new Date();
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const getDefaultEndTime = () => {
  const now = new Date();
  return `${pad((now.getHours() + 1) % 24)}:${pad(now.getMinutes())}`;
};

interface TimeInputRowProps {
  label: string;
  icon: string;
  value: string;
  onChange: (v: string) => void;
}

const TimeInputRow = ({ label, icon, value, onChange }: TimeInputRowProps) => (
  <View style={s.timeInputItem}>
    <View style={s.timeInputLabelWrap}>
      <View style={s.timeInputIconWrap}>
        <Icon name={icon} size={12} color="#16A34A" />
      </View>
      <Text style={s.timeInputLabel}>{label}</Text>
    </View>
    <TextInput
      value={value}
      onChangeText={(text) => onChange(formatTimeInput(text))}
      keyboardType="number-pad"
      maxLength={5}
      placeholder="HH:mm"
      placeholderTextColor="#9CA3AF"
      style={s.timeInputField}
    />
  </View>
);

// ── Number Input ──────────────────────────────────────────────────────────────
const NumInput = ({
  label,
  sublabel,
  value,
  onChange,
  min,
  max,
  unit,
  icon,
  iconColor = "#6B7280",
  onFocus,
}: {
  label: string;
  sublabel?: string;
  value: string;
  onChange: (v: string) => void;
  min: number;
  max: number;
  unit?: string;
  icon: string;
  iconColor?: string;
  onFocus?: () => void;
}) => (
  <View style={ni.wrap}>
    <View style={ni.row}>
      <Icon name={icon} size={12} color={iconColor} />
      <View style={{ flex: 1 }}>
        <Text style={ni.label}>{label}</Text>
        {sublabel && <Text style={ni.sublabel}>{sublabel}</Text>}
      </View>
      <View style={ni.inputWrap}>
        <TextInput
          style={ni.input}
          value={value}
          onChangeText={onChange}
          onFocus={onFocus}
          keyboardType="number-pad"
          maxLength={4}
          placeholder="—"
          placeholderTextColor="#D1D5DB"
        />
        {unit && <Text style={ni.unit}>{unit}</Text>}
      </View>
    </View>
    <Text style={ni.range}>
      {min} – {max}
    </Text>
  </View>
);

const ni = StyleSheet.create({
  wrap: { gap: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  label: { fontSize: 14, fontWeight: "600", color: "#111827" },
  sublabel: { fontSize: 11, color: "#9CA3AF", marginTop: 1 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 72,
  },
  input: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    minWidth: 32,
  },
  unit: { fontSize: 11, color: "#6B7280", fontWeight: "600" },
  range: { fontSize: 10, color: "#D1D5DB", alignSelf: "flex-end" },
});

// ── Day List ──────────────────────────────────────────────────────────────────
const DAY_LIST = [
  { key: "Mon", label: "2" },
  { key: "Tue", label: "3" },
  { key: "Wed", label: "4" },
  { key: "Thu", label: "5" },
  { key: "Fri", label: "6" },
  { key: "Sat", label: "7" },
  { key: "Sun", label: "CN" },
];

// ── Main Modal ────────────────────────────────────────────────────────────────
interface MotionWatchScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  device: DeviceResponse;
  initialSchedule?: MotionWatchScheduleResponse | null;
  onSuccess: () => void;
}

export default function MotionWatchScheduleModal({
  visible,
  onClose,
  device,
  initialSchedule,
  onSuccess,
}: Readonly<MotionWatchScheduleModalProps>) {
  const scrollRef = useRef<ScrollView>(null);
  const [startTime, setStartTime] = useState(getDefaultStartTime());
  const [endTime, setEndTime] = useState(getDefaultEndTime());
  const [repeatDays, setRepeatDays] = useState<string[]>([]);
  const [triggerCount, setTriggerCount] = useState("");
  const [countWindowMinutes, setCountWindowMinutes] = useState("");
  const [minSignalIntervalSeconds, setMinSignalIntervalSeconds] = useState("");
  const [cooldownMinutes, setCooldownMinutes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);

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

  useEffect(() => {
    const handleShow = (e: any) => {
      const nextInset = e?.endCoordinates?.height ?? 0;
      setKeyboardInset(nextInset);
    };
    const handleHide = () => setKeyboardInset(0);

    const showSub = Keyboard.addListener("keyboardDidShow", handleShow);
    const hideSub = Keyboard.addListener("keyboardDidHide", handleHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (initialSchedule) {
      setStartTime(initialSchedule.startTime);
      setEndTime(initialSchedule.endTime);
      setRepeatDays(initialSchedule.repeatDays ?? []);
      setTriggerCount(String(initialSchedule.triggerCount ?? ""));
      setCountWindowMinutes(String(initialSchedule.countWindowMinutes ?? ""));
      setMinSignalIntervalSeconds(
        String(initialSchedule.minSignalIntervalSeconds ?? ""),
      );
      setCooldownMinutes(String(initialSchedule.cooldownMinutes ?? ""));
      setShowAdvanced(
        !!initialSchedule.triggerCount ||
          !!initialSchedule.countWindowMinutes ||
          !!initialSchedule.minSignalIntervalSeconds ||
          !!initialSchedule.cooldownMinutes,
      );
      return;
    }

    setStartTime(getDefaultStartTime());
    setEndTime(getDefaultEndTime());
    setRepeatDays([]);
    setTriggerCount("");
    setCountWindowMinutes("");
    setMinSignalIntervalSeconds("");
    setCooldownMinutes("");
    setShowAdvanced(false);
  }, [visible, initialSchedule]);

  const toggleDay = (key: string) =>
    setRepeatDays((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key],
    );

  const getRepeatText = () => {
    if (repeatDays.length === 0) return "Chọn ngày lặp lại";
    if (repeatDays.length === 7) return "Mỗi ngày";
    return `Mỗi ${repeatDays.map((d) => DAY_LIST.find((x) => x.key === d)?.label).join(", ")}`;
  };

  const handleSubmit = async () => {
    const normalizedStartTime = normalizeTimeInput(startTime);
    const normalizedEndTime = normalizeTimeInput(endTime);

    if (!normalizedStartTime || !normalizedEndTime) {
      showToast("error", "Lỗi", "Vui lòng nhập giờ đúng định dạng HH:mm");
      return;
    }

    if (normalizedStartTime === normalizedEndTime) {
      showToast(
        "error",
        "Lỗi",
        "Giờ bắt đầu và kết thúc không được trùng nhau.",
      );
      return;
    }

    const payload: any = {
      deviceId: device.id,
      startTime: normalizedStartTime,
      endTime: normalizedEndTime,
      repeatDays: repeatDays.length > 0 ? repeatDays : undefined,
      active: initialSchedule?.active ?? true,
    };

    if (triggerCount) payload.triggerCount = Number(triggerCount);
    if (countWindowMinutes)
      payload.countWindowMinutes = Number(countWindowMinutes);
    if (minSignalIntervalSeconds)
      payload.minSignalIntervalSeconds = Number(minSignalIntervalSeconds);
    if (cooldownMinutes) payload.cooldownMinutes = Number(cooldownMinutes);

    setSubmitting(true);
    try {
      if (initialSchedule?._id) {
        await ScheduleService.updateMotionWatchSchedule(
          initialSchedule._id,
          payload,
        );
        Toast.show({ type: "success", text1: "Cập nhật lịch thành công." });
      } else {
        await ScheduleService.createMotionWatchSchedule(payload);
        Toast.show({ type: "success", text1: "Tạo lịch thành công." });
      }
      onSuccess();
      onClose();
    } catch {
      Toast.show({ type: "error", text1: "Có lỗi xảy ra. Vui lòng thử lại." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isVisible={visible}
      onBackButtonPress={onClose}
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
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <View style={s.headerIconWrap}>
              <Icon name="satellite-dish" size={14} color="#16A34A" />
            </View>
            <Text style={s.headerTitle}>
              {initialSchedule
                ? "Chỉnh sửa lịch theo dõi"
                : "Lịch theo dõi chuyển động"}
            </Text>
            <TouchableOpacity
              style={s.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Icon name="times" size={13} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              s.scrollContent,
              { paddingBottom: 40 + keyboardInset },
            ]}
            bounces={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* ── Time range ── */}
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Icon name="clock" size={13} color="#374151" />
                <Text style={s.cardTitle}>Khung giờ theo dõi</Text>
              </View>
              <View style={s.timeInputRow}>
                <TimeInputRow
                  label="Bắt đầu"
                  icon="play"
                  value={startTime}
                  onChange={setStartTime}
                />
                <TimeInputRow
                  label="Kết thúc"
                  icon="stop"
                  value={endTime}
                  onChange={setEndTime}
                />
              </View>
            </View>

            {/* ── Repeat days ── */}
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Icon name="redo" size={13} color="#374151" />
                <Text style={s.cardTitle}>Lặp lại — {getRepeatText()}</Text>
              </View>
              <View style={s.dayRow}>
                {DAY_LIST.map((d) => {
                  const active = repeatDays.includes(d.key);
                  return (
                    <TouchableOpacity
                      key={d.key}
                      style={[s.dayBtn, active && s.dayBtnActive]}
                      onPress={() => toggleDay(d.key)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[s.dayBtnText, active && s.dayBtnTextActive]}
                      >
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ── Advanced toggle ── */}
            <TouchableOpacity
              style={s.advancedToggle}
              onPress={() => setShowAdvanced((v) => !v)}
              activeOpacity={0.7}
            >
              <Icon name="sliders-h" size={13} color="#6B7280" />
              <Text style={s.advancedToggleText}>Cài đặt nâng cao</Text>
              <Icon
                name={showAdvanced ? "chevron-up" : "chevron-down"}
                size={11}
                color="#9CA3AF"
                style={{ marginLeft: "auto" as any }}
              />
            </TouchableOpacity>

            {showAdvanced && (
              <View style={s.card}>
                <NumInput
                  icon="bolt"
                  iconColor="#D97706"
                  label="Số lần kích hoạt"
                  sublabel="Số lần phát hiện để trigger"
                  value={triggerCount}
                  onChange={setTriggerCount}
                  min={1}
                  max={20}
                  unit="lần"
                />
                <View style={s.divider} />
                <NumInput
                  icon="window-restore"
                  iconColor="#2563EB"
                  label="Cửa sổ đếm"
                  sublabel="Thời gian đếm số lần kích"
                  value={countWindowMinutes}
                  onChange={setCountWindowMinutes}
                  min={1}
                  max={120}
                  unit="phút"
                />
                <View style={s.divider} />
                <NumInput
                  icon="filter"
                  iconColor="#7C3AED"
                  label="Khoảng cách tín hiệu tối thiểu"
                  sublabel="Bỏ qua tín hiệu quá gần nhau"
                  value={minSignalIntervalSeconds}
                  onChange={setMinSignalIntervalSeconds}
                  min={0}
                  max={300}
                  unit="giây"
                />
                <View style={s.divider} />
                <NumInput
                  icon="hourglass-half"
                  iconColor="#EF4444"
                  label="Thời gian hồi phục"
                  sublabel="Chờ sau khi trigger xong"
                  value={cooldownMinutes}
                  onChange={setCooldownMinutes}
                  min={0}
                  max={720}
                  unit="phút"
                />
              </View>
            )}

            {/* ── Submit ── */}
            <TouchableOpacity
              style={[
                s.submitBtn,
                submitting && s.submitBtnLoading,
                repeatDays.length === 0 && s.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting || repeatDays.length === 0}
              activeOpacity={0.85}
            >
              {submitting ? (
                <LoadingSpinner variant="wave" color="#fff" size={22} />
              ) : (
                <>
                  <Icon name="check" size={14} color="#fff" />
                  <Text style={s.submitBtnText}>
                    {initialSchedule ? "CẬP NHẬT" : "TẠO LỊCH"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SHEET_MAX_H,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 24,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F4F6",
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: "700", color: "#111827" },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: "#F9FAFB",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    gap: 14,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 7 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#374151" },
  timeInputRow: { flexDirection: "row", gap: 10 },
  timeInputItem: { flex: 1, gap: 8 },
  timeInputLabelWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  timeInputIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  timeInputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  timeInputField: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    letterSpacing: 0.8,
  },
  dayRow: { flexDirection: "row", justifyContent: "space-between" },
  dayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dayBtnActive: { backgroundColor: "#16A34A", borderColor: "#16A34A" },
  dayBtnText: { fontSize: 13, fontWeight: "600", color: "#9CA3AF" },
  dayBtnTextActive: { color: "#fff" },
  advancedToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  advancedToggleText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "#E5E7EB" },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
    paddingVertical: 17,
    borderRadius: 16,
    backgroundColor: "#16A34A",
  },
  submitBtnLoading: { opacity: 0.7 },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 1.2,
  },
  submitBtnDisabled: {
    backgroundColor: "#A7F3D0",
  },
});
