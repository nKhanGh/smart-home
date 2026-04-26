/**
 * MotionSensorComponent
 *
 * Được render bên trong SafeAreaView của [deviceId].tsx khi device.type === "motionSensor".
 * Tự quản lý header (back, tên thiết bị), danh sách lịch motion watch, và modal tạo lịch.
 */

import MotionWatchScheduleModal from "../modals/MotionWatchScheduleModal";
import { ScheduleService } from "@/service/schedule.service";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/FontAwesome5";

const SCREEN_W = Dimensions.get("window").width;

// ── Day helpers ───────────────────────────────────────────────────────────────
const DAY_LABELS: Record<string, string> = {
  Mon: "T2",
  Tue: "T3",
  Wed: "T4",
  Thu: "T5",
  Fri: "T6",
  Sat: "T7",
  Sun: "CN",
};
const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({
  icon,
  label,
  value,
  unit,
  color = "#16A34A",
  bg = "#F0FDF4",
}: {
  icon: string;
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  bg?: string;
}) => (
  <View style={[sc.card, { backgroundColor: bg }]}>
    <View style={[sc.iconWrap, { backgroundColor: color + "22" }]}>
      <Icon name={icon} size={14} color={color} />
    </View>
    <Text style={sc.label}>{label}</Text>
    <View style={sc.valueRow}>
      <Text style={[sc.value, { color }]}>{value}</Text>
      {unit ? <Text style={sc.unit}>{unit}</Text> : null}
    </View>
  </View>
);

