import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DeviceService } from "@/service/device.service";
import {
  StatisticPeriod,
  StatisticService,
  SensorStatisticResponse,
} from "@/service/statistic.service";
import {
  getBarStyle,
  getCurrentValueStyle,
  getLineChartWrapStyle,
  getLinePointStyle,
  getLineSegmentStyle,
  getPointLabelStyle,
  getPointValueStyle,
  styles,
} from "@/styles/(tabs)/(stats)/index.styles";

type PeriodOption = {
  value: StatisticPeriod;
  label: string;
};

const PERIOD_OPTIONS: PeriodOption[] = [
  { value: "today", label: "Hôm nay" },
  { value: "week", label: "7 ngày" },
  { value: "month", label: "Tháng này" },
];

const SENSOR_META = {
  temperatureSensor: { icon: "🌡️", title: "Nhiệt độ", color: "#EF4444" },
  humiditySensor: { icon: "💧", title: "Độ ẩm", color: "#0EA5E9" },
  lightSensor: { icon: "☀️", title: "Ánh sáng", color: "#F59E0B" },
} as const;

type TrendPoint = {
  x: number;
  y: number;
  label: string;
  value: number;
};

const formatValue = (value: number | null, unit = "") => {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }
  return `${value.toFixed(1)}${unit}`;
};

