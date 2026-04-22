import { useSocket } from "@/contexts/SocketContext";
import { DeviceService } from "@/service/device.service";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ── Sensor config ─────────────────────────────────────────────────────────────
const SENSOR_CONFIG: Record<
  string,
  { emoji: string; label: string; unit: string; color: string; bgColor: string; warnColor: string }
> = {
  temperatureSensor: {
    emoji: "🌡️",
    label: "Nhiệt độ",
    unit: "°C",
    color: "#F97316",
    bgColor: "#FFF7ED",
    warnColor: "#DC2626",
  },
  humiditySensor: {
    emoji: "💧",
    label: "Độ ẩm",
    unit: "%",
    color: "#3B82F6",
    bgColor: "#EFF6FF",
    warnColor: "#7C3AED",
  },
  lightSensor: {
    emoji: "☀️",
    label: "Ánh sáng",
    unit: "lux",
    color: "#F59E0B",
    bgColor: "#FFFBEB",
    warnColor: "#D97706",
  },
};

const getSensorConfig = (type: string) =>
  SENSOR_CONFIG[type] ?? {
    emoji: "📡",
    label: "Cảm biến",
    unit: "",
    color: "#6B7280",
    bgColor: "#F9FAFB",
    warnColor: "#DC2626",
  };

// ── Thermometer illustration ───────────────────────────────────────────────────
const ThermometerIllustration = ({ value, max = 50 }: { value: number; max?: number }) => {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const pct = Math.min(Math.max(value / max, 0), 1);

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: pct,
      duration: 600,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const fillHeight = fillAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 80] });
  const color = pct > 0.8 ? "#EF4444" : pct > 0.5 ? "#F97316" : "#22C55E";

  return (
    <View style={th.container}>
      {/* Thân nhiệt kế */}
      <View style={th.tube}>
        <View style={th.tubeInner}>
          <Animated.View style={[th.fill, { height: fillHeight, backgroundColor: color }]} />
        </View>
      </View>
      {/* Bầu nhiệt kế */}
      <View style={[th.bulb, { backgroundColor: color }]}>
        <View style={th.bulbInner} />
      </View>
      {/* Vạch chia */}
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={[th.tick, { bottom: 28 + i * 16 }]} />
      ))}
    </View>
  );
};

const th = StyleSheet.create({
  container: { width: 32, height: 140, alignItems: "center", justifyContent: "flex-end" },
  tube: {
    width: 18,
    height: 100,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    overflow: "hidden",
    justifyContent: "flex-end",
    marginBottom: -10,
  },
  tubeInner: { width: "100%", height: "100%", justifyContent: "flex-end" },
  fill: { width: "100%", borderRadius: 9 },
  bulb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  bulbInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.5)" },
  tick: {
    position: "absolute",
    right: 0,
    width: 8,
    height: 1.5,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
});

// ── Droplet illustration ───────────────────────────────────────────────────────
const DropletIllustration = ({ value, max = 100 }: { value: number; max?: number }) => {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const pct = Math.min(Math.max(value / max, 0), 1);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: pct,
      duration: 700,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [pct]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const fillHeight = fillAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 90] });
  const color = pct > 0.85 ? "#7C3AED" : pct > 0.6 ? "#3B82F6" : "#60A5FA";

  return (
    <Animated.View style={[dr.outer, { transform: [{ scale: pulseAnim }] }]}>
      <View style={dr.dropBody}>
        <View style={dr.overflow}>
          <Animated.View style={[dr.fill, { height: fillHeight, backgroundColor: color }]} />
        </View>
        {/* Highlight */}
        <View style={dr.highlight} />
      </View>
    </Animated.View>
  );
};

const dr = StyleSheet.create({
  outer: { width: 70, height: 100, alignItems: "center", justifyContent: "center" },
  dropBody: {
    width: 60,
    height: 80,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
    overflow: "hidden",
    transform: [{ rotate: "180deg" }],
  },
  overflow: { width: "100%", height: "100%", justifyContent: "flex-end" },
  fill: { width: "100%", borderRadius: 30 },
  highlight: {
    position: "absolute",
    top: 12,
    left: 10,
    width: 12,
    height: 22,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.25)",
    transform: [{ rotate: "180deg" }],
  },
});

