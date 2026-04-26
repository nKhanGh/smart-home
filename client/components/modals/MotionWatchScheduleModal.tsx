import { ScheduleService } from "@/service/schedule.service";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
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
import Icon from "react-native-vector-icons/FontAwesome5";
import LoadingSpinner from "../ui/LoadingSpinner";

const SCREEN_H = Dimensions.get("window").height;
const SHEET_MAX_H = Math.round(SCREEN_H * 0.92);

// ── Drum Picker ───────────────────────────────────────────────────────────────
const SIDE_ITEMS = 2;
const ITEM_H = 58;
const VISIBLE = SIDE_ITEMS * 2 + 1;
const PICKER_H = ITEM_H * VISIBLE;
const CLONE_REPS = 5;

const pad = (n: number) => String(n).padStart(2, "0");
const HOURS = Array.from({ length: 24 }, (_, i) => pad(i));
const MINUTES = Array.from({ length: 60 }, (_, i) => pad(i));

interface DrumPickerProps {
  data: string[];
  value: string;
  onChange: (v: string) => void;
}

const DrumPicker = ({ data, value, onChange }: DrumPickerProps) => {
  const LEN = data.length;
  const TOTAL_REPS = CLONE_REPS * 2 + 1;
  const extData: string[] = [];
  for (let i = 0; i < TOTAL_REPS; i++) extData.push(...data);
  const EXT_OFFSET = CLONE_REPS * LEN;

  const currentIdx = data.indexOf(value);
  const initialScrollOffset = (EXT_OFFSET + currentIdx) * ITEM_H;
  const toTY = (scrollOffset: number) => SIDE_ITEMS * ITEM_H - scrollOffset;

  const animVal = useRef(new Animated.Value(toTY(initialScrollOffset))).current;
  const scrollOffsetRef = useRef(initialScrollOffset);
  const [liveDataIdx, setLiveDataIdx] = useState(currentIdx);

  useEffect(() => {
    const id = animVal.addListener(({ value: ty }) => {
      const scrollOffset = SIDE_ITEMS * ITEM_H - ty;
      const extIdx = Math.round(scrollOffset / ITEM_H);
      const dataIdx = ((extIdx % LEN) + LEN) % LEN;
      setLiveDataIdx(dataIdx);
    });
    return () => animVal.removeListener(id);
  }, [LEN]);

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    const targetDataIdx = data.indexOf(value);
    if (targetDataIdx < 0) return;
    const currentExtIdx = Math.round(scrollOffsetRef.current / ITEM_H);
    const currentDataIdx = ((currentExtIdx % LEN) + LEN) % LEN;
    const delta = targetDataIdx - currentDataIdx;
    let d = delta;
    if (Math.abs(delta + LEN) < Math.abs(d)) d = delta + LEN;
    if (Math.abs(delta - LEN) < Math.abs(d)) d = delta - LEN;
    const newScrollOffset = scrollOffsetRef.current + d * ITEM_H;
    scrollOffsetRef.current = newScrollOffset;
    animVal.setValue(toTY(newScrollOffset));
  }, [value]);

  const snapTo = (targetScrollOffset: number, velocityPxPerMs = 0) => {
    const snapped = Math.round(targetScrollOffset / ITEM_H) * ITEM_H;
    const dist = Math.abs(snapped - scrollOffsetRef.current);
    const duration = Math.max(80, Math.min(350, dist / (Math.abs(velocityPxPerMs) * 0.8 + 0.5)));
    Animated.timing(animVal, {
      toValue: toTY(snapped),
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      scrollOffsetRef.current = snapped;
      const extIdx = Math.round(snapped / ITEM_H);
      const teleportExtIdx = EXT_OFFSET + (((extIdx - EXT_OFFSET) % LEN) + LEN) % LEN;
      if (teleportExtIdx !== extIdx) {
        const newOffset = teleportExtIdx * ITEM_H;
        scrollOffsetRef.current = newOffset;
        animVal.setValue(toTY(newOffset));
      }
      const finalExtIdx = Math.round(scrollOffsetRef.current / ITEM_H);
      const dataIdx = ((finalExtIdx % LEN) + LEN) % LEN;
      if (data[dataIdx] !== value) onChange(data[dataIdx]);
    });
  };

  const startPageY = useRef(0);
  const startScrollOffset = useRef(0);
  const lastPageY = useRef(0);
  const lastTime = useRef(0);
  const velocity = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 3,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (e) => {
        animVal.stopAnimation((currentTY) => {
          const currentScrollOffset = SIDE_ITEMS * ITEM_H - currentTY;
          scrollOffsetRef.current = currentScrollOffset;
          animVal.setValue(currentTY);
        });
        startPageY.current = e.nativeEvent.pageY;
        startScrollOffset.current = scrollOffsetRef.current;
        lastPageY.current = e.nativeEvent.pageY;
        lastTime.current = Date.now();
        velocity.current = 0;
      },
      onPanResponderMove: (e) => {
        const pageY = e.nativeEvent.pageY;
        const now = Date.now();
        const dt = now - lastTime.current;
        if (dt > 0) velocity.current = (pageY - lastPageY.current) / dt;
        lastPageY.current = pageY;
        lastTime.current = now;
        const dy = pageY - startPageY.current;
        const newScrollOffset = startScrollOffset.current - dy;
        scrollOffsetRef.current = newScrollOffset;
        animVal.setValue(toTY(newScrollOffset));
      },
      onPanResponderRelease: () => {
        const momentumPx = -velocity.current * 180;
        snapTo(scrollOffsetRef.current + momentumPx, Math.abs(velocity.current));
      },
      onPanResponderTerminate: () => snapTo(scrollOffsetRef.current),
    })
  ).current;

  const handleWheel = (e: any) => {
    e?.preventDefault?.();
    snapTo(scrollOffsetRef.current + e.deltaY * 0.8, Math.abs(e.deltaY) * 0.01);
  };

  return (
    <View
      style={drum.wrap}
      {...(Platform.OS !== "web" ? panResponder.panHandlers : {})}
      {...(Platform.OS === "web" ? { onWheel: handleWheel } as any : {})}
    >
      <Animated.View style={{ transform: [{ translateY: animVal }] }}>
        {extData.map((item, i) => {
          const dist = Math.abs(i - (EXT_OFFSET + liveDataIdx));
          const circDist = Math.min(dist, LEN - dist);
          let fontSize: number, fontWeight: "400" | "700", color: string, opacity: number;
          if (circDist === 0)      { fontSize = 52; fontWeight = "700"; color = "#111827"; opacity = 1; }
          else if (circDist === 1) { fontSize = 36; fontWeight = "400"; color = "#6B7280"; opacity = 0.45; }
          else if (circDist === 2) { fontSize = 27; fontWeight = "400"; color = "#9CA3AF"; opacity = 0.25; }
          else                     { fontSize = 20; fontWeight = "400"; color = "#9CA3AF"; opacity = 0.07; }
          return (
            <View key={i} style={drum.item}>
              <Text style={{ fontSize, fontWeight, color, opacity, includeFontPadding: false, letterSpacing: -1 }}>
                {item}
              </Text>
            </View>
          );
        })}
      </Animated.View>
      <View style={drum.fadeTop} pointerEvents="none" />
      <View style={drum.fadeBottom} pointerEvents="none" />
      <View style={drum.selectorTop} pointerEvents="none" />
      <View style={drum.selectorBottom} pointerEvents="none" />
    </View>
  );
};

