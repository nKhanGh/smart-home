import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { DeviceService } from "@/service/device.service";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type DateRangeKey = "today" | "7d" | "30d" | "all";

const PAGE_SIZE = 30;

const RANGE_OPTIONS: { key: DateRangeKey; label: string }[] = [
  { key: "today", label: "Hôm nay" },
  { key: "7d", label: "7 ngày" },
  { key: "30d", label: "30 ngày" },
  { key: "all", label: "Tất cả" },
];

const getDateRange = (key: DateRangeKey): DeviceHistoryQuery | undefined => {
  if (key === "all") return undefined;

  const end = new Date();
  const start = new Date(end);

  if (key === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (key === "7d") {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (key === "30d") {
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
  }

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const FAN_ACTION_MAP: Record<string, string> = {
  "0": "Tắt",
  "off": "Tắt",
  "40": "Bật, cường độ thấp",
  "70": "Bật, cường độ trung bình",
  "100": "Bật, cường độ cao",
  "on": "Bật, cường độ cao",
};

const LIGHT_ACTION_MAP: Record<string, string> = {
  "0": "Tắt",
  "off": "Tắt",
  "1": "Bật, ánh sáng trắng",
  "2": "Bật, ánh sáng vàng",
  "3": "Bật, ánh sáng xanh",
  "4": "Bật, cảnh báo",
  "on": "Bật, ánh sáng trắng",
};

const DOOR_ACTION_MAP: Record<string, string> = {
  "0": "Đóng",
  "off": "Đóng",
  "1": "Mở",
  "on": "Mở",
};

const toActionLabel = (deviceType: string, action: string) => {
  const normalizedAction = action.toString().trim();

  // Try to extract numeric value from formats like "off (0)" or "on (1)"
  const numericMatch = normalizedAction.match(/\((\d+)\)/);
  const numericValue = numericMatch ? numericMatch[1] : normalizedAction;
  
  // Also extract the text part (before the parenthesis) if it exists
  const textPart = normalizedAction.match(/^([^\(]+)/)?.[1].trim() || normalizedAction;

  if (deviceType === "fanDevice") {
    return FAN_ACTION_MAP[numericValue] ?? FAN_ACTION_MAP[textPart] ?? normalizedAction;
  }

  if (deviceType === "lightDevice") {
    return LIGHT_ACTION_MAP[numericValue] ?? LIGHT_ACTION_MAP[textPart] ?? normalizedAction;
  }

  if (deviceType === "doorDevice") {
    return DOOR_ACTION_MAP[numericValue] ?? DOOR_ACTION_MAP[textPart] ?? normalizedAction;
  }

  return normalizedAction;
};

const DeviceActionLog = ({
  deviceId,
  deviceType,
}: {
  deviceId: string;
  deviceType: string;
}) => {
  const [range, setRange] = useState<DateRangeKey>("7d");
  const [logs, setLogs] = useState<DeviceActionLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [totalElement, setTotalElement] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const fetchLogs = async (nextPage = 1, reset = false) => {
    if (reset) {
      setLoading(true);
      setError("");
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await DeviceService.getDeviceLogs(deviceId, {
        ...getDateRange(range),
        page: nextPage,
        size: PAGE_SIZE,
      });

      const payload = response.data;
      setLogs((prev) => (reset ? payload.items : [...prev, ...payload.items]));
      setPage(payload.currentPage);
      setTotalPage(payload.totalPage);
      setTotalElement(payload.totalElement);
    } catch {
      setError("Không thể tải lịch sử hành động.");
      if (reset) {
        setLogs([]);
        setPage(1);
        setTotalPage(1);
        setTotalElement(0);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setLogs([]);
    setPage(1);
    setTotalPage(1);
    setTotalElement(0);
    void fetchLogs(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, range]);

  const hasMore = page < totalPage;

  const totalLabel = useMemo(() => {
    if (loading) return "Đang tải...";
    return `${totalElement} hành động`;
  }, [loading, totalElement]);

  const handleLoadMore = () => {
    if (loading || loadingMore || !hasMore) return;
    void fetchLogs(page + 1, false);
  };

  const renderItem = ({ item }: ListRenderItemInfo<DeviceActionLogItem>) => (
    <View style={styles.logCard}>
      <View style={styles.logTopRow}>
        <Text style={styles.logAction}>{toActionLabel(deviceType, item.action)}</Text>
        <Text style={styles.logDate}>{formatDateTime(item.createdAt)}</Text>
      </View>
      <View style={styles.logBottomRow}>
        <Text style={styles.logMeta}>Actor: {item.actor || "App"}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Lịch sử điều khiển</Text>
        <Text style={styles.subtitle}>{totalLabel}</Text>
      </View>

      <View style={styles.filterRow}>
        {RANGE_OPTIONS.map((option) => {
          const isActive = option.key === range;
          return (
            <TouchableOpacity
              key={option.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setRange(option.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.filterText, isActive && styles.filterTextActive]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.centeredBox}>
          <LoadingSpinner variant="wave" color="#16A34A" size={32} />
          <Text style={styles.helperText}>Đang tải lịch sử...</Text>
        </View>
      ) : null}

      {!loading && error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!loading && !error && logs.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Chưa có hành động nào</Text>
          <Text style={styles.emptyText}>
            Hãy thử chọn khoảng thời gian khác hoặc điều khiển thiết bị để tạo lịch sử mới.
          </Text>
        </View>
      ) : null}

      {!loading && !error && logs.length > 0 ? (
        <FlatList
          data={logs}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoading}>
                <LoadingSpinner variant="wave" color="#16A34A" size={24} />
                <Text style={styles.helperText}>Đang tải thêm...</Text>
              </View>
            ) : hasMore ? (
              <Text style={styles.footerHint}>Cuộn xuống để tải thêm lịch sử</Text>
            ) : (
              <Text style={styles.footerHint}>Đã tải hết lịch sử</Text>
            )
          }
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    padding: 16,
    gap: 12,
  },
  headerRow: {
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F9FAFB",
  },
  filterChipActive: {
    borderColor: "#16A34A",
    backgroundColor: "#DCFCE7",
  },
  filterText: {
    color: "#4B5563",
    fontSize: 12,
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#166534",
  },
  centeredBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 10,
  },
  helperText: {
    fontSize: 13,
    color: "#6B7280",
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  emptyBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
    padding: 14,
    gap: 6,
  },
  emptyTitle: {
    color: "#166534",
    fontWeight: "700",
    fontSize: 14,
  },
  emptyText: {
    color: "#166534",
    fontSize: 12,
    lineHeight: 18,
  },
  logCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FAFAFA",
    padding: 12,
    gap: 8,
  },
  logTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  logBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  logAction: {
    fontSize: 14,
    fontWeight: "700",
    color: "#14532D",
  },
  logDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  logMeta: {
    fontSize: 12,
    color: "#374151",
  },
  footerLoading: {
    paddingVertical: 10,
    alignItems: "center",
    gap: 8,
  },
  footerHint: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 12,
    paddingVertical: 10,
  },
});

export default DeviceActionLog;