const sc = StyleSheet.create({
  card: {
    width: (SCREEN_W - 52) / 2,
    borderRadius: 18,
    padding: 16,
    gap: 6,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  label: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  valueRow: { flexDirection: "row", alignItems: "flex-end", gap: 3 },
  value: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  unit: { fontSize: 12, color: "#9CA3AF", marginBottom: 4 },
});

// ── Schedule Row ──────────────────────────────────────────────────────────────
const ScheduleRow = ({
  schedule,
  onDelete,
  onToggle,
}: {
  schedule: MotionWatchScheduleResponse;
  onDelete: () => void;
  onToggle: () => void;
}) => {
  const days = schedule.repeatDays ?? [];
  const isAllDay = days.length === 7;

  return (
    <View style={sr.wrap}>
      <View style={sr.left}>
        {/* Time range */}
        <View style={sr.timeRow}>
          <Icon name="clock" size={11} color="#6B7280" />
          <Text style={sr.time}>
            {schedule.startTime} – {schedule.endTime}
          </Text>
        </View>

        {/* Day chips */}
        <View style={sr.dayRow}>
          {isAllDay ? (
            <View style={[sr.chip, sr.chipActive]}>
              <Text style={[sr.chipText, sr.chipTextActive]}>Mỗi ngày</Text>
            </View>
          ) : days.length === 0 ? (
            <View style={sr.chip}>
              <Text style={sr.chipText}>Một lần</Text>
            </View>
          ) : (
            ALL_DAYS.map((d) => (
              <View
                key={d}
                style={[sr.chip, days.includes(d) && sr.chipActive]}
              >
                <Text
                  style={[sr.chipText, days.includes(d) && sr.chipTextActive]}
                >
                  {DAY_LABELS[d]}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Config badges */}
        <View style={sr.badgeRow}>
          {!!schedule.triggerCount && (
            <View style={sr.badge}>
              <Icon name="bolt" size={9} color="#D97706" />
              <Text style={sr.badgeText}>{schedule.triggerCount} lần kích</Text>
            </View>
          )}
          {schedule.cooldownMinutes != null && schedule.cooldownMinutes > 0 && (
            <View style={sr.badge}>
              <Icon name="hourglass-half" size={9} color="#7C3AED" />
              <Text style={sr.badgeText}>Hồi {schedule.cooldownMinutes}p</Text>
            </View>
          )}
          {!!schedule.countWindowMinutes && (
            <View style={sr.badge}>
              <Icon name="window-restore" size={9} color="#2563EB" />
              <Text style={sr.badgeText}>
                Cửa sổ {schedule.countWindowMinutes}p
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={sr.right}>
        {/* Toggle */}
        <TouchableOpacity
          style={[sr.toggle, schedule.active && sr.toggleActive]}
          onPress={onToggle}
          activeOpacity={0.7}
        >
          <View style={[sr.thumb, schedule.active && sr.thumbActive]} />
        </TouchableOpacity>

        {/* Delete */}
        <TouchableOpacity
          style={sr.deleteBtn}
          onPress={onDelete}
          activeOpacity={0.7}
        >
          <Icon name="trash-alt" size={13} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const sr = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    gap: 10,
  },
  left: { flex: 1, gap: 8 },
  right: { alignItems: "center", gap: 12 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  time: { fontSize: 15, fontWeight: "700", color: "#111827" },
  dayRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  chip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipActive: { backgroundColor: "#DCFCE7", borderColor: "#86EFAC" },
  chipText: { fontSize: 10, fontWeight: "600", color: "#9CA3AF" },
  chipTextActive: { color: "#16A34A" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 10, fontWeight: "600", color: "#374151" },
  toggle: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleActive: { backgroundColor: "#16A34A" },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbActive: { alignSelf: "flex-end" },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
});

// ── Main Component ────────────────────────────────────────────────────────────
interface Props {
  device: DeviceResponse;
}

export default function MotionSensorComponent({ device }: Props) {
  const [schedules, setSchedules] = useState<MotionWatchScheduleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const loadSchedules = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const response = await ScheduleService.getMotionWatchSchedules(
          device.id,
        );
        console.log(response.data);
        setSchedules(response.data);
      } catch {
        Toast.show({ type: "error", text1: "Không thể tải lịch." });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [device.id],
  );

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handleDelete = async (id: string) => {
    try {
      await ScheduleService.deleteMotionWatchSchedule(id);
      Toast.show({ type: "success", text1: "Đã xoá lịch." });
      loadSchedules(true);
    } catch {
      Toast.show({ type: "error", text1: "Xoá thất bại." });
    }
  };

  const handleToggle = async (schedule: MotionWatchScheduleResponse) => {
    try {
      const payload: MotionWatchScheduleRequest = {
        deviceId: schedule.deviceId._id, // hoặc schedule.deviceId.id tùy object của bạn
        active: !schedule.active,
        repeatDays: schedule.repeatDays,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        triggerCount: schedule.triggerCount,
        countWindowMinutes: schedule.countWindowMinutes,
        minSignalIntervalSeconds: schedule.minSignalIntervalSeconds,
        cooldownMinutes: schedule.cooldownMinutes,
        createdAt: schedule.createdAt,
      };

      await ScheduleService.updateMotionWatchSchedule(schedule._id, payload);

      loadSchedules(true);
    } catch (error) {
      console.error("Error toggling schedule:", error);
      Toast.show({
        type: "error",
        text1: "Cập nhật thất bại.",
      });
    }
  };

  const activeCount = schedules.filter((s) => s.active).length;

  return (
    <View style={s.root}>
      {/* ── Header — dùng lại đúng format header của [deviceId].tsx ── */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.replace("/(tabs)/(rooms)")}
          activeOpacity={0.7}
        >
          <Icon name="angle-left" size={20} color="#000" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>{device.name}</Text>
          <Text style={s.headerSubtitle}>{device.roomId?.name}</Text>
        </View>
        {/* Placeholder để căn giữa title */}
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadSchedules(true);
            }}
            tintColor="#16A34A"
          />
        }
      >
        {/* ── Device card ── */}
        <View style={s.deviceCard}>
          <View style={s.deviceIconWrap}>
            <Icon name="satellite-dish" size={26} color="#16A34A" />
          </View>
          <View style={s.deviceInfo}>
            <Text style={s.deviceName}>{device.name}</Text>
            <View style={s.roomRow}>
              <View style={s.dot} />
              <Text style={s.roomText}>{device.roomId?.name}</Text>
            </View>
            {/* <View style={[s.onlineBadge, { backgroundColor: device.isOnline ? "#DCFCE7" : "#F3F4F6" }]}>
              <View style={[s.onlineDot, { backgroundColor: device.isOnline ? "#22C55E" : "#9CA3AF" }]} />
              <Text style={[s.onlineText, { color: device.isOnline ? "#16A34A" : "#6B7280" }]}>
                {device.isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
              </Text>
            </View> */}
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={s.statsGrid}>
          <StatCard
            icon="check-circle"
            label="Lịch đang bật"
            value={activeCount}
            unit="lịch"
            color="#16A34A"
            bg="#F0FDF4"
          />
          <StatCard
            icon="calendar-alt"
            label="Tổng lịch"
            value={schedules.length}
            unit="lịch"
            color="#D97706"
            bg="#FFFBEB"
          />
        </View>

        {/* ── Info banner ── */}
        <View style={s.infoBanner}>
          <Icon name="info-circle" size={13} color="#2563EB" />
          <Text style={s.infoBannerText}>
            Cảm biến kích hoạt khi phát hiện đủ số lần chuyển động trong khung
            giờ đã cài. Sau khi trigger sẽ chờ hết thời gian hồi phục trước khi
            kích lại.
          </Text>
        </View>

        {/* ── Schedule list ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Lịch theo dõi chuyển động</Text>
            <TouchableOpacity
              style={s.addBtn}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Icon name="plus" size={11} color="#fff" />
              <Text style={s.addBtnText}>Thêm</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={s.loadingWrap}>
              <ActivityIndicator color="#16A34A" />
            </View>
          ) : schedules.length === 0 ? (
            <View style={s.emptyWrap}>
              <View style={s.emptyIcon}>
                <Icon name="calendar-times" size={22} color="#D1D5DB" />
              </View>
              <Text style={s.emptyTitle}>Chưa có lịch nào</Text>
              <Text style={s.emptyBody}>
                Nhấn "Thêm" để tạo lịch theo dõi chuyển động.
              </Text>
            </View>
          ) : (
            <View style={s.list}>
              {schedules.map((sch) => (
                <ScheduleRow
                  key={sch._id}
                  schedule={sch}
                  onDelete={() => handleDelete(sch._id)}
                  onToggle={() => handleToggle(sch)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <MotionWatchScheduleModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        device={device}
        onSuccess={() => loadSchedules(true)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F9FAFB" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  headerSubtitle: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },

  scroll: { padding: 16, gap: 14, paddingBottom: 40 },

  deviceCard: {
    backgroundColor: "#16853F",
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  deviceIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#28BC5F",
    borderWidth: 1,
    borderColor: "#28BC5F",
    alignItems: "center",
    justifyContent: "center",
  },
  deviceInfo: { flex: 1, gap: 5 },
  deviceName: { fontSize: 16, fontWeight: "700", color: "#fff" },
  roomRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22C55E" },
  roomText: { fontSize: 12, color: "#dad9d9" },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  onlineText: { fontSize: 11, fontWeight: "600" },

  statsGrid: { flexDirection: "row", gap: 12 },

  infoBanner: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    padding: 12,
  },
  infoBannerText: { flex: 1, fontSize: 12, color: "#3B82F6", lineHeight: 18 },

  section: { gap: 12 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#16A34A",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },

  loadingWrap: { padding: 32, alignItems: "center" },
  emptyWrap: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 32,
    alignItems: "center",
    gap: 8,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#374151" },
  emptyBody: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
  list: { gap: 10 },
});
