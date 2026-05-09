import { DeviceService } from "@/service/device.service";
import { ThresholdService } from "@/service/threshold.service";
import { getUnit } from "@/utils/devices.util";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from "react-native-modal";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/FontAwesome5";
import LoadingSpinner from "../ui/LoadingSpinner";

// ─── Types ───────────────────────────────────────────────────────────────────

type ActionType = "on" | "off" | "alert";
type WhenType = "above" | "below";
type StepType = 1 | 2 | 3;

interface ThresholdFormData {
  sensor: DeviceResponse | ThresholdSensorResponse | null;
  action: ActionType | null;
  when: WhenType | null;
  value: string;
}

interface ThresholdModalProps {
  visible: boolean;
  onClose: () => void;
  device: DeviceResponse;
  editingThreshold?: ThresholdResponse | null;
  onSuccess: () => void;
}

// ─── Constraint map ───────────────────────────────────────────────────────────

const getSensorByAction = (
  deviceType: string,
): Partial<Record<ActionType, string[]>> => {
  switch (deviceType) {
    case "lightDevice":
      return {
        on: ["lightSensor"],
        off: ["lightSensor"],
        alert: ["temperatureSensor"],
      };
    case "fanDevice":
      return {
        on: ["temperatureSensor", "humiditySensor"],
        off: ["temperatureSensor", "humiditySensor"],
      };
    case "doorDevice":
      return {
        // alert: ["lightSensor"],
      };
    default:
      return {
        // on: ["lightSensor", "temperatureSensor", "humiditySensor"],
        // off: ["lightSensor", "temperatureSensor", "humiditySensor"],
        alert: ["lightSensor", "temperatureSensor", "humiditySensor"],
      };
  }
};

// ─── Config ──────────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<
  ActionType,
  { label: string; icon: string; color: string; bg: string; border: string }
