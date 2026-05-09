import ConfirmationModal from "@/components/modals/ConfirmationModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ScheduleService } from "@/service/schedule.service";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from "react-native-modal";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/FontAwesome5";
import ScheduleModal from "../modals/ScheduleModal";

const DAY_MAP: Record<string, string> = {
  Mon: "T2",
  Tue: "T3",
  Wed: "T4",
  Thu: "T5",
  Fri: "T6",
  Sat: "T7",
  Sun: "CN",
};

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const formatTime = (triggerTime: string) => {
  // triggerTime dạng "HH:mm" hoặc ISO string
  if (triggerTime.includes("T")) {
    const d = new Date(triggerTime);
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  return triggerTime.slice(0, 5);
};

const getRepeatLabel = (days: string[]) => {
  if (!days || days.length === 0) return "Một lần";
  if (days.length === 7) return "Hằng ngày";
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const weekend = ["Sat", "Sun"];
  if (weekdays.every((d) => days.includes(d)) && days.length === 5)
    return "Thứ 2 – 6";
  if (weekend.every((d) => days.includes(d)) && days.length === 2)
    return "Cuối tuần";
  return days.map((d) => DAY_MAP[d] ?? d).join(", ");
};

const DeviceScheduleComponent = ({ device }: { device: DeviceResponse }) => {
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [menuSchedule, setMenuSchedule] = useState<ScheduleResponse | null>(
    null,
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] =
    useState<ScheduleResponse | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);

  const orderedSchedules = useMemo(() => {
    return [...schedules].sort((a, b) =>
      a.triggerTime.localeCompare(b.triggerTime),
    );
  }, [schedules]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await ScheduleService.getScheduleDevices(device.id);
      setSchedules(res.data ?? []);
    } catch {
      setSchedules([]);
      Toast.show({ type: "error", text1: "Không thể tải danh sách lịch." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [device?.id]);

  const onToggleActive = async (scheduleId: string) => {
    const previous = schedules;
    setProcessingId(scheduleId);
    setSchedules((prev) =>
      prev.map((s) => (s._id === scheduleId ? { ...s, active: !s.active } : s)),
    );
    try {
      await ScheduleService.switchSchedule(scheduleId);
      const next = !previous.find((s) => s._id === scheduleId)?.active;
      Toast.show({
        type: "success",
        text1: `Lịch đã được ${next ? "bật" : "tắt"}.`,
      });
    } catch {
      setSchedules(previous);
      Toast.show({ type: "error", text1: "Không thể thay đổi trạng thái." });
    } finally {
      setProcessingId(null);
    }
  };

  const onDelete = (scheduleId: string) => {
    setMenuSchedule(null);
    setDeleteConfirmVisible(true);
    setDeletingSchedule(false);
    setScheduleToDelete(scheduleId);
  };

  const handleDeleteSchedule = async () => {
    if (!scheduleToDelete) return;
    setDeletingSchedule(true);
    try {
      await ScheduleService.deleteSchedule(scheduleToDelete);
      setSchedules((prev) => prev.filter((s) => s._id !== scheduleToDelete));
      setDeleteConfirmVisible(false);
    } catch {
      Toast.show({ type: "error", text1: "Không thể xóa lịch." });
    } finally {
      setDeletingSchedule(false);
      setScheduleToDelete(null);
    }
  };

  const onPressCreate = () => {
    setEditingSchedule(null);
    setModalVisible(true);
  };

  const onPressEdit = (schedule: ScheduleResponse) => {
    setMenuSchedule(null);
    setEditingSchedule(schedule);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={s.centeredBox}>
        <LoadingSpinner variant="wave" color="#16A34A" size={30} />
        <Text style={s.loadingText}>Đang tải lịch...</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* ── Header ── */}
      <View style={s.headerRow}>
        <View style={s.headerLeft}>
          <View style={s.headerIconWrap}>
            <Icon name="clock" size={13} color="#16A34A" />
          </View>
          <View>
            <Text style={s.title}>Lịch tự động</Text>
            <Text style={s.subtitle}>
              {orderedSchedules.length} lịch đang cấu hình
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={s.addButton}
          onPress={onPressCreate}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={11} color="#fff" />
          <Text style={s.addButtonText}>Thêm mới</Text>
        </TouchableOpacity>
      </View>

      {/* ── Empty state ── */}
      {orderedSchedules.length === 0 && (
        <View style={s.emptyBox}>
          <View style={s.emptyIconWrap}>
            <Icon name="clock" size={22} color="#4ADE80" />
          </View>
          <Text style={s.emptyTitle}>Chưa có lịch nào</Text>
          <Text style={s.emptyText}>
            Nhấn "Thêm mới" để tạo lịch tự động cho thiết bị.
          </Text>
        </View>
      )}

      {/* ── Cards ── */}
      {orderedSchedules.map((schedule) => {
        const isProcessing = processingId === schedule._id;
        const isOn = schedule.action === "on";
        const repeatLabel = getRepeatLabel(schedule.repeatDays);
        const days = schedule.repeatDays ?? [];

        return (
          <View
            key={schedule._id}
            style={[
              s.card,
              schedule.active ? s.cardActive : s.cardInactive,
              isProcessing && s.cardProcessing,
            ]}
          >
            {/* Active strip */}
            <View
              style={[
                s.activeStrip,
                { backgroundColor: schedule.active ? "#16A34A" : "#D1D5DB" },
              ]}
            />

            <View style={s.cardInner}>
              {/* ── Top: time + action + more ── */}
              <View style={s.cardTop}>
                {/* Time block */}
                <View style={s.timeBlock}>
                  <Text
                    style={[s.timeText, !schedule.active && s.timeTextInactive]}
                  >
                    {formatTime(schedule.triggerTime)}
                  </Text>
                  <View
                    style={[
                      s.actionPill,
                      isOn ? s.actionPillOn : s.actionPillOff,
                    ]}
                  >
                    <Icon
                      name="power-off"
                      size={9}
                      color={isOn ? "#15803D" : "#B91C1C"}
                    />
                    <Text
                      style={[
                        s.actionPillText,
                        isOn ? s.actionPillTextOn : s.actionPillTextOff,
                      ]}
                    >
                      {isOn ? "Bật" : "Tắt"}
                    </Text>
                  </View>
                </View>

                {/* More button */}
                <TouchableOpacity
                  style={s.moreButton}
                  onPress={() => setMenuSchedule(schedule)}
                  activeOpacity={0.7}
                >
                  <Icon name="ellipsis-v" size={14} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* ── Repeat days ── */}
              <View style={s.repeatRow}>
                <Icon name="redo" size={10} color="#9CA3AF" />
                <Text style={s.repeatLabel}>{repeatLabel}</Text>
                {days.length > 0 && days.length < 7 && (
                  <View style={s.dayPills}>
                    {ALL_DAYS.map((d) => (
                      <View
                        key={d}
                        style={[s.dayPill, days.includes(d) && s.dayPillActive]}
                      >
                        <Text
                          style={[
                            s.dayPillText,
                            days.includes(d) && s.dayPillTextActive,
                          ]}
                        >
                          {DAY_MAP[d]}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* ── Divider ── */}
              <View style={s.divider} />

              {/* ── Footer: delete + switch ── */}
              <View style={s.cardFooter}>
                <TouchableOpacity
                  onPress={() => onDelete(schedule._id)}
                  disabled={isProcessing}
                  style={[s.deleteButton, isProcessing && s.disabledButton]}
                  activeOpacity={0.7}
                >
                  <Icon name="trash-alt" size={11} color="#DC2626" />
                  <Text style={s.deleteButtonText}>Xóa</Text>
                </TouchableOpacity>

                <View style={s.switchWrap}>
                  <Text
                    style={[
                      s.switchLabel,
                      { color: schedule.active ? "#15803D" : "#9CA3AF" },
                    ]}
                  >
                    {schedule.active ? "Đang bật" : "Đang tắt"}
                  </Text>
                  <Switch
                    value={schedule.active}
                    onValueChange={() => onToggleActive(schedule._id)}
                    disabled={isProcessing}
                    trackColor={{ false: "#E5E7EB", true: "#86EFAC" }}
                    thumbColor={schedule.active ? "#16A34A" : "#D1D5DB"}
                    ios_backgroundColor="#E5E7EB"
                  />
                </View>
              </View>
            </View>
          </View>
        );
      })}

      {/* ── Context Menu Modal ── */}
      <Modal
        isVisible={Boolean(menuSchedule)}
        onBackButtonPress={() => setMenuSchedule(null)}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        backdropOpacity={0}
        coverScreen={false}
        style={{ margin: 0 }}
      >
        <Pressable style={s.modalOverlay} onPress={() => setMenuSchedule(null)}>
          <Pressable style={s.menuSheet} onPress={(e) => e.stopPropagation()}>
            <View style={s.menuHandle} />

            <View style={s.menuSheetHeader}>
              <View style={s.menuSheetIcon}>
                <Icon name="clock" size={13} color="#16A34A" />
              </View>
              <View>
                <Text style={s.menuTitle}>Tùy chọn lịch</Text>
                {menuSchedule && (
                  <Text style={s.menuSubtitle}>
                    {formatTime(menuSchedule.triggerTime)} ·{" "}
                    {getRepeatLabel(menuSchedule.repeatDays)}
                  </Text>
                )}
              </View>
            </View>

            <View style={s.menuDivider} />

            <TouchableOpacity
              style={s.menuItem}
              onPress={() => menuSchedule && onPressEdit(menuSchedule)}
              activeOpacity={0.7}
            >
              <View style={[s.menuIconWrap, { backgroundColor: "#F0FDF4" }]}>
                <Icon name="edit" size={13} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.menuItemText}>Chỉnh sửa lịch</Text>
                <Text style={s.menuItemSub}>
                  Thay đổi thời gian và hành động
                </Text>
              </View>
              <Icon name="chevron-right" size={11} color="#D1D5DB" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.menuItem, { marginBottom: 8 }]}
              onPress={() => setMenuSchedule(null)}
              activeOpacity={0.7}
            >
              <View style={[s.menuIconWrap, { backgroundColor: "#F9FAFB" }]}>
                <Icon name="times" size={13} color="#6B7280" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.menuItemText, { color: "#6B7280" }]}>Đóng</Text>
              </View>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
      {modalVisible && (
        <ScheduleModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          device={device}
          editingSchedule={editingSchedule}
          onSuccess={fetchSchedules}
        />
      )}
      <ConfirmationModal
        visible={deleteConfirmVisible}
        title="Xác nhận xóa lịch"
        message="Bạn có chắc chắn muốn xóa lịch này không? Hành động này không thể hoàn tác."
        confirmText="Xóa lịch"
        cancelText="Hủy bỏ"
        iconName="alert"
        isDangerous
        loading={deletingSchedule}
        onConfirm={handleDeleteSchedule}
        onCancel={() => setDeleteConfirmVisible(false)}
        notificationMessage="Đã xóa lịch thành công"
      />
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    marginTop: 16,
    gap: 12,
  },
  centeredBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#14532D",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 1,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#16A34A",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },

  // Empty
  emptyBox: {
    backgroundColor: "#F0FDF4",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DCFCE7",
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 8,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#14532D",
  },
  emptyText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 19,
  },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: "hidden",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardActive: {
    borderColor: "#DCFCE7",
  },
  cardInactive: {
    borderColor: "#E5E7EB",
    backgroundColor: "#FAFAFA",
  },
  cardProcessing: {
    opacity: 0.55,
  },
  activeStrip: {
    width: 4,
  },
  cardInner: {
    flex: 1,
    padding: 14,
    gap: 10,
  },

  // Card top
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  timeBlock: {
    flexDirection: "row",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -1,
    lineHeight: 36,
  },
  timeTextInactive: {
    color: "#9CA3AF",
  },
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionPillOn: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  actionPillOff: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  actionPillTextOn: {
    color: "#15803D",
  },
  actionPillTextOff: {
    color: "#B91C1C",
  },
  moreButton: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },

  // Repeat row
  repeatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  repeatLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  dayPills: {
    flexDirection: "row",
    gap: 4,
    flexWrap: "wrap",
  },
  dayPill: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dayPillActive: {
    backgroundColor: "#439660",
  },
  dayPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9CA3AF",
  },
  dayPillTextActive: {
    color: "#fff",
  },

  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
  },

  // Footer
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  disabledButton: {
    opacity: 0.45,
  },
  deleteButtonText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "700",
  },
  switchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: "700",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  menuSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingBottom: 32,
  },
  menuHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  menuSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  menuSheetIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 18,
    marginBottom: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "700",
  },
  menuItemSub: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
    marginTop: 1,
  },
});

export default DeviceScheduleComponent;
