import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { DeviceService } from "@/service/device.service";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type DateRangeKey = "today" | "7d" | "30d" | "all";

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

const toActionLabel = (action: string) => {
    const normalized = action.toLowerCase().trim();
    if (normalized === "0" || normalized === "off") return "Tắt";
    if (normalized === "1" || normalized === "on") return "Bật";
    return action;
};

const DeviceActionLog = ({ deviceId }: { deviceId: string }) => {
    const [range, setRange] = useState<DateRangeKey>("7d");
    const [logs, setLogs] = useState<DeviceActionLogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        const fetchLogs = async () => {
            setLoading(true);
            setError("");
            try {
                const response = await DeviceService.getDeviceLogs(
                    deviceId,
                    getDateRange(range),
                );
                if (!isMounted) return;
                setLogs(response.data || []);
            } catch {
                if (!isMounted) return;
                setError("Không thể tải lịch sử hành động.");
                setLogs([]);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchLogs();

        return () => {
            isMounted = false;
        };
    }, [deviceId, range]);

    const totalLabel = useMemo(() => {
        if (loading) return "Đang tải...";
        return `${logs.length} hành động`;
    }, [loading, logs.length]);

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
                                style={[
                                    styles.filterText,
                                    isActive && styles.filterTextActive,
                                ]}
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
                        Hãy thử chọn khoảng thời gian khác hoặc điều khiển thiết bị để tạo lịch
                        sử mới.
                    </Text>
                </View>
            ) : null}

            {!loading && !error && logs.length > 0
                ? logs.map((log) => (
                        <View key={log._id} style={styles.logCard}>
                            <View style={styles.logTopRow}>
                                <Text style={styles.logAction}>{toActionLabel(log.action)}</Text>
                                <Text style={styles.logDate}>{formatDateTime(log.createdAt)}</Text>
                            </View>
                            <View style={styles.logBottomRow}>
                                <Text style={styles.logMeta}>Actor: {log.actor || "App"}</Text>
                                {/* <Text style={styles.logRaw}>Giá trị gốc: {log.action}</Text> */}
                            </View>
                        </View>
                    ))
                : null}
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
    logRaw: {
        fontSize: 12,
        color: "#6B7280",
    },
});

export default DeviceActionLog;