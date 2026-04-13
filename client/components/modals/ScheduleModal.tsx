import { ScheduleService } from "@/service/schedule.service";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/FontAwesome5";
import LoadingSpinner from "../ui/LoadingSpinner";

const SCREEN_H = Dimensions.get("window").height;
const SHEET_MAX_H = Math.round(SCREEN_H * 0.88);

const SIDE_ITEMS = 1;
const ITEM_H = 58;
const VISIBLE = SIDE_ITEMS * 2 + 1; // 3
const PICKER_H = ITEM_H * VISIBLE; // 174

const DAY_LIST = [
  { key: "Mon", label: "2" },
  { key: "Tue", label: "3" },
  { key: "Wed", label: "4" },
  { key: "Thu", label: "5" },
  { key: "Fri", label: "6" },
  { key: "Sat", label: "7" },
  { key: "Sun", label: "CN" },
];

const pad = (n: number) => String(n).padStart(2, "0");
const HOURS = Array.from({ length: 24 }, (_, i) => pad(i));
const MINUTES = Array.from({ length: 60 }, (_, i) => pad(i));

// ── Circular Drum Picker ─────────────────────────────────────────────────────
const CLONE_REPS = 3; // giảm render để mượt hơn

interface DrumPickerProps {
  data: string[];
  value: string;
  onChange: (v: string) => void;
}