export default function StatsScreen() {
  const [sensors, setSensors] = useState<DeviceResponse[]>([]);
  const [selectedSensorId, setSelectedSensorId] = useState<string>("");
  const [period, setPeriod] = useState<StatisticPeriod>("today");
  const [stats, setStats] = useState<SensorStatisticResponse | null>(null);
  const [loadingSensors, setLoadingSensors] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchSensors = async () => {
      setLoadingSensors(true);
      setError("");
      try {
        const response = await DeviceService.getSensorDevices();
        const sensorDevices = response.data;
        setSensors(sensorDevices);
        if (sensorDevices.length > 0) {
          setSelectedSensorId(sensorDevices[0]._id);
        }
      } catch {
        setError("Không thể tải danh sách cảm biến.");
      } finally {
        setLoadingSensors(false);
      }
    };

    fetchSensors();
  }, []);

  useEffect(() => {
    if (!selectedSensorId) {
      return;
    }

    const fetchStats = async () => {
      setLoadingStats(true);
      setError("");
      try {
        const response = await StatisticService.getSensorStats(selectedSensorId, period);
        setStats(response.data);
      } catch {
        setError("Không thể tải dữ liệu thống kê.");
        setStats(null);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [selectedSensorId, period]);

  const selectedSensor = useMemo(
    () => sensors.find((sensor) => sensor._id === selectedSensorId),
    [sensors, selectedSensorId],
  );

  const sensorType = stats?.type ?? selectedSensor?.type;
  const sensorMeta =
    sensorType && sensorType in SENSOR_META
      ? SENSOR_META[sensorType as keyof typeof SENSOR_META]
      : { icon: "📈", title: "Thống kê", color: "#22C55E" };

  const chartPoints = useMemo(() => stats?.chartData ?? [], [stats]);
  const chartWidth = Math.max(chartPoints.length * 56, 300);
  const lineChartHeight = 220;
  const linePaddingX = 24;
  const lineTop = 30;
  const lineBottom = 46;

  const maxPointValue = useMemo(() => {
    if (chartPoints.length === 0) {
      return 0;
    }
    return Math.max(...chartPoints.map((point) => point.value));
  }, [chartPoints]);

  const minPointValue = useMemo(() => {
    if (chartPoints.length === 0) {
      return 0;
    }
    return Math.min(...chartPoints.map((point) => point.value));
  }, [chartPoints]);

  const trendPoints = useMemo<TrendPoint[]>(() => {
    if (chartPoints.length === 0) {
      return [];
    }

    const usableHeight = lineChartHeight - lineTop - lineBottom;
    const usableWidth = chartWidth - linePaddingX * 2;
    const valueRange = maxPointValue - minPointValue;

    return chartPoints.map((point, index) => {
      const ratioY =
        valueRange === 0 ? 0.5 : (point.value - minPointValue) / valueRange;
      const x =
        chartPoints.length === 1
          ? chartWidth / 2
          : linePaddingX + (index / (chartPoints.length - 1)) * usableWidth;
      const y = lineTop + (1 - ratioY) * usableHeight;

      return {
        x,
        y,
        label: point.label,
        value: point.value,
      };
    });
  }, [chartPoints, chartWidth, lineChartHeight, linePaddingX, lineTop, lineBottom, maxPointValue, minPointValue]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Thống kê cảm biến</Text>
          <Text style={styles.subtitle}>Theo dõi dữ liệu theo thời gian thực</Text>
        </View>

        <View style={styles.selectorCard}>
          <Text style={styles.label}>Chọn cảm biến</Text>
          {loadingSensors ? (
            <ActivityIndicator color="#22C55E" />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.sensorChipRow}>
                {sensors.map((sensor) => {
                  const active = sensor._id === selectedSensorId;
                  return (
                    <TouchableOpacity
                      key={sensor._id}
                      style={[styles.sensorChip, active && styles.sensorChipActive]}
                      onPress={() => setSelectedSensorId(sensor._id)}
                    >
                      <Text style={[styles.sensorChipName, active && styles.sensorChipNameActive]}>
                        {sensor.name}
                      </Text>
                      <Text style={[styles.sensorChipRoom, active && styles.sensorChipRoomActive]}>
                        {sensor.roomId.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}

          <Text style={[styles.label, styles.periodLabel]}>Khoảng thời gian</Text>
          <View style={styles.periodRow}>
            {PERIOD_OPTIONS.map((item) => {
              const active = item.value === period;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.periodBtn, active && styles.periodBtnActive]}
                  onPress={() => setPeriod(item.value)}
                >
                  <Text style={[styles.periodBtnText, active && styles.periodBtnTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.statsCard}>
          <View style={styles.statsCardHeader}>
            <Text style={styles.sensorIcon}>{sensorMeta.icon}</Text>
            <View>
              <Text style={styles.statsCardTitle}>{sensorMeta.title}</Text>
              <Text style={styles.statsCardSubTitle}>{stats?.deviceName ?? selectedSensor?.name ?? "--"}</Text>
            </View>
          </View>

          {loadingStats ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={sensorMeta.color} />
              <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
          ) : (
            <>
              <View style={styles.currentValueWrap}>
                <Text style={styles.currentLabel}>Giá trị hiện tại</Text>
                <Text style={[styles.currentValue, getCurrentValueStyle(sensorMeta.color)]}>
                  {formatValue(stats?.currentValue ?? null, stats?.unit ?? "")}
                </Text>
              </View>

              <Text style={styles.chartTitle}>Đồ thị thay đổi theo thời gian</Text>
              {chartPoints.length === 0 ? (
                <Text style={styles.noDataText}>Chưa có dữ liệu trong khoảng thời gian đã chọn.</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={[styles.lineChartWrap, getLineChartWrapStyle(chartWidth, lineChartHeight)]}>
                    <View style={styles.lineChartGrid} />

                    {trendPoints.slice(1).map((point, index) => {
                      const prev = trendPoints[index];
                      const deltaX = point.x - prev.x;
                      const deltaY = point.y - prev.y;
                      const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                      const angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
                      const segmentLeft = (prev.x + point.x) / 2 - length / 2;
                      const segmentTop = (prev.y + point.y) / 2 - 1;

                      return (
                        <View
                          key={`${prev.label}-${point.label}`}
                          style={[
                            styles.lineSegment,
                            getLineSegmentStyle(segmentLeft, segmentTop, length, sensorMeta.color, angle),
                          ]}
                        />
                      );
                    })}

                    {trendPoints.map((point) => (
                      <View key={`${point.label}-${point.value}`} style={styles.linePointWrap}>
                        <Text style={[styles.pointValue, getPointValueStyle(point.x - 20, point.y - 24)]}>
                          {point.value.toFixed(1)}
                        </Text>
                        <View
                          style={[
                            styles.linePoint,
                            getLinePointStyle(point.x - 5, point.y - 5, sensorMeta.color),
                          ]}
                        />
                        <Text
                          style={[styles.pointLabel, getPointLabelStyle(point.x - 24, lineChartHeight - 18)]}
                          numberOfLines={1}
                        >
                          {point.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}

              <Text style={styles.chartTitle}>Biểu đồ cột theo mốc thời gian</Text>
              {chartPoints.length === 0 ? (
                <Text style={styles.noDataText}>Chưa có dữ liệu trong khoảng thời gian đã chọn.</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chartRow}>
                    {chartPoints.map((point) => {
                      const normalizedHeight =
                        maxPointValue === minPointValue
                          ? 56
                          : ((point.value - minPointValue) / (maxPointValue - minPointValue)) * 90 + 24;

                      return (
                        <View key={`bar-${point.label}-${point.value}`} style={styles.barWrap}>
                          <Text style={styles.barValue}>{point.value.toFixed(1)}</Text>
                          <View
                            style={[
                              styles.bar,
                              getBarStyle(normalizedHeight, sensorMeta.color),
                            ]}
                          />
                          <Text style={styles.barLabel} numberOfLines={1}>
                            {point.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              )}

              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Min</Text>
                  <Text style={styles.metricValue}>{formatValue(stats?.stats.min ?? null, stats?.unit ?? "")}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Avg</Text>
                  <Text style={styles.metricValue}>{formatValue(stats?.stats.avg ?? null, stats?.unit ?? "")}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Max</Text>
                  <Text style={styles.metricValue}>{formatValue(stats?.stats.max ?? null, stats?.unit ?? "")}</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}