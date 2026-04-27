import { SensorAlertService } from "@/service/sensorAlert.service";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import Svg, {
  Circle,
  G,
  Line,
  Polyline,
  Text as SvgText,
} from "react-native-svg";
import Icon from "react-native-vector-icons/FontAwesome5";

// ── Helpers ───────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;
const CHART_H = 160;
const SCREEN_W = Dimensions.get("window").width;
const SCREEN_H = Dimensions.get("window").height;
const BAR_AREA_W = SCREEN_W - 32; // padding 16 each side
const RANGE_OPTIONS = [
  { label: "Tất cả", days: 0 },
  { label: "7N", days: 7 },
  { label: "14N", days: 14 },
  { label: "30N", days: 30 },
];

const fmt = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const fmtDate = (d: Date) => d.toISOString().split("T")[0];

const getDiffText = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
};

const getAlertKey = (alert: SensorAlertResponse) => {
  if (alert._id) return alert._id;
  return [
    alert.deviceId?._id ?? "unknown-device",
    alert.createdAt ?? "unknown-time",
    String(alert.value ?? ""),
    String(alert.threshold ?? ""),
  ].join("|");
};

const dedupeAlerts = (items: SensorAlertResponse[]) => {
  const map = new Map<string, SensorAlertResponse>();
  items.forEach((item) => {
    map.set(getAlertKey(item), item);
  });
  return Array.from(map.values());
};

const normalizeAlertPage = (
  raw: any,
  fallbackPage: number,
  pageSize: number,
) => {
  const payload =
    raw?.items || raw?.content || raw?.data ? raw : (raw?.data ?? raw);

  const itemsRaw = payload?.items ?? payload?.content ?? payload?.rows ?? [];
  const items = Array.isArray(itemsRaw) ? itemsRaw : [];

  const totalItems = payload?.totalElement ?? 0;
  const currentPage =
    Number(
      payload?.currentPage ??
        payload?.page ??
        payload?.pageNumber ??
        fallbackPage,
    ) || fallbackPage;

  const totalPageFromPayload =
    Number(
      payload?.totalPage ?? payload?.totalPages ?? payload?.lastPage ?? 0,
    ) || 0;
  const totalPage =
    totalPageFromPayload > 0
      ? totalPageFromPayload
      : Math.max(1, Math.ceil(totalItems / pageSize));

  return { items, totalItems, currentPage, totalPage };
};