const drum = StyleSheet.create({
  wrap: { width: 120, height: PICKER_H, overflow: "hidden", position: "relative" },
  item: { height: ITEM_H, alignItems: "center", justifyContent: "center" },
  selectorTop: { position: "absolute", top: ITEM_H * SIDE_ITEMS, left: 10, right: 10, height: StyleSheet.hairlineWidth, backgroundColor: "#9CA3AF", zIndex: 10 },
  selectorBottom: { position: "absolute", top: ITEM_H * (SIDE_ITEMS + 1), left: 10, right: 10, height: StyleSheet.hairlineWidth, backgroundColor: "#9CA3AF", zIndex: 10 },
  fadeTop: { position: "absolute", top: 0, left: 0, right: 0, height: ITEM_H * SIDE_ITEMS, backgroundColor: "rgba(255,255,255,0.88)", zIndex: 9 },
  fadeBottom: { position: "absolute", bottom: 0, left: 0, right: 0, height: ITEM_H * SIDE_ITEMS, backgroundColor: "rgba(255,255,255,0.88)", zIndex: 9 },
});

// ── Time Picker Row ───────────────────────────────────────────────────────────
interface TimePickerRowProps {
  label: string;
  icon: string;
  hour: string;
  minute: string;
  onHourChange: (v: string) => void;
  onMinuteChange: (v: string) => void;
}

const TimePickerRow = ({ label, icon, hour, minute, onHourChange, onMinuteChange }: TimePickerRowProps) => (
  <View style={tp.wrap}>
    <View style={tp.labelRow}>
      <View style={tp.labelIcon}>
        <Icon name={icon} size={12} color="#16A34A" />
      </View>
      <Text style={tp.label}>{label}</Text>
    </View>
    <View style={tp.pickerRow}>
      <DrumPicker data={HOURS} value={hour} onChange={onHourChange} />
      <Text style={tp.colon}>:</Text>
      <DrumPicker data={MINUTES} value={minute} onChange={onMinuteChange} />
    </View>
  </View>
);