// ── Sun illustration ───────────────────────────────────────────────────────────
const SunIllustration = ({ value, max = 1000 }: { value: number; max?: number }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pct = Math.min(Math.max(value / max, 0), 1);
  const size = 50 + pct * 20;
  const opacity = 0.4 + pct * 0.6;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const color = pct > 0.7 ? "#F97316" : "#FBBF24";

  return (
    <View style={sun.container}>
      {/* Rays */}
      <Animated.View style={[sun.raysContainer, { transform: [{ rotate }] }]}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <View
            key={deg}
            style={[
              sun.ray,
              {
                backgroundColor: color,
                opacity,
                transform: [{ rotate: `${deg}deg` }, { translateY: -(size / 2 + 10) }],
              },
            ]}
          />
        ))}
      </Animated.View>
      {/* Core */}
      <View style={[sun.core, { width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity }]}>
        <View style={sun.coreInner} />
      </View>
    </View>
  );
};

const sun = StyleSheet.create({
  container: { width: 110, height: 110, alignItems: "center", justifyContent: "center" },
  raysContainer: { position: "absolute", width: 110, height: 110, alignItems: "center", justifyContent: "center" },
  ray: { position: "absolute", width: 3, height: 12, borderRadius: 2 },
  core: { alignItems: "center", justifyContent: "center" },
  coreInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
});