> = {
  on: {
    label: "Bật thiết bị",
    icon: "power-off",
    color: "#15803D",
    bg: "#F0FDF4",
    border: "#BBF7D0",
  },
  off: {
    label: "Tắt thiết bị",
    icon: "power-off",
    color: "#B91C1C",
    bg: "#FEF2F2",
    border: "#FECACA",
  },
  alert: {
    label: "Gửi cảnh báo",
    icon: "bell",
    color: "#B45309",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
};

const WHEN_CONFIG: Record<WhenType, { label: string; icon: string }> = {
  above: { label: "Lớn hơn", icon: "arrow-up" },
  below: { label: "Nhỏ hơn", icon: "arrow-down" },
};

const SENSOR_LABEL: Record<string, string> = {
  lightSensor: "Cảm biến ánh sáng",
  temperatureSensor: "Cảm biến nhiệt độ",
  humiditySensor: "Cảm biến độ ẩm",
};

const getFormSensorId = (
  sensor: DeviceResponse | ThresholdSensorResponse | null,
) => {
  if (!sensor) return null;
  return "id" in sensor ? sensor.id : sensor._id;
};

const getSensorItemId = (sensor: DeviceResponse) => {
  return sensor.id || (sensor as DeviceResponse & { _id?: string })._id || "";
};

// ─── Step indicator ───────────────────────────────────────────────────────────

const StepDot = ({ active, done }: { active: boolean; done: boolean }) => (
  <View style={[s.stepDot, active && s.stepDotActive, done && s.stepDotDone]}>
    {done && <Icon name="check" size={8} color="#fff" />}
  </View>
);

const StepBar = ({ done }: { done: boolean }) => (
  <View style={[s.stepBar, done && s.stepBarDone]} />
);

// ─── Main Modal ───────────────────────────────────────────────────────────────

const ThresholdModal = ({
  visible,
  onClose,
  device,
  editingThreshold,
  onSuccess,
}: ThresholdModalProps) => {
  const isEditing = Boolean(editingThreshold);
  const isSensorDevice = device.type.toLowerCase().includes("sensor");

  const [step, setStep] = useState<StepType>(1);
  const [form, setForm] = useState<ThresholdFormData>({
    sensor: null,
    action: null,
    when: null,
    value: "",
  });
  const [sensors, setSensors] = useState<DeviceResponse[]>([]);
  const [loadingSensors, setLoadingSensors] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const sensorByAction = useMemo(
    () => getSensorByAction(device.type),
    [device.type],
  );
  const availableActions = useMemo(
    () => Object.keys(sensorByAction) as ActionType[],
    [sensorByAction],
  );

  // ── Init for edit mode ──
  useEffect(() => {
    if (!visible) return;
    if (editingThreshold) {
      setForm({
        sensor: isSensorDevice
          ? device
          : (editingThreshold.sensor as unknown as DeviceResponse),
        action: isSensorDevice
          ? "alert"
          : (editingThreshold.action as ActionType),
        when: editingThreshold.when as WhenType,
        value: String(editingThreshold.value),
      });
      console.log("Editing threshold, pre-filling form with:", {
        sensor: editingThreshold.sensor,
        action: editingThreshold.action,
        when: editingThreshold.when,
        value: String(editingThreshold.value),
      });
      setStep(isSensorDevice ? 3 : 1);
    } else {
      setForm({
        sensor: isSensorDevice ? device : null,
        action: isSensorDevice ? "alert" : null,
        when: null,
        value: "",
      });
      setStep(isSensorDevice ? 3 : 1);
    }
  }, [visible, editingThreshold, isSensorDevice, device]);

  // ── Fetch sensors when action selected ──
  useEffect(() => {
    if (isSensorDevice) {
      setSensors([device]);
      return;
    }
    if (!form.action) return;
    const allowedTypes = sensorByAction[form.action] ?? [];
    if (!allowedTypes.length) return;

    const fetch = async () => {
      setLoadingSensors(true);
      try {
        const res = await DeviceService.getSensorDevices();
        const filtered = (res.data ?? []).filter((d) =>
          allowedTypes.includes(d.type),
        );
        setSensors(filtered);
      } catch {
        Toast.show({
          type: "error",
          text1: "Không thể tải danh sách cảm biến.",
        });
      } finally {
        setLoadingSensors(false);
      }
    };
    fetch();
  }, [form.action, isSensorDevice, device, sensorByAction]);

  // ── Animate step change ──
  const animateStep = (direction: "next" | "back") => {
    const from = direction === "next" ? 40 : -40;
    slideAnim.setValue(from);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 120,
      friction: 12,
    }).start();
  };

  const goNext = () => {
    animateStep("next");
    setStep((s) => Math.min(s + 1, 3) as 1 | 2 | 3);
  };

  const goBack = () => {
    animateStep("back");
    setStep((s) => Math.max(s - 1, 1) as 1 | 2 | 3);
  };

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 6,
        duration: 45,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -6,
        duration: 45,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 35,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!form.sensor || !form.action || !form.when || !form.value.trim()) {
      triggerShake();
      Toast.show({ type: "error", text1: "Vui lòng điền đầy đủ thông tin." });
      return;
    }

    const resolvedSensorId = getFormSensorId(form.sensor);
    if (!resolvedSensorId) {
      triggerShake();
      Toast.show({ type: "error", text1: "Không tìm thấy cảm biến hợp lệ." });
      return;
    }

    const numVal = Number(form.value);
    if (Number.isNaN(numVal)) {
      triggerShake();
      Toast.show({ type: "error", text1: "Giá trị không hợp lệ." });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        sensorId: resolvedSensorId,
        action: form.action,
        when: form.when,
        value: numVal,
      };

      if (isEditing && editingThreshold) {
        await ThresholdService.updateThreshold(editingThreshold._id, payload);
        Toast.show({ type: "success", text1: "Cập nhật ngưỡng thành công." });
      } else {
        await ThresholdService.createThreshold(device.id, payload);
        Toast.show({ type: "success", text1: "Tạo ngưỡng thành công." });
      }
      onSuccess();
      onClose();
    } catch {
      Toast.show({ type: "error", text1: "Có lỗi xảy ra. Vui lòng thử lại." });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived ──
  const step1Complete = Boolean(form.action);
  const step2Complete = Boolean(form.sensor);
  const step3Complete = Boolean(form.when) && form.value.trim().length > 0;
  const canProceed1 = step1Complete;
  const canProceed2 = step2Complete;
  const hasSensors = sensors.length > 0;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Modal
      isVisible={visible}
      onBackButtonPress={onClose}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0}
      coverScreen={false}
      style={{ margin: 0 }}
    >
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Handle */}
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <View style={s.headerIconWrap}>
              <Icon name="sliders-h" size={14} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>
                {isEditing ? "Chỉnh sửa ngưỡng" : "Tạo ngưỡng mới"}
              </Text>
              <Text style={s.headerSub}>{device.name}</Text>
            </View>
            <TouchableOpacity
              style={s.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Icon name="times" size={13} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {!isSensorDevice && (
            <>
              {/* Step indicator */}
              <View style={s.stepIndicator}>
                <StepDot active={step === 1} done={step > 1} />
                <StepBar done={step > 1} />
                <StepDot active={step === 2} done={step > 2} />
                <StepBar done={step > 2} />
                <StepDot
                  active={step === 3}
                  done={step3Complete && step === 3}
                />
              </View>
              <View style={s.stepLabels}>
                <Text style={[s.stepLabel, step === 1 && s.stepLabelActive]}>
                  Hành động
                </Text>
                <Text style={[s.stepLabel, step === 2 && s.stepLabelActive]}>
                  Cảm biến
                </Text>
                <Text style={[s.stepLabel, step === 3 && s.stepLabelActive]}>
                  Điều kiện
                </Text>
              </View>
            </>
          )}

          {/* ── Content ── */}
          <Animated.View
            style={[s.stepContent, { transform: [{ translateX: slideAnim }] }]}
          >
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {/* ── STEP 1: Action ── */}
              {step === 1 && (
                <View style={s.section}>
                  <Text style={s.sectionLabel}>Chọn hành động thực hiện</Text>
                  <View style={s.optionGrid}>
                    {availableActions.map((action) => {
                      const cfg = ACTION_CONFIG[action];
                      const selected = form.action === action;
                      return (
                        <TouchableOpacity
                          key={action}
                          style={[
                            s.optionCard,
                            { borderColor: selected ? cfg.color : "#E5E7EB" },
                            selected && { backgroundColor: cfg.bg },
                          ]}
                          onPress={() =>
                            setForm((f) => ({ ...f, action, sensor: null }))
                          }
                          activeOpacity={0.75}
                        >
                          <View
                            style={[
                              s.optionIcon,
                              {
                                backgroundColor: selected ? cfg.bg : "#F9FAFB",
                                borderColor: selected ? cfg.border : "#E5E7EB",
                              },
                            ]}
                          >
                            <Icon
                              name={cfg.icon}
                              size={16}
                              color={selected ? cfg.color : "#9CA3AF"}
                            />
                          </View>
                          <Text
                            style={[
                              s.optionLabel,
                              selected && {
                                color: cfg.color,
                                fontWeight: "800",
                              },
                            ]}
                          >
                            {cfg.label}
                          </Text>
                          {selected && (
                            <View
                              style={[
                                s.selectedBadge,
                                { backgroundColor: cfg.color },
                              ]}
                            >
                              <Icon name="check" size={8} color="#fff" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* ── STEP 2: Sensor ── */}
              {step === 2 && (
                <View style={s.section}>
                  <Text style={s.sectionLabel}>Chọn cảm biến kích hoạt</Text>
                  {form.action && (
                    <View
                      style={[
                        s.contextHint,
                        {
                          backgroundColor: ACTION_CONFIG[form.action].bg,
                          borderColor: ACTION_CONFIG[form.action].border,
                        },
                      ]}
                    >
                      <Icon
                        name={ACTION_CONFIG[form.action].icon}
                        size={11}
                        color={ACTION_CONFIG[form.action].color}
                      />
                      <Text
                        style={[
                          s.contextHintText,
                          { color: ACTION_CONFIG[form.action].color },
                        ]}
                      >
                        {ACTION_CONFIG[form.action].label}
                      </Text>
                    </View>
                  )}

                  {loadingSensors && (
                    <View style={s.loadingBox}>
                      <LoadingSpinner
                        variant="wave"
                        color="#16A34A"
                        size={28}
                      />
                      <Text style={s.loadingText}>Đang tải cảm biến...</Text>
                    </View>
                  )}
                  {!loadingSensors && !hasSensors && (
                    <View style={s.emptyBox}>
                      <Icon name="microchip" size={22} color="#D1D5DB" />
                      <Text style={s.emptyText}>
                        Không tìm thấy cảm biến phù hợp.
                      </Text>
                    </View>
                  )}
                  {!loadingSensors &&
                    hasSensors &&
                    sensors.map((sensor) => {
                      const sensorId = getSensorItemId(sensor);
                      const selected =
                        getFormSensorId(form.sensor) === sensorId;
                      return (
                        <TouchableOpacity
                          key={sensorId}
                          style={[
                            s.sensorCard,
                            selected && s.sensorCardSelected,
                          ]}
                          onPress={() => setForm((f) => ({ ...f, sensor }))}
                          activeOpacity={0.75}
                        >
                          <View
                            style={[
                              s.sensorIconWrap,
                              selected && s.sensorIconWrapSelected,
                            ]}
                          >
                            <Icon
                              name="microchip"
                              size={13}
                              color={selected ? "#16A34A" : "#9CA3AF"}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                s.sensorName,
                                selected && s.sensorNameSelected,
                              ]}
                            >
                              {sensor.name}
                              {sensor.roomId?.name
                                ? ` - ${sensor.roomId.name}`
                                : ""}
                            </Text>
                            <Text style={s.sensorType}>
                              {SENSOR_LABEL[sensor.type] ?? sensor.type}
                            </Text>
                          </View>

                          <View
                            style={[
                              s.radioOuter,
                              selected && s.radioOuterSelected,
                            ]}
                          >
                            {selected && <View style={s.radioInner} />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                </View>
              )}

              {/* ── STEP 3: Condition ── */}
              {step === 3 && (
                <View style={s.section}>
                  <Text style={s.sectionLabel}>Thiết lập điều kiện</Text>

                  {/* Summary so far */}
                  <View style={s.summaryRow}>
                    <View style={s.summaryChip}>
                      <Icon name="microchip" size={10} color="#15803D" />
                      <Text style={s.summaryChipText}>{form.sensor?.name}</Text>
                    </View>
                    {form.action && (
                      <View
                        style={[
                          s.summaryChip,
                          {
                            backgroundColor: ACTION_CONFIG[form.action].bg,
                            borderColor: ACTION_CONFIG[form.action].border,
                          },
                        ]}
                      >
                        <Icon
                          name={ACTION_CONFIG[form.action].icon}
                          size={10}
                          color={ACTION_CONFIG[form.action].color}
                        />
                        <Text
                          style={[
                            s.summaryChipText,
                            { color: ACTION_CONFIG[form.action].color },
                          ]}
                        >
                          {ACTION_CONFIG[form.action].label}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* When toggle */}
                  <Text style={s.fieldLabel}>Khi giá trị</Text>
                  <View style={s.whenRow}>
                    {(["above", "below"] as WhenType[]).map((w) => {
                      const cfg = WHEN_CONFIG[w];
                      const selected = form.when === w;
                      return (
                        <TouchableOpacity
                          key={w}
                          style={[s.whenChip, selected && s.whenChipSelected]}
                          onPress={() => setForm((f) => ({ ...f, when: w }))}
                          activeOpacity={0.75}
                        >
                          <Icon
                            name={cfg.icon}
                            size={11}
                            color={selected ? "#16A34A" : "#6B7280"}
                          />
                          <Text
                            style={[
                              s.whenChipText,
                              selected && s.whenChipTextSelected,
                            ]}
                          >
                            {cfg.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Value input */}
                  <Text style={s.fieldLabel}>Giá trị ngưỡng</Text>
                  <Animated.View
                    style={{ transform: [{ translateX: shakeAnim }] }}
                  >
                    <TextInput
                      style={[
                        s.valueInput,
                        form.value.trim() && s.valueInputFilled,
                      ]}
                      placeholder="Nhập giá trị..."
                      placeholderTextColor="#9CA3AF"
                      value={form.value}
                      onChangeText={(v) => {
                        if (/^-?\d*\.?\d*$/.test(v))
                          setForm((f) => ({ ...f, value: v }));
                      }}
                      keyboardType="decimal-pad"
                    />
                  </Animated.View>

                  {/* Live preview */}
                  {form.when && !!form.value && form.sensor && form.action && (
                    <View style={s.previewBox}>
                      <Icon name="eye" size={11} color="#6B7280" />
                      <Text style={s.previewText}>
                        Nếu{" "}
                        <Text style={s.previewBold}>{form.sensor.name}</Text>{" "}
                        {WHEN_CONFIG[form.when].label.toLowerCase()}{" "}
                        <Text style={s.previewBold}>
                          {form.value}
                          {getUnit(form.sensor?.type)}
                        </Text>
                        {" → "}
                        <Text
                          style={[
                            s.previewBold,
                            { color: ACTION_CONFIG[form.action].color },
                          ]}
                        >
                          {ACTION_CONFIG[form.action].label}
                        </Text>
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </Animated.View>

          {/* ── Footer buttons ── */}
          <View style={s.footer}>
            {step > 1 ? (
              <TouchableOpacity
                style={s.backBtn}
                onPress={isSensorDevice ? onClose : goBack}
                activeOpacity={0.7}
              >
                {!isSensorDevice && (
                  <Icon name="arrow-left" size={12} color="#6B7280" />
                )}
                <Text style={s.backBtnText}>
                  {isSensorDevice ? "Huỷ" : "Quay lại"}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={s.backBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={s.backBtnText}>Huỷ</Text>
              </TouchableOpacity>
            )}

            {step < 3 ? (
              <TouchableOpacity
                style={[
                  s.nextBtn,
                  !(step === 1 ? canProceed1 : canProceed2) &&
                    s.nextBtnDisabled,
                ]}
                onPress={goNext}
                disabled={!(step === 1 ? canProceed1 : canProceed2)}
                activeOpacity={0.8}
              >
                <Text style={s.nextBtnText}>Tiếp theo</Text>
                <Icon name="arrow-right" size={12} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  s.nextBtn,
                  (!step3Complete || submitting) && s.nextBtnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!step3Complete || submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <LoadingSpinner variant="wave" color="#fff" size={20} />
                ) : (
                  <>
                    <Icon
                      name={isEditing ? "save" : "plus"}
                      size={12}
                      color="#fff"
                    />
                    <Text style={s.nextBtnText}>
                      {isEditing ? "Lưu thay đổi" : "Tạo ngưỡng"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FCFFFC",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 36,
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 24,
    maxHeight: "88%",
  },

  // Handle
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1FAE5",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0FDF4",
  },
  headerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#14532D",
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  // Step indicator
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 18,
    paddingHorizontal: 48,
    gap: 0,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: {
    borderColor: "#16A34A",
    backgroundColor: "#F0FDF4",
  },
  stepDotDone: {
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
  },
  stepBar: {
    flex: 1,
    height: 2,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 4,
  },
  stepBarDone: {
    backgroundColor: "#16A34A",
  },
  stepLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 32,
    marginTop: 6,
    marginBottom: 4,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
    textAlign: "center",
    width: 70,
  },
  stepLabelActive: {
    color: "#16A34A",
    fontWeight: "700",
  },

  // Content
  stepContent: {
    // flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  section: {
    gap: 12,
    paddingBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 2,
  },

  // Action option cards
  optionGrid: {
    gap: 10,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    position: "relative",
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
  },
  selectedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  // Context hint
  contextHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 2,
  },
  contextHintText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // Loading / empty
  loadingBox: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "500",
  },

  // Sensor cards
  sensorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  sensorCardSelected: {
    borderColor: "#16A34A",
    backgroundColor: "#F0FDF4",
  },
  sensorIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  sensorIconWrapSelected: {
    backgroundColor: "#DCFCE7",
    borderColor: "#BBF7D0",
  },
  sensorName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  sensorNameSelected: {
    color: "#15803D",
  },
  sensorType: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
    marginTop: 2,
  },
  sensorSelectedTag: {
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#86EFAC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  sensorSelectedTagText: {
    fontSize: 10,
    color: "#15803D",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: "#16A34A",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#16A34A",
  },

  // Step 3 fields
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  summaryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  summaryChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#15803D",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 4,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  whenRow: {
    flexDirection: "row",
    gap: 10,
  },
  whenChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  whenChipSelected: {
    borderColor: "#16A34A",
    backgroundColor: "#F0FDF4",
  },
  whenChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  whenChipTextSelected: {
    color: "#16A34A",
    fontWeight: "800",
  },
  valueInput: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    backgroundColor: "#fff",
  },
  valueInputFilled: {
    borderColor: "#16A34A",
    backgroundColor: "#F0FDF4",
  },
  previewBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    marginTop: 2,
  },
  previewText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    flex: 1,
    lineHeight: 18,
  },
  previewBold: {
    fontWeight: "800",
    color: "#111827",
  },

  // Footer
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0FDF4",
    gap: 10,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  nextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#16A34A",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  nextBtnDisabled: {
    backgroundColor: "#D1FAE5",
    shadowOpacity: 0,
    elevation: 0,
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});

export default ThresholdModal;
