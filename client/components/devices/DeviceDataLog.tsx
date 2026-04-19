import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { DeviceService } from "@/service/device.service";
import { useEffect, useMemo, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type DateRangeKey = "today" | "7d" | "30d" | "all";

type ChartPoint = {
    id: string;
    label: string;
    value: number;
    fullTime: string;
    x: number;
    y: number;
};

const RANGE_OPTIONS: { key: DateRangeKey; label: string }[] = [
    { key: "today", label: "Hôm nay" },
    { key: "7d", label: "7 ngày" },
    { key: "30d", label: "30 ngày" },
    { key: "all", label: "Tất cả" },
];

const CHART_HEIGHT = 220;
const CHART_TOP = 30;
const CHART_BOTTOM = 44;
const CHART_PADDING_X = 22;

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

const formatLabel = (value: string, range: DateRangeKey) => {
    const date = new Date(value);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    
    if (range === "today") {
        return `${hour}:${minute}`;
    }
    return `${day}/${month} ${hour}:${minute}`;
};

const DeviceDataLog = ({ deviceId }: { deviceId: string }) => {
    const [range, setRange] = useState<DateRangeKey>("7d");
    const [logs, setLogs] = useState<DeviceDataLogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        const fetchDataLogs = async () => {
            setLoading(true);
            setError("");
            try {
                const response = await DeviceService.getDeviceDataLogs(
                    deviceId,
                    getDateRange(range),
                );

                if (!isMounted) return;
                setLogs(response.data || []);
            } catch {
                if (!isMounted) return;
                setError("Không thể tải lịch sử dữ liệu.");
                setLogs([]);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchDataLogs();

        return () => {
            isMounted = false;
        };
    }, [deviceId, range]);

    const timelinePoints = useMemo(() => {
        return [...logs]
            .sort(
                (a, b) =>
                    new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
            )
            .map((item) => {
                const numericValue = Number(item.value);
                return {
                    id: item._id,
                    value: numericValue,
                    label: formatLabel(item.recordedAt, range),
                    fullTime: formatDateTime(item.recordedAt),
                };
            })
            .filter((item) => Number.isFinite(item.value));
    }, [logs, range]);

    const chartWidth = Math.max(320, timelinePoints.length * 62);

    const chartPoints = useMemo<ChartPoint[]>(() => {
        if (timelinePoints.length === 0) return [];

        const max = Math.max(...timelinePoints.map((item) => item.value));
        const min = Math.min(...timelinePoints.map((item) => item.value));
        const rangeValue = max - min;
        const usableHeight = CHART_HEIGHT - CHART_TOP - CHART_BOTTOM;
        const usableWidth = chartWidth - CHART_PADDING_X * 2;

        return timelinePoints.map((item, index) => {
            const ratioY = rangeValue === 0 ? 0.5 : (item.value - min) / rangeValue;
            const x =
                timelinePoints.length === 1
                    ? chartWidth / 2
                    :
                        CHART_PADDING_X +
                        (index / (timelinePoints.length - 1)) * usableWidth;
            const y = CHART_TOP + (1 - ratioY) * usableHeight;

            return {
                id: item.id,
                label: item.label,
                fullTime: item.fullTime,
                value: item.value,
                x,
                y,
            };
        });
    }, [chartWidth, timelinePoints]);

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>Lịch sử dữ liệu cảm biến</Text>
                <Text style={styles.subtitle}>{logs.length} mốc dữ liệu</Text>
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
                    <Text style={styles.helperText}>Đang tải dữ liệu...</Text>
                </View>
            ) : null}

            {!loading && error ? <Text style={styles.errorText}>{error}</Text> : null}

            {!loading && !error && logs.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Text style={styles.emptyTitle}>Chưa có dữ liệu nào</Text>
                    <Text style={styles.emptyText}>
                        Cảm biến chưa ghi nhận dữ liệu trong khoảng thời gian đã chọn.
                    </Text>
                </View>
            ) : null}

            {!loading && !error && logs.length > 0 ? (
                <>
                    <Text style={styles.sectionTitle}>Biểu đồ xu hướng</Text>
                    {chartPoints.length === 0 ? (
                        <Text style={styles.warnText}>
                            Không có điểm số hợp lệ để vẽ biểu đồ.
                        </Text>
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={[styles.chartWrap, { width: chartWidth, height: CHART_HEIGHT }]}>
                                <View style={styles.chartGrid} />

                                {chartPoints.slice(1).map((point, index) => {
                                    const prev = chartPoints[index];
                                    const dx = point.x - prev.x;
                                    const dy = point.y - prev.y;
                                    const length = Math.sqrt(dx * dx + dy * dy);
                                    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
                                    const left = (prev.x + point.x) / 2 - length / 2;
                                    const top = (prev.y + point.y) / 2 - 1;

                                    return (
                                        <View
                                            key={`${prev.id}-${point.id}`}
                                            style={[
                                                styles.segment,
                                                {
                                                    width: length,
                                                    left,
                                                    top,
                                                    transform: [{ rotate: `${angle}deg` }],
                                                },
                                            ]}
                                        />
                                    );
                                })}

                                {chartPoints.map((point) => (
                                    <View key={point.id} style={styles.chartPointWrap}>
                                        <Text style={[styles.pointValue, { left: point.x - 18, top: point.y - 24 }]}>
                                            {point.value.toFixed(1)}
                                        </Text>
                                        <View style={[styles.pointDot, { left: point.x - 5, top: point.y - 5 }]} />
                                        <Text style={[styles.pointLabel, { left: point.x - 24, top: CHART_HEIGHT - 18 }]} numberOfLines={1}>
                                            {point.label}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    )}

                    <Text style={styles.sectionTitle}>Chi tiết theo mốc thời gian</Text>
                    {logs.map((item) => (
                        <View key={item._id} style={styles.dataCard}>
                            <Text style={styles.dataValue}>{item.value}</Text>
                            <Text style={styles.dataTime}>{formatDateTime(item.recordedAt)}</Text>
                        </View>
                    ))}
                </>
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
    sectionTitle: {
        marginTop: 2,
        fontSize: 14,
        fontWeight: "700",
        color: "#1F2937",
    },
    warnText: {
        color: "#92400E",
        backgroundColor: "#FFFBEB",
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 10,
        fontSize: 12,
    },
    chartWrap: {
        marginTop: 4,
        borderRadius: 14,
        backgroundColor: "#F8FAFC",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        overflow: "hidden",
    },
    chartGrid: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 14,
        backgroundColor: "#F8FAFC",
    },
    segment: {
        position: "absolute",
        height: 2,
        backgroundColor: "#16A34A",
        borderRadius: 2,
    },
    chartPointWrap: {
        position: "absolute",
    },
    pointDot: {
        position: "absolute",
        width: 10,
        height: 10,
        borderRadius: 10,
        backgroundColor: "#16A34A",
        borderWidth: 2,
        borderColor: "#DCFCE7",
    },
    pointValue: {
        position: "absolute",
        color: "#14532D",
        fontSize: 11,
        fontWeight: "700",
    },
    pointLabel: {
        position: "absolute",
        color: "#4B5563",
        fontSize: 10,
        width: 48,
        textAlign: "center",
    },
    dataCard: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        backgroundColor: "#FAFAFA",
        padding: 12,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    dataValue: {
        fontSize: 14,
        fontWeight: "700",
        color: "#14532D",
    },
    dataTime: {
        fontSize: 12,
        color: "#6B7280",
    },
});

export default DeviceDataLog;