const tp = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center" },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  labelIcon: { width: 24, height: 24, borderRadius: 8, backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center" },
  label: { fontSize: 12, fontWeight: "700", color: "#374151", textTransform: "uppercase", letterSpacing: 0.5 },
  pickerRow: { flexDirection: "row", alignItems: "center" },
  colon: { fontSize: 40, fontWeight: "300", color: "#374151", marginHorizontal: 2, marginBottom: 4 },
});

// ── Number Input ──────────────────────────────────────────────────────────────
const NumInput = ({
  label, sublabel, value, onChange, min, max, unit, icon, iconColor = "#6B7280",
}: {
  label: string; sublabel?: string; value: string; onChange: (v: string) => void;
  min: number; max: number; unit?: string; icon: string; iconColor?: string;
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
          keyboardType="number-pad"
          maxLength={4}
          placeholder="—"
          placeholderTextColor="#D1D5DB"
        />
        {unit && <Text style={ni.unit}>{unit}</Text>}
      </View>
    </View>
    <Text style={ni.range}>{min} – {max}</Text>
  </View>
);

const ni = StyleSheet.create({
  wrap: { gap: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  label: { fontSize: 14, fontWeight: "600", color: "#111827" },
  sublabel: { fontSize: 11, color: "#9CA3AF", marginTop: 1 },
  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#F3F4F6", borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB",
    paddingHorizontal: 10, paddingVertical: 6, minWidth: 72,
  },
  input: { fontSize: 16, fontWeight: "700", color: "#111827", textAlign: "center", minWidth: 32 },
  unit: { fontSize: 11, color: "#6B7280", fontWeight: "600" },
  range: { fontSize: 10, color: "#D1D5DB", alignSelf: "flex-end" },
});

// ── Day List ──────────────────────────────────────────────────────────────────
const DAY_LIST = [
  { key: "Mon", label: "2" }, { key: "Tue", label: "3" },
  { key: "Wed", label: "4" }, { key: "Thu", label: "5" },
  { key: "Fri", label: "6" }, { key: "Sat", label: "7" },
  { key: "Sun", label: "CN" },
];

// ── Main Modal ────────────────────────────────────────────────────────────────
interface MotionWatchScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  device: DeviceResponse;
  onSuccess: () => void;
}