const DrumPicker = ({ data, value, onChange }: DrumPickerProps) => {
  const LEN = data.length;

  // Thực ra ta build đơn giản hơn: toàn bộ extended = data lặp (2*CLONE_REPS+1) lần
  // OFFSET = CLONE_REPS * LEN (số item phía trước data gốc)
  const TOTAL_REPS = CLONE_REPS * 2 + 1;
  const extData = useMemo(() => {
    const arr: Array<{ key: string; value: string }> = [];
    for (let rep = 0; rep < TOTAL_REPS; rep++) {
      for (let i = 0; i < LEN; i++) {
        arr.push({ key: `${rep}-${data[i]}-${i}`, value: data[i] });
      }
    }
    return arr;
  }, [TOTAL_REPS, LEN, data]);
  const EXT_OFFSET = CLONE_REPS * LEN; // index item đầu tiên của "data gốc" trong extData

  const currentIdx = data.indexOf(value);

  // offsetRef: số pixel list đã dịch lên (dương = list đi lên, item đi xuống)
  // item tại extIndex i hiển thị tại y = i * ITEM_H - offsetRef
  // Center của picker = PICKER_H / 2 = SIDE_ITEMS * ITEM_H + ITEM_H/2
  // Để item i nằm ở center: i * ITEM_H - offsetRef = SIDE_ITEMS * ITEM_H
  // => offsetRef = (i - SIDE_ITEMS) * ITEM_H
  // Vị trí ban đầu: item (EXT_OFFSET + currentIdx) ở center
  const initialScrollOffset = (EXT_OFFSET + currentIdx) * ITEM_H;

  // Dùng translateY = -scrollOffset (list dịch lên = translateY âm)
  // Nhưng ta cần center item nằm ở row SIDE_ITEMS của picker (y = SIDE_ITEMS * ITEM_H)
  // translateY bù = SIDE_ITEMS * ITEM_H (đẩy list xuống để item đầu không bị cắt)
  // Tổng translateY = SIDE_ITEMS * ITEM_H - scrollOffset
  const toTranslateY = (scrollOffset: number) =>
    SIDE_ITEMS * ITEM_H - scrollOffset;

  const animVal = useRef(
    new Animated.Value(toTranslateY(initialScrollOffset)),
  ).current;
  const scrollOffsetRef = useRef(initialScrollOffset);

  // liveExtIdx: index trong extData[] đang ở vùng center (chỉ cập nhật theo nấc)
  const [liveExtIdx, setLiveExtIdx] = useState(EXT_OFFSET + currentIdx);
  const liveExtIdxRef = useRef(EXT_OFFSET + currentIdx);

  // Listener để track animated value realtime → cập nhật liveDataIdx
  useEffect(() => {
    const id = animVal.addListener(({ value: ty }) => {
      // scrollOffset = SIDE_ITEMS * ITEM_H - ty
      const scrollOffset = SIDE_ITEMS * ITEM_H - ty;
      const extIdx = Math.round(scrollOffset / ITEM_H);
      if (extIdx !== liveExtIdxRef.current) {
        liveExtIdxRef.current = extIdx;
        setLiveExtIdx(extIdx);
      }
    });
    return () => animVal.removeListener(id);
  }, [LEN]);

  // Khi value thay đổi từ ngoài → scroll đến đúng vị trí (không animation)
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const targetDataIdx = data.indexOf(value);
    if (targetDataIdx < 0) return;
    const currentExtIdx = Math.round(scrollOffsetRef.current / ITEM_H);
    const currentDataIdx = ((currentExtIdx % LEN) + LEN) % LEN;
    const delta = targetDataIdx - currentDataIdx;
    // Chọn hướng ngắn nhất
    let d = delta;
    if (Math.abs(delta + LEN) < Math.abs(d)) d = delta + LEN;
    if (Math.abs(delta - LEN) < Math.abs(d)) d = delta - LEN;
    const newScrollOffset = scrollOffsetRef.current + d * ITEM_H;
    scrollOffsetRef.current = newScrollOffset;
    animVal.setValue(toTranslateY(newScrollOffset));
  }, [value]);

  const snapTo = (targetScrollOffset: number, velocityPxPerMs = 0) => {
    // Snap đến bội số của ITEM_H gần nhất
    const snapped = Math.round(targetScrollOffset / ITEM_H) * ITEM_H;

    Animated.spring(animVal, {
      toValue: toTranslateY(snapped),
      damping: 20,
      stiffness: 220,
      mass: 0.6,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      scrollOffsetRef.current = snapped;

      // Teleport về vùng gốc nếu quá xa
      const extIdx = Math.round(snapped / ITEM_H);
      const teleportExtIdx =
        EXT_OFFSET + ((((extIdx - EXT_OFFSET) % LEN) + LEN) % LEN);
      if (teleportExtIdx !== extIdx) {
        const newOffset = teleportExtIdx * ITEM_H;
        scrollOffsetRef.current = newOffset;
        animVal.setValue(toTranslateY(newOffset));
      }

      // Emit value
      const finalExtIdx = Math.round(scrollOffsetRef.current / ITEM_H);
      liveExtIdxRef.current = finalExtIdx;
      setLiveExtIdx(finalExtIdx);
      const dataIdx = ((finalExtIdx % LEN) + LEN) % LEN;
      if (data[dataIdx] !== value) onChange(data[dataIdx]);
    });
  };

  // PanResponder refs
  const startPageY = useRef(0);
  const startScrollOffset = useRef(0);
  const lastPageY = useRef(0);
  const lastTime = useRef(0);
  const velocity = useRef(0); // px/ms, dương = kéo xuống

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 3,
      onShouldBlockNativeResponder: () => true,

      onPanResponderGrant: (e) => {
        // Dừng animation đang chạy, lấy offset hiện tại
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
        if (dt > 0) {
          // velocity: dương khi kéo xuống (pageY tăng = list đi xuống = scroll offset giảm)
          const instantV = (pageY - lastPageY.current) / dt;
          velocity.current = velocity.current * 0.7 + instantV * 0.3;
        }
        lastPageY.current = pageY;
        lastTime.current = now;

        // Kéo xuống (dy > 0) → list đi xuống → scrollOffset giảm (xem item nhỏ hơn)
        const dy = pageY - startPageY.current;
        const newScrollOffset = startScrollOffset.current - dy;
        scrollOffsetRef.current = newScrollOffset;
        animVal.setValue(toTranslateY(newScrollOffset));
      },

      onPanResponderRelease: () => {
        // Momentum: velocity dương (kéo xuống) → scroll về item nhỏ hơn
        const momentumPx = Math.max(
          -ITEM_H * 2.5,
          Math.min(ITEM_H * 2.5, -velocity.current * 140),
        );
        const targetScrollOffset = scrollOffsetRef.current + momentumPx;
        snapTo(targetScrollOffset, Math.abs(velocity.current));
      },

      onPanResponderTerminate: () => {
        snapTo(scrollOffsetRef.current);
      },
    }),
  ).current;

  // Web: dùng wheel event
  const handleWheel = (e: any) => {
    e?.preventDefault?.();
    const newScrollOffset = scrollOffsetRef.current + e.deltaY * 0.8;
    scrollOffsetRef.current = newScrollOffset;
    snapTo(newScrollOffset, Math.abs(e.deltaY) * 0.01);
  };

  return (
    <View
      style={drum.wrap}
      {...(Platform.OS === "web" ? {} : panResponder.panHandlers)}
      {...(Platform.OS === "web" ? ({ onWheel: handleWheel } as any) : {})}
    >
      {/* Animated list — bắt đầu từ y=0, dịch bằng translateY */}
      <Animated.View style={{ transform: [{ translateY: animVal }] }}>
        {extData.map((item, i) => {
          const isAimed = i === liveExtIdx;

          return (
            <View key={item.key} style={drum.item}>
              <Text
                style={{
                  fontSize: 40,
                  fontWeight: "600",
                  color: isAimed ? "#16A34A" : "#6B7280",
                  opacity: 1,
                  includeFontPadding: false,
                  letterSpacing: -1,
                }}
              >
                {item.value}
              </Text>
            </View>
          );
        })}
      </Animated.View>

      {/* Fade overlay trên/dưới */}
      <View style={drum.fadeTop} pointerEvents="none" />
      <View style={drum.fadeBottom} pointerEvents="none" />

      {/* Selector lines */}
      <View style={drum.selectorTop} pointerEvents="none" />
      <View style={drum.selectorBottom} pointerEvents="none" />
    </View>
  );
};

const drum = StyleSheet.create({
  wrap: {
    width: 130,
    height: PICKER_H,
    overflow: "hidden",
    position: "relative",
  },
  item: {
    height: ITEM_H,
    alignItems: "center",
    justifyContent: "center",
  },
  selectorTop: {
    position: "absolute",
    top: ITEM_H * SIDE_ITEMS,
    left: 10,
    right: 10,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#9CA3AF",
    zIndex: 10,
  },
  selectorBottom: {
    position: "absolute",
    top: ITEM_H * (SIDE_ITEMS + 1),
    left: 10,
    right: 10,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#9CA3AF",
    zIndex: 10,
  },
  fadeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: ITEM_H * SIDE_ITEMS,
    backgroundColor: "rgba(255,255,255,0.88)",
    zIndex: 9,
  },
  fadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: ITEM_H * SIDE_ITEMS,
    backgroundColor: "rgba(255,255,255,0.88)",
    zIndex: 9,
  },
});

// ── Main Modal ───────────────────────────────────────────────────────────────
interface ScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  device: DeviceResponse;
  editingSchedule?: ScheduleResponse | null;
  onSuccess: () => void;
}

const ScheduleModal = ({
  visible,
  onClose,
  device,
  editingSchedule,
  onSuccess,
}: ScheduleModalProps) => {
  const isEditing = Boolean(editingSchedule);

  const [hour, setHour] = useState("00");
  const [minute, setMinute] = useState("00");
  const [action, setAction] = useState<"on" | "off">("on");
  const [repeatDays, setRepeatDays] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (editingSchedule) {
      const [h, m] = (editingSchedule.triggerTime ?? "00:00").split(":");
      setHour(pad(Number(h)));
      setMinute(pad(Number(m)));
      setAction(editingSchedule.action);
      setRepeatDays(editingSchedule.repeatDays ?? []);
    } else {
      const now = new Date();
      setHour(pad(now.getHours()));
      setMinute(pad(now.getMinutes()));
      setAction("on");
      setRepeatDays([]);
    }
  }, [visible, editingSchedule]);

  const toggleDay = (key: string) => {
    setRepeatDays((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key],
    );
  };

  const getRepeatText = () => {
    if (repeatDays.length === 0) return "Chỉ một lần";
    if (repeatDays.length === 7) return "Mỗi ngày";
    return `Mỗi ${repeatDays
      .map((d) => DAY_LIST.find((x) => x.key === d)?.label)
      .join(", ")}`;
  };

  const handleSubmit = async () => {
    const payload: ScheduleRequest = {
      deviceId: device.id,
      triggerTime: `${hour}:${minute}`,
      action,
      repeatDays,
    };
    if (payload.repeatDays.length === 0) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng chọn ngày lặp lại.",
      });
      return;
    }
    setSubmitting(true);
    try {
      if (isEditing && editingSchedule) {
        await ScheduleService.updateSchedule(editingSchedule._id, payload);
        Toast.show({ type: "success", text1: "Cập nhật lịch thành công." });
      } else {
        await ScheduleService.createSchedule(payload);
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
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <View style={s.headerIconWrap}>
              <Icon name="clock" size={14} color="#16A34A" />
            </View>
            <Text style={s.headerTitle}>
              {isEditing ? "Chỉnh sửa lịch" : "Thêm lịch mới"}
            </Text>
            <TouchableOpacity
              style={s.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Icon name="times" size={13} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* ── Time Picker ── */}
          <View style={s.pickerContainer}>
            <DrumPicker data={HOURS} value={hour} onChange={setHour} />
            <Text style={s.colon}>:</Text>
            <DrumPicker data={MINUTES} value={minute} onChange={setMinute} />
          </View>

          {/* ── Repeat days ── */}
          <View style={s.daySection}>
            <Text style={s.daySectionLabel}>{getRepeatText()}</Text>
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

          {/* ── Action toggle ── */}
          <View style={s.actionToggleWrap}>
            <TouchableOpacity
              style={[s.actionTab, action === "on" && s.actionTabActive]}
              onPress={() => setAction("on")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  s.actionTabText,
                  action === "on" && s.actionTabTextActive,
                ]}
              >
                Bật tự động
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionTab, action === "off" && s.actionTabActiveOff]}
              onPress={() => setAction("off")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  s.actionTabText,
                  action === "off" && s.actionTabTextActiveOff,
                ]}
              >
                Tắt tự động
              </Text>
            </TouchableOpacity>
          </View>

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
              <Text style={s.submitBtnText}>
                {isEditing ? "LƯU THAY ĐỔI" : "THÊM LỊCH"}
              </Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

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
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F4F6",
  },
  colon: {
    fontSize: 44,
    fontWeight: "300",
    color: "#374151",
    marginHorizontal: 2,
    marginBottom: 4,
  },
  daySection: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    gap: 12,
  },
  daySectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
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
  dayBtnActive: {
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
  },
  dayBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  dayBtnTextActive: {
    color: "#fff",
  },
  actionToggleWrap: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  actionTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 11,
    alignItems: "center",
  },
  actionTabActive: {
    backgroundColor: "#16A34A",
  },
  actionTabActiveOff: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  actionTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  actionTabTextActive: {
    color: "#fff",
  },
  actionTabTextActiveOff: {
    color: "#111827",
  },
  submitBtn: {
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 17,
    borderRadius: 16,
    backgroundColor: "#16A34A",
    alignItems: "center",
  },
  submitBtnLoading: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 1.2,
  },
});

export default ScheduleModal;