// ── Mini Line Chart ───────────────────────────────────────────────────────────
const MiniChart = ({
  alerts,
  rangeDays,
  onReachChartEnd,
}: {
  alerts: SensorAlertResponse[];
  rangeDays: number;
  onReachChartEnd?: () => void;
}) => {
  // Plot raw sensor values with newest samples first to match lazy list order.
  const samples = [...alerts]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .map((a) => {
      const createdAt = new Date(a.createdAt);
      const day = `${createdAt.getDate()}/${createdAt.getMonth() + 1}`;
      const time = `${String(createdAt.getHours()).padStart(2, "0")}:${String(createdAt.getMinutes()).padStart(2, "0")}`;
      const parsed = Number(a.value);
      return {
        key: a._id || `${a.createdAt}-${a.value}`,
        day,
        time,
        label: `${day}\n${time}`,
        value: Number.isFinite(parsed) ? parsed : null,
      };
    })
    .filter(
      (
        s,
      ): s is {
        key: string;
        day: string;
        time: string;
        label: string;
        value: number;
      } => s.value !== null,
    );

  const maxValue = Math.max(...samples.map((s) => s.value), 1);
  const midValue = maxValue / 2;
  const plotHeight = CHART_H - 52;
  const chartBodyHeight = CHART_H - 24;

  if (samples.length === 0) {
    return (
      <View style={chart.wrap}>
        <View style={chart.yAxis}>
          {[maxValue, midValue, 0].map((tick) => (
            <Text key={`tick-${tick}`} style={chart.yLabel}>
              {Number.isInteger(tick) ? String(tick) : tick.toFixed(1)}
            </Text>
          ))}
        </View>
        <View style={chart.plotWrap} />
      </View>
    );
  }

  let slotW = 44;
  if (rangeDays > 0 && rangeDays <= 7) slotW = 64;
  else if (rangeDays > 0 && rangeDays <= 14) slotW = 54;

  const minChartWidth = BAR_AREA_W - 28;
  const chartWidth = Math.max(minChartWidth, samples.length * slotW);
  const points = samples
    .map((sample, i) => {
      const x = i * slotW + slotW / 2;
      const ratio = sample.value / maxValue;
      const y = plotHeight - ratio * (plotHeight - 10);
      return `${x},${y}`;
    })
    .join(" ");

  const formatTick = (value: number) => {
    if (value === 0) return "0";
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  };

  const yAxisTicks = [
    { key: "top", value: maxValue },
    { key: "mid", value: midValue },
    { key: "bottom", value: 0 },
  ];

  return (
    <View style={chart.wrap}>
      {/* Y-axis labels */}
      <View style={chart.yAxis}>
        {yAxisTicks.map((tick) => (
          <Text key={tick.key} style={chart.yLabel}>
            {formatTick(tick.value)}
          </Text>
        ))}
      </View>

      {/* Line chart */}
      <View style={chart.plotWrap}>
        <ScrollView
          horizontal
          nestedScrollEnabled
          directionalLockEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={chart.hScrollContent}
          onMomentumScrollEnd={(event) => {
            const { contentOffset, contentSize, layoutMeasurement } =
              event.nativeEvent;
            const remain =
              contentSize.width - (contentOffset.x + layoutMeasurement.width);
            if (remain <= 24) {
              onReachChartEnd?.();
            }
          }}
        >
          <View style={[chart.plotInner, { width: chartWidth }]}>
            <Svg width={chartWidth} height={chartBodyHeight}>
              {[0, 1, 2].map((i) => {
                const y = (plotHeight / 2) * i;
                return (
                  <Line
                    key={`grid-${i}`}
                    x1={0}
                    y1={y}
                    x2={chartWidth}
                    y2={y}
                    stroke="#F3F4F6"
                    strokeWidth={1}
                  />
                );
              })}

              <Polyline
                points={points}
                fill="none"
                stroke="#EF4444"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {samples.map((sample, i) => {
                const x = i * slotW + slotW / 2;
                const ratio = sample.value / maxValue;
                const y = plotHeight - ratio * (plotHeight - 10);
                return (
                  <Circle
                    key={`dot-${sample.key}`}
                    cx={x}
                    cy={y}
                    r={2.7}
                    fill="#FFFFFF"
                    stroke="#EF4444"
                    strokeWidth={2}
                  />
                );
              })}

              {samples.map((sample, i) => {
                const x = i * slotW + slotW / 2;
                const ratio = sample.value / maxValue;
                const y = plotHeight - ratio * (plotHeight - 10);
                const isTooHigh = y < 22;
                const dayY = isTooHigh ? y + 13 : Math.max(8, y - 16);
                const timeY = isTooHigh ? y + 22 : Math.max(16, y - 7);

                return (
                  <G key={`dot-label-${sample.key}`}>
                    <SvgText
                      x={x}
                      y={dayY}
                      fill="#9CA3AF"
                      fontSize="7"
                      textAnchor="middle"
                    >
                      {sample.day}
                    </SvgText>
                    <SvgText
                      x={x}
                      y={timeY}
                      fill="#9CA3AF"
                      fontSize="7"
                      textAnchor="middle"
                    >
                      {sample.time}
                    </SvgText>
                  </G>
                );
              })}
            </Svg>

            <View style={chart.xLabelsRow}>
              {samples.map((sample, i) => (
                <Text
                  key={`label-${sample.key}`}
                  style={[chart.xLabel, { width: slotW }]}
                  numberOfLines={2}
                >
                  {sample.label}
                </Text>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const chart = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    height: CHART_H,
    paddingBottom: 20,
    paddingTop: 4,
  },
  yAxis: {
    width: 28,
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 24,
  },
  yLabel: { fontSize: 9, color: "#9CA3AF", fontWeight: "600" },
  plotWrap: { flex: 1, overflow: "hidden" },
  hScrollContent: { paddingRight: 8 },
  plotInner: {
    height: CHART_H - 24,
  },
  xLabelsRow: {
    marginTop: 2,
    flexDirection: "row",
  },
  xLabel: {
    fontSize: 7,
    lineHeight: 10,
    color: "#9CA3AF",
    textAlign: "center",
  },
});

// ── Alert Card (lazy animated) ────────────────────────────────────────────────
const AlertCard = ({
  alert,
  visible,
}: {
  alert: SensorAlertResponse;
  visible: boolean;
}) => {
  const anim = useRef(new Animated.Value(0)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (visible && !hasAnimated.current) {
      hasAnimated.current = true;
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const diff = Number(alert.value) - alert.threshold;
  const pct =
    alert.threshold > 0
      ? ((Number(alert.value) / alert.threshold) * 100).toFixed(0)
      : "—";

  return (
    <Animated.View
      style={[
        ac.wrap,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      {/* Left accent */}
      <View style={ac.accent} />

      <View style={ac.body}>
        <View style={ac.topRow}>
          <View style={ac.valuePill}>
            <Icon name="exclamation-triangle" size={9} color="#EF4444" />
            <Text style={ac.valueText}>{Number(alert.value).toFixed(1)}</Text>
          </View>
          <Text style={ac.threshold}>Ngưỡng: {alert.threshold}</Text>
          <Text style={ac.time}>{getDiffText(alert.createdAt)}</Text>
        </View>

        <View style={ac.bottomRow}>
          {/* Mini progress bar */}
          <View style={ac.progressTrack}>
            <View
              style={[
                ac.progressFill,
                { width: `${Math.min(Number(pct), 100)}%` },
              ]}
            />
            <View style={ac.progressThreshold} />
          </View>
          <Text style={ac.diffText}>
            {diff >= 0 ? "+" : ""}
            {diff.toFixed(1)} so với ngưỡng
          </Text>
        </View>

        <Text style={ac.dateText}>{fmt(alert.createdAt)}</Text>
      </View>
    </Animated.View>
  );
};

const ac = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 8,
  },
  accent: { width: 3, backgroundColor: "#EF4444" },
  body: { flex: 1, padding: 12, gap: 7 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  valuePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  valueText: { fontSize: 12, fontWeight: "800", color: "#EF4444" },
  threshold: { fontSize: 11, color: "#9CA3AF", fontWeight: "500" },
  time: { fontSize: 11, color: "#9CA3AF", marginLeft: "auto" },
  bottomRow: { gap: 4 },
  progressTrack: {
    height: 4,
    backgroundColor: "#F3F4F6",
    borderRadius: 2,
    overflow: "hidden",
    position: "relative",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#EF4444",
    borderRadius: 2,
    opacity: 0.7,
  },
  progressThreshold: {
    position: "absolute",
    left: "100%",
    top: -2,
    width: 1,
    height: 8,
    backgroundColor: "#374151",
  },
  diffText: { fontSize: 10, color: "#6B7280", fontWeight: "600" },
  dateText: { fontSize: 10, color: "#D1D5DB" },
});

// ── Main Component ────────────────────────────────────────────────────────────
const SensorAlertComponent = ({
  device,
}: {
  device: DeviceResponse | null;
}) => {
  const [alerts, setAlerts] = useState<SensorAlertResponse[]>([]);
  const [allAlerts, setAllAlerts] = useState<SensorAlertResponse[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState<number>(7);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [maxVal, setMaxVal] = useState(0);
  const [minVal, setMinVal] = useState(0);
  const [avgVal, setAvgVal] = useState(0);
  // Intersection Observer equivalent: track which items are visible
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const inFlightPagesRef = useRef<Set<number>>(new Set());
  const loadedPagesRef = useRef<Set<number>>(new Set());
  const chartEndThrottleUntilRef = useRef(0);
  const listEndThrottleUntilRef = useRef(0);
  const hasListScrolledRef = useRef(false);
  const pageRef = useRef(1);

  const resolvedDeviceId =
    device?.id || (device as (DeviceResponse & { _id?: string }) | null)?._id;

  const getDateRange = (days: number) => {
    if (days <= 0) {
      return {
        startDate: undefined,
        endDate: undefined,
      };
    }

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  };

  const loadPage = useCallback(
    async (pageNum: number, reset = false) => {
      if (!resolvedDeviceId || loading) return;

      if (!reset && loadedPagesRef.current.has(pageNum)) return;
      if (inFlightPagesRef.current.has(pageNum)) return;
      inFlightPagesRef.current.add(pageNum);

      if (pageNum === 1) setInitialLoading(true);
      else setLoading(true);
      setLoadError(null);

      try {
        const { startDate, endDate } = getDateRange(rangeDays);
        const res = await SensorAlertService.getAlerts(
          resolvedDeviceId,
          pageNum,
          PAGE_SIZE,
          startDate,
          endDate,
        );

        const data = res.data;

        const normalizedData = data.items;
        const currentPage = data.currentPage;
        const totalPage = data.totalPage;
        const totalItem = data.totalElement;

        if (reset) {
          loadedPagesRef.current.clear();
          setAlerts(normalizedData);
          setAllAlerts(normalizedData);
          setMinVal(data.min);
          setMaxVal(data.max);
          setAvgVal(data.average);
        } else {
          setAlerts((prev) => {
            return dedupeAlerts([...prev, ...normalizedData]);
          });
          setAllAlerts((prev) => {
            return dedupeAlerts([...prev, ...normalizedData]);
          });
        }

        loadedPagesRef.current.add(currentPage);
        setHasMore(currentPage < totalPage);
        setTotalItems(totalItem);
        pageRef.current = currentPage;
      } catch (e) {
        console.error(e);
        setLoadError("Không tải được dữ liệu cảnh báo. Vui lòng thử lại.");
      } finally {
        inFlightPagesRef.current.delete(pageNum);
        setInitialLoading(false);
        setLoading(false);
      }
    },
    [resolvedDeviceId, rangeDays, loading],
  );

  useEffect(() => {
    if (!resolvedDeviceId) return;
    inFlightPagesRef.current.clear();
    loadedPagesRef.current.clear();
    chartEndThrottleUntilRef.current = 0;
    listEndThrottleUntilRef.current = 0;
    hasListScrolledRef.current = false;
    pageRef.current = 1;
    setHasMore(true);
    setTotalItems(0);
    setAlerts([]);
    setAllAlerts([]);
    setLoadError(null);
    loadPage(1, true);
  }, [resolvedDeviceId, rangeDays]);

  // IntersectionObserver equivalent via onViewableItemsChanged
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      setVisibleIds((prev) => {
        const next = new Set(prev);
        viewableItems.forEach((item) => {
          if (item.isViewable && item.item?._id) next.add(item.item._id);
        });
        return next;
      });
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 20,
  }).current;

  const handleReachChartEnd = () => {
    if (Date.now() < chartEndThrottleUntilRef.current) {
      return;
    }

    if (hasMore && !loading && !initialLoading) {
      chartEndThrottleUntilRef.current = Date.now() + 700;
      loadPage(pageRef.current + 1);
    }
  };

  const handleListScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (event.nativeEvent.contentOffset.y > 8) {
      hasListScrolledRef.current = true;
    }
  };

  const handleListEndReached = () => {
    if (!hasListScrolledRef.current) {
      return;
    }

    if (Date.now() < listEndThrottleUntilRef.current) {
      return;
    }

    if (hasMore && !loading && !initialLoading) {
      listEndThrottleUntilRef.current = Date.now() + 700;
      loadPage(pageRef.current + 1);
    }
  };

  const totalAlerts = totalItems || allAlerts.length;

  let chartContent: React.ReactNode;
  if (initialLoading) {
    chartContent = (
      <View style={s.chartLoading}>
        <ActivityIndicator color="#EF4444" />
      </View>
    );
  } else if (allAlerts.length === 0) {
    chartContent = (
      <View style={s.chartEmpty}>
        <Icon name="bell-slash" size={20} color="#D1D5DB" />
        <Text style={s.chartEmptyText}>
          {loadError ??
            (rangeDays > 0
              ? `Không có cảnh báo trong ${rangeDays} ngày qua`
              : "Không có cảnh báo")}
        </Text>
      </View>
    );
  } else {
    chartContent = (
      <MiniChart
        alerts={allAlerts}
        rangeDays={rangeDays}
        onReachChartEnd={handleReachChartEnd}
      />
    );
  }

  let listFooterContent: React.ReactNode = null;
  if (loading) {
    listFooterContent = (
      <View style={s.footerLoading}>
        <ActivityIndicator size="small" color="#EF4444" />
      </View>
    );
  } else if (!hasMore && alerts.length > 0) {
    listFooterContent = (
      <View style={s.footerEnd}>
        <View style={s.footerLine} />
        <Text style={s.footerText}>Đã tải hết</Text>
        <View style={s.footerLine} />
      </View>
    );
  }

  if (!device) return null;

  return (
    <View style={s.root}>
      {/* ── Chart card ── */}
      <View style={s.card}>
        {/* Chart header */}
        <View style={s.chartHeader}>
          <View>
            <Text style={s.chartTitle}>Lịch sử cảnh báo</Text>
            <Text style={s.chartSub}>
              {rangeDays > 0
                ? "Giá trị cảm biến theo thời gian"
                : "Toàn bộ lịch sử giá trị cảm biến"}
            </Text>
          </View>
          {/* Range selector */}
          <View style={s.rangeRow}>
            {RANGE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.days}
                style={[s.rangeBtn, rangeDays === opt.days && s.rangeBtnActive]}
                onPress={() => setRangeDays(opt.days)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    s.rangeBtnText,
                    rangeDays === opt.days && s.rangeBtnTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats strip */}
        <View style={s.statsStrip}>
          <View style={s.statItem}>
            <Text style={s.statVal}>{totalAlerts}</Text>
            <Text style={s.statLabel}>Cảnh báo</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={[s.statVal, { color: "#EF4444" }]}>
              {maxVal}
            </Text>
            <Text style={s.statLabel}>Cao nhất</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={[s.statVal, { color: "#D97706" }]}>{avgVal}</Text>
            <Text style={s.statLabel}>Trung bình</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={[s.statVal, { color: "#6B7280" }]}>
              {minVal}
            </Text>
            <Text style={s.statLabel}>Nhỏ nhất</Text>
          </View>
        </View>

        {/* Bar chart */}
        <View style={s.chartArea}>{chartContent}</View>
      </View>

      {/* ── Alert list header ── */}
      {!initialLoading && alerts.length > 0 && (
        <View style={s.listHeader}>
          <View style={s.listHeaderDot} />
          <Text style={s.listHeaderText}>Chi tiết cảnh báo</Text>
          <Text style={s.listHeaderCount}>
            {alerts.length} / {totalAlerts}
          </Text>
        </View>
      )}

      {/* ── Lazy list ── */}
      {!initialLoading && (
        <FlatList
          style={s.alertList}
          data={alerts}
          keyExtractor={(item) => getAlertKey(item)}
          renderItem={({ item }) => (
            <AlertCard alert={item} visible={visibleIds.has(item._id)} />
          )}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onScroll={handleListScroll}
          scrollEventThrottle={16}
          onEndReached={handleListEndReached}
          onEndReachedThreshold={0.2}
          scrollEnabled
          nestedScrollEnabled
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Icon name="check-circle" size={28} color="#22C55E" />
              <Text style={s.emptyTitle}>
                {loadError ? "Tải dữ liệu thất bại" : "Không có cảnh báo"}
              </Text>
              <Text style={s.emptyBody}>
                {loadError ??
                  (rangeDays > 0
                    ? `Thiết bị đang hoạt động ổn định trong ${rangeDays} ngày qua.`
                    : "Thiết bị đang hoạt động ổn định.")}
              </Text>
            </View>
          }
          ListFooterComponent={listFooterContent}
        />
      )}
    </View>
  );
};

export default SensorAlertComponent;

const s = StyleSheet.create({
  root: { gap: 12 },

  // Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  // Chart header
  chartHeader: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    gap: 8,
  },
  chartTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  chartSub: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  rangeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 4,
    rowGap: 6,
  },
  rangeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  rangeBtnActive: { backgroundColor: "#FEE2E2" },
  rangeBtnText: { fontSize: 10, fontWeight: "700", color: "#9CA3AF" },
  rangeBtnTextActive: { color: "#EF4444" },

  // Stats strip
  statsStrip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FAFAFA",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#F3F4F6",
  },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statVal: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.3,
  },
  statLabel: { fontSize: 10, color: "#9CA3AF", fontWeight: "500" },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: "#E5E7EB",
  },

  // Chart area
  chartArea: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    minHeight: CHART_H + 8,
  },
  chartLoading: {
    height: CHART_H,
    alignItems: "center",
    justifyContent: "center",
  },
  chartEmpty: {
    height: CHART_H,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  chartEmptyText: { fontSize: 12, color: "#9CA3AF", textAlign: "center" },

  alertList: {
    maxHeight: SCREEN_H * 0.48,
  },

  // List header
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 2,
  },
  listHeaderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EF4444",
  },
  listHeaderText: { fontSize: 13, fontWeight: "700", color: "#374151" },
  listHeaderCount: { fontSize: 12, color: "#9CA3AF", marginLeft: "auto" },

  // Empty
  emptyWrap: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    gap: 10,
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#374151" },
  emptyBody: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },

  // Footer
  footerLoading: { paddingVertical: 16, alignItems: "center" },
  footerEnd: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  footerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E7EB",
  },
  footerText: { fontSize: 11, color: "#D1D5DB", fontWeight: "600" },
});