export default function MotionWatchScheduleModal({
  visible, onClose, device, onSuccess,
}: MotionWatchScheduleModalProps) {
  const now = new Date();

  const [startHour, setStartHour] = useState(pad(now.getHours()));
  const [startMinute, setStartMinute] = useState(pad(now.getMinutes()));
  const [endHour, setEndHour] = useState(pad((now.getHours() + 1) % 24));
  const [endMinute, setEndMinute] = useState(pad(now.getMinutes()));
  const [repeatDays, setRepeatDays] = useState<string[]>([]);
  const [triggerCount, setTriggerCount] = useState("");
  const [countWindowMinutes, setCountWindowMinutes] = useState("");
  const [minSignalIntervalSeconds, setMinSignalIntervalSeconds] = useState("");
  const [cooldownMinutes, setCooldownMinutes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const n = new Date();
    setStartHour(pad(n.getHours()));
    setStartMinute(pad(n.getMinutes()));
    setEndHour(pad((n.getHours() + 1) % 24));
    setEndMinute(pad(n.getMinutes()));
    setRepeatDays([]);
    setTriggerCount("");
    setCountWindowMinutes("");
    setMinSignalIntervalSeconds("");
    setCooldownMinutes("");
    setShowAdvanced(false);
  }, [visible]);

  const toggleDay = (key: string) =>
    setRepeatDays((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );

  const getRepeatText = () => {
    if (repeatDays.length === 0) return "Chỉ một lần";
    if (repeatDays.length === 7) return "Mỗi ngày";
    return `Mỗi ${repeatDays.map((d) => DAY_LIST.find((x) => x.key === d)?.label).join(", ")}`;
  };

  const handleSubmit = async () => {
    const startTime = `${startHour}:${startMinute}`;
    const endTime = `${endHour}:${endMinute}`;

    if (startTime === endTime) {
      Toast.show({ type: "error", text1: "Giờ bắt đầu và kết thúc không được trùng nhau." });
      return;
    }

    const payload: any = {
      deviceId: device.id,
      startTime,
      endTime,
      repeatDays: repeatDays.length > 0 ? repeatDays : undefined,
      active: true,
    };

    if (triggerCount)               payload.triggerCount = Number(triggerCount);
    if (countWindowMinutes)         payload.countWindowMinutes = Number(countWindowMinutes);
    if (minSignalIntervalSeconds)   payload.minSignalIntervalSeconds = Number(minSignalIntervalSeconds);
    if (cooldownMinutes)            payload.cooldownMinutes = Number(cooldownMinutes);

    setSubmitting(true);
    try {
      await ScheduleService.createMotionWatchSchedule(payload);
      Toast.show({ type: "success", text1: "Tạo lịch thành công." });
      onSuccess();
      onClose();
    } catch {
      Toast.show({ type: "error", text1: "Có lỗi xảy ra. Vui lòng thử lại." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <View style={s.headerIconWrap}>
              <Icon name="satellite-dish" size={14} color="#16A34A" />
            </View>
            <Text style={s.headerTitle}>Lịch theo dõi chuyển động</Text>
            <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Icon name="times" size={13} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scrollContent}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Time range ── */}
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Icon name="clock" size={13} color="#374151" />
                <Text style={s.cardTitle}>Khung giờ theo dõi</Text>
              </View>
              <View style={s.timeRow}>
                <TimePickerRow
                  label="Bắt đầu" icon="play"
                  hour={startHour} minute={startMinute}
                  onHourChange={setStartHour} onMinuteChange={setStartMinute}
                />
                <View style={s.timeDivider} />
                <TimePickerRow
                  label="Kết thúc" icon="stop"
                  hour={endHour} minute={endMinute}
                  onHourChange={setEndHour} onMinuteChange={setEndMinute}
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
                      <Text style={[s.dayBtnText, active && s.dayBtnTextActive]}>
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
                size={11} color="#9CA3AF"
                style={{ marginLeft: "auto" as any }}
              />
            </TouchableOpacity>

            {showAdvanced && (
              <View style={s.card}>
                <NumInput
                  icon="bolt" iconColor="#D97706"
                  label="Số lần kích hoạt" sublabel="Số lần phát hiện để trigger"
                  value={triggerCount} onChange={setTriggerCount} min={1} max={20} unit="lần"
                />
                <View style={s.divider} />
                <NumInput
                  icon="window-restore" iconColor="#2563EB"
                  label="Cửa sổ đếm" sublabel="Thời gian đếm số lần kích"
                  value={countWindowMinutes} onChange={setCountWindowMinutes} min={1} max={120} unit="phút"
                />
                <View style={s.divider} />
                <NumInput
                  icon="filter" iconColor="#7C3AED"
                  label="Khoảng cách tín hiệu tối thiểu" sublabel="Bỏ qua tín hiệu quá gần nhau"
                  value={minSignalIntervalSeconds} onChange={setMinSignalIntervalSeconds} min={0} max={300} unit="giây"
                />
                <View style={s.divider} />
                <NumInput
                  icon="hourglass-half" iconColor="#EF4444"
                  label="Thời gian hồi phục" sublabel="Chờ sau khi trigger xong"
                  value={cooldownMinutes} onChange={setCooldownMinutes} min={0} max={720} unit="phút"
                />
              </View>
            )}

            {/* ── Submit ── */}
            <TouchableOpacity
              style={[s.submitBtn, submitting && s.submitBtnLoading]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <LoadingSpinner variant="wave" color="#fff" size={22} />
              ) : (
                <>
                  <Icon name="check" size={14} color="#fff" />
                  <Text style={s.submitBtnText}>TẠO LỊCH</Text>
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
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: SHEET_MAX_H,
    shadowColor: "#000", shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 24,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB",
    alignSelf: "center", marginTop: 12, marginBottom: 4,
  },
  header: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#F3F4F6",
  },
  headerIconWrap: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#DCFCE7",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: "700", color: "#111827" },
  closeBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center",
  },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: "#F9FAFB", borderRadius: 18,
    borderWidth: 1, borderColor: "#E5E7EB", padding: 16, gap: 14,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 7 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#374151" },
  timeRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
  },
  timeDivider: { width: 1, height: PICKER_H * 0.6, backgroundColor: "#E5E7EB" },
  dayRow: { flexDirection: "row", justifyContent: "space-between" },
  dayBtn: {
    width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center",
    backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB",
  },
  dayBtnActive: { backgroundColor: "#16A34A", borderColor: "#16A34A" },
  dayBtnText: { fontSize: 13, fontWeight: "600", color: "#9CA3AF" },
  dayBtnTextActive: { color: "#fff" },
  advancedToggle: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#F9FAFB", borderRadius: 14,
    borderWidth: 1, borderColor: "#E5E7EB", paddingHorizontal: 14, paddingVertical: 12,
  },
  advancedToggleText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "#E5E7EB" },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, marginTop: 4, paddingVertical: 17, borderRadius: 16, backgroundColor: "#16A34A",
  },
  submitBtnLoading: { opacity: 0.7 },
  submitBtnText: { fontSize: 15, fontWeight: "700", color: "#fff", letterSpacing: 1.2 },
});