// ── Pulse animation for value ─────────────────────────────────────────────────
const AnimatedValue = ({ value, unit, color }: { value: string | number; unit: string; color: string }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value;
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.15, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [value]);

  return (
    <Animated.View style={{ flexDirection: "row", alignItems: "flex-end", transform: [{ scale: scaleAnim }] }}>
      <Text style={[s.valueText, { color }]}>{value ?? "—"}</Text>
      <Text style={[s.unitText, { color }]}>{unit}</Text>
    </Animated.View>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const SensorComponent = ({ device }: { device: DeviceResponse }) => {
  const config = getSensorConfig(device.type);
  const [currentValue, setCurrentValue] = useState<string | number>(device.currentData ?? "—");
  const [threshold, setThreshold] = useState<string | number>(device.threshold ?? "—");
  const [thresholdInput, setThresholdInput] = useState(String(device.threshold ?? ""));
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const { subscribe } = useSocket();

  // Fetch initial current data
  useEffect(() => {
    DeviceService.getCurrentData(device.id)
      .then((res) => setCurrentValue(res.data?.value ?? "—"))
      .catch(() => setCurrentValue("—"))
      .finally(() => setLoadingData(false));
  }, [device.id]);

  // Fetch threshold from device detail
  useEffect(() => {
    DeviceService.getDeviceById(device.id)
      .then((res) => {
        const t = res.data?.threshold;
        if (t !== undefined && t !== null) {
          setThreshold(t);
          setThresholdInput(String(t));
        }
      })
      .catch(() => {});
  }, [device.id]);

  // Real-time subscription
  useEffect(() => {
    const unsubData = subscribe("sensor:data", (data: any) => {
      if (data.deviceId === device.id) {
        setCurrentValue(data.value);
      }
    });
    return () => { unsubData(); };
  }, [subscribe, device.id]);

  const handleSaveThreshold = async () => {
    const val = parseFloat(thresholdInput);
    if (isNaN(val)) {
      Alert.alert("Lỗi", "Giá trị ngưỡng không hợp lệ");
      return;
    }
    setSaving(true);
    try {
      await DeviceService.updateThreshold(device.id, val);
      setThreshold(val);
      setIsEditing(false);
      Alert.alert("Thành công", "Đã cập nhật ngưỡng cảnh báo");
    } catch {
      Alert.alert("Lỗi", "Không thể cập nhật ngưỡng cảnh báo");
    } finally {
      setSaving(false);
    }
  };

  const numericValue = parseFloat(String(currentValue));
  const numericThreshold = parseFloat(String(threshold));
  const isAlert = !isNaN(numericValue) && !isNaN(numericThreshold) && numericValue > numericThreshold;

  const renderIllustration = () => {
    if (device.type === "temperatureSensor")
      return <ThermometerIllustration value={numericValue} max={50} />;
    if (device.type === "humiditySensor")
      return <DropletIllustration value={numericValue} max={100} />;
    if (device.type === "lightSensor")
      return <SunIllustration value={numericValue} max={1000} />;
    return <Text style={{ fontSize: 52 }}>{config.emoji}</Text>;
  };

  return (
    <View style={s.wrapper}>
      {/* ── Top card: value + illustration ── */}
      <View style={[s.valueCard, { backgroundColor: config.color }]}>
        {/* Alert banner */}
        {isAlert && (
          <View style={s.alertBanner}>
            <Text style={s.alertText}>⚠️ Vượt ngưỡng cảnh báo!</Text>
          </View>
        )}

        <View style={s.valueCardInner}>
          {/* Left: value */}
          <View style={s.valueLeft}>
            <View style={s.labelRow}>
              <Text style={s.sensorEmoji}>{config.emoji}</Text>
              <Text style={s.sensorLabel}>{config.label.toUpperCase()}</Text>
            </View>
            {loadingData ? (
              <ActivityIndicator size="large" color="#fff" style={{ marginTop: 16 }} />
            ) : (
              <AnimatedValue value={currentValue} unit={config.unit} color="#fff" />
            )}
            <View style={[s.statusBadge, { backgroundColor: isAlert ? "rgba(220,38,38,0.3)" : "rgba(255,255,255,0.2)" }]}>
              <View style={[s.statusDot, { backgroundColor: isAlert ? "#FCA5A5" : "#BBF7D0" }]} />
              <Text style={s.statusText}>{isAlert ? "Cảnh báo" : "Bình thường"}</Text>
            </View>
          </View>

          {/* Right: illustration */}
          <View style={s.valueRight}>
            {renderIllustration()}
          </View>
        </View>
      </View>

      {/* ── Threshold section ── */}
      <View style={s.thresholdCard}>
        <View style={s.thresholdHeader}>
          <View style={s.thresholdTitleRow}>
            <Text style={s.thresholdIcon}>🔔</Text>
            <Text style={s.thresholdTitle}>Ngưỡng cảnh báo</Text>
          </View>
          {!isEditing && (
            <TouchableOpacity
              style={[s.editBtn, { borderColor: config.color }]}
              onPress={() => { setIsEditing(true); setThresholdInput(String(threshold)); }}
            >
              <Text style={[s.editBtnText, { color: config.color }]}>Chỉnh sửa</Text>
            </TouchableOpacity>
          )}
        </View>

        {isEditing ? (
          <View style={s.editRow}>
            <View style={s.inputWrapper}>
              <TextInput
                style={[s.thresholdInput, { borderColor: config.color }]}
                value={thresholdInput}
                onChangeText={setThresholdInput}
                keyboardType="decimal-pad"
                placeholder="Nhập ngưỡng..."
                placeholderTextColor="#C0C0C0"
              />
              <Text style={[s.inputUnit, { color: config.color }]}>{config.unit}</Text>
            </View>
            <View style={s.editActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setIsEditing(false)}>
                <Text style={s.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saveBtn, { backgroundColor: config.color }]}
                onPress={handleSaveThreshold}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.saveBtnText}>Lưu</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={s.thresholdDisplay}>
            <View style={[s.thresholdValueBox, { backgroundColor: config.bgColor, borderColor: config.color + "33" }]}>
              <Text style={[s.thresholdValue, { color: config.color }]}>{threshold}</Text>
              <Text style={[s.thresholdUnit, { color: config.color }]}>{config.unit}</Text>
            </View>
            <Text style={s.thresholdHint}>Hệ thống sẽ cảnh báo khi vượt ngưỡng này</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  wrapper: { flex: 1 },

  // Value card
  valueCard: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: "hidden",
  },
  alertBanner: {
    backgroundColor: "rgba(220,38,38,0.85)",
    paddingVertical: 7,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  alertText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  valueCardInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
    paddingTop: 20,
  },
  valueLeft: { flex: 1 },
  valueRight: { alignItems: "center", justifyContent: "center", marginLeft: 8 },

  labelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  sensorEmoji: { fontSize: 20 },
  sensorLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },

  valueText: { fontSize: 56, fontWeight: "800", lineHeight: 64 },
  unitText: { fontSize: 22, fontWeight: "600", marginBottom: 8, marginLeft: 4, opacity: 0.85 },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 12,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  // Threshold card
  thresholdCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  thresholdHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  thresholdTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  thresholdIcon: { fontSize: 18 },
  thresholdTitle: { fontSize: 15, fontWeight: "700", color: "#111" },
  editBtn: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  editBtnText: { fontSize: 13, fontWeight: "600" },

  thresholdDisplay: { gap: 10 },
  thresholdValueBox: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  thresholdValue: { fontSize: 36, fontWeight: "800" },
  thresholdUnit: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  thresholdHint: { fontSize: 12, color: "#9CA3AF" },

  // Edit row
  editRow: { gap: 10 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: "#F9FAFB",
  },
  thresholdInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 11,
    color: "#111",
    borderWidth: 0,
  },
  inputUnit: { fontSize: 14, fontWeight: "600", marginLeft: 4 },
  editActions: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  cancelBtnText: { color: "#6B7280", fontWeight: "600", fontSize: 14 },
  saveBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});

export default SensorComponent;
