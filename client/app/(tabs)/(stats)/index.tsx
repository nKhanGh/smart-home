import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart } from "react-native-gifted-charts";
import { StatisticService } from "@/service/statistic.service";
import { statsStyles as styles } from "@/styles/(tabs)/stats.styles";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_WIDTH = SCREEN_WIDTH - 40 - 32; // screen - horizontal padding - card padding

type Period = "today" | "week" | "month";
type SensorType = "temperatureSensor" | "humiditySensor" | "lightSensor";

const SENSOR_TYPES: { type: SensorType; emoji: string; label: string; color: string }[] = [
  { type: "temperatureSensor", emoji: "🌡️", label: "NHIỆT ĐỘ", color: "#F97316" },
  { type: "humiditySensor",    emoji: "💧", label: "ĐỘ ẨM",    color: "#3B82F6" },
  { type: "lightSensor",       emoji: "☀️", label: "ÁNH SÁNG", color: "#F59E0B" },
];

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Hôm nay" },
  { key: "week",  label: "Tuần"    },
  { key: "month", label: "Tháng"   },
];

export default function StatsScreen() {
  const [rooms, setRooms] = useState<RoomWithSensors[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<RoomWithSensors | null>(null);
  const [sensors, setSensors] = useState<SensorInRoom[]>([]);
  const [selectedSensorType, setSelectedSensorType] = useState<SensorType>("temperatureSensor");
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("today");
  const [statData, setStatData] = useState<SensorStatResponse | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingStat, setLoadingStat] = useState(false);

  // Fetch rooms on mount
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await StatisticService.getRoomsWithSensors();
        setRooms(res.data);
        if (res.data.length > 0) {
          setSelectedRoom(res.data[0]);
        }
      } catch (err) {
        console.error("Error fetching rooms:", err);
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, []);

  // Fetch sensors when room changes
  useEffect(() => {
    if (!selectedRoom) return;
    const fetchSensors = async () => {
      try {
        const res = await StatisticService.getSensorsByRoom(selectedRoom._id);
        setSensors(res.data);
      } catch (err) {
        console.error("Error fetching sensors:", err);
      }
    };
    fetchSensors();
  }, [selectedRoom]);

  // Fetch stats when sensor type, room, or period changes
  const fetchStats = useCallback(async () => {
    if (!sensors.length) return;
    const sensor = sensors.find((s) => s.type === selectedSensorType);
    if (!sensor) {
      setStatData(null);
      return;
    }
    setLoadingStat(true);
    try {
      const res = await StatisticService.getSensorStats(sensor._id, selectedPeriod);
      setStatData(res.data);
    } catch (err) {
      console.error("Error fetching sensor stats:", err);
      setStatData(null);
    } finally {
      setLoadingStat(false);
    }
  }, [sensors, selectedSensorType, selectedPeriod]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const activeSensorConfig =
    SENSOR_TYPES.find((s) => s.type === selectedSensorType) ?? SENSOR_TYPES[0];

  const chartLineData =
    statData?.chartData.map((point) => ({ value: point.value, label: point.label })) ?? [];

  const hasSensorOfType = sensors.some((s) => s.type === selectedSensorType);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Thống kê 📊</Text>
            <Text style={styles.headerSubtitle}>Theo dõi cảm biến nhà bạn</Text>
          </View>
        </View>

        {/* ── Period selector ── */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[
                styles.periodButton,
                selectedPeriod === p.key && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(p.key)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === p.key && styles.periodButtonTextActive,
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Sensor type selector ── */}
        <View style={styles.sensorTypeRow}>
          {SENSOR_TYPES.map((s) => (
            <TouchableOpacity
              key={s.type}
              style={[
                styles.sensorTypeButton,
                selectedSensorType === s.type && [
                  styles.sensorTypeButtonActive,
                  { borderColor: s.color },
                ],
              ]}
              onPress={() => setSelectedSensorType(s.type)}
            >
              <Text style={styles.sensorTypeEmoji}>{s.emoji}</Text>
              <Text
                style={[
                  styles.sensorTypeText,
                  selectedSensorType === s.type && styles.sensorTypeTextActive,
                ]}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Room picker ── */}
        {loadingRooms ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#22C55E" />
          </View>
        ) : rooms.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🏠</Text>
            <Text style={styles.emptyText}>Không tìm thấy phòng nào có cảm biến.</Text>
          </View>
        ) : (
          <View style={styles.roomPickerCard}>
            <Text style={styles.roomPickerLabel}>Chọn phòng</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.roomScrollRow}>
                {rooms.map((room) => (
                  <TouchableOpacity
                    key={room._id}
                    style={[
                      styles.roomChip,
                      selectedRoom?._id === room._id && styles.roomChipActive,
                    ]}
                    onPress={() => setSelectedRoom(room)}
                  >
                    <Text
                      style={[
                        styles.roomChipText,
                        selectedRoom?._id === room._id && styles.roomChipTextActive,
                      ]}
                    >
                      {room.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ── Stats content ── */}
        {!loadingRooms && selectedRoom && (
          <>
            {!hasSensorOfType ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>{activeSensorConfig.emoji}</Text>
                <Text style={styles.emptyText}>
                  Phòng này không có cảm biến {activeSensorConfig.label.toLowerCase()}.
                </Text>
              </View>
            ) : loadingStat ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#22C55E" />
                <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
              </View>
            ) : statData ? (
              <>
                {/* ── Current value card ── */}
                <View style={styles.currentValueCard}>
                  <View
                    style={[
                      styles.currentValueAccent,
                      { backgroundColor: activeSensorConfig.color },
                    ]}
                  />
                  <View style={styles.currentValueHeader}>
                    <Text style={styles.currentValueEmoji}>
                      {activeSensorConfig.emoji}
                    </Text>
                    <Text style={styles.currentValueDeviceName}>
                      {statData.deviceName}
                    </Text>
                  </View>
                  <View style={styles.currentValueRow}>
                    <Text style={styles.currentValueNumber}>
                      {typeof statData.currentValue === "number"
                        ? statData.currentValue.toFixed(1)
                        : statData.currentValue}
                    </Text>
                    <Text style={styles.currentValueUnit}>{statData.unit}</Text>
                  </View>

                  {/* Min / Avg / Max */}
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Min</Text>
                      <Text style={[styles.statValue, { color: "#3B82F6" }]}>
                        {statData.stats.min.toFixed(1)}
                      </Text>
                      <Text style={styles.statUnit}>{statData.unit}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Trung bình</Text>
                      <Text style={[styles.statValue, { color: "#22C55E" }]}>
                        {statData.stats.avg.toFixed(1)}
                      </Text>
                      <Text style={styles.statUnit}>{statData.unit}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Max</Text>
                      <Text style={[styles.statValue, { color: "#EF4444" }]}>
                        {statData.stats.max.toFixed(1)}
                      </Text>
                      <Text style={styles.statUnit}>{statData.unit}</Text>
                    </View>
                  </View>
                </View>

                {/* ── Chart card ── */}
                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>
                    {activeSensorConfig.emoji} Biểu đồ{" "}
                    {activeSensorConfig.label.toLowerCase()} –{" "}
                    {PERIODS.find((p) => p.key === selectedPeriod)?.label}
                  </Text>
                  {chartLineData.length === 0 ? (
                    <Text style={styles.noDataText}>Không có dữ liệu cho khoảng thời gian này.</Text>
                  ) : (
                    <View style={styles.chartWrapper}>
                      <LineChart
                        data={chartLineData}
                        width={CHART_WIDTH}
                        height={200}
                        color={activeSensorConfig.color}
                        thickness={2.5}
                        dataPointsColor={activeSensorConfig.color}
                        dataPointsRadius={4}
                        startFillColor={activeSensorConfig.color}
                        endFillColor={"#F0FAF0"}
                        startOpacity={0.25}
                        endOpacity={0.02}
                        areaChart
                        curved
                        hideDataPoints={chartLineData.length > 20}
                        xAxisLabelTextStyle={{ color: "#9CA3AF", fontSize: 10 }}
                        yAxisTextStyle={{ color: "#9CA3AF", fontSize: 10 }}
                        yAxisColor="#E5E7EB"
                        xAxisColor="#E5E7EB"
                        rulesColor="#F3F4F6"
                        rulesType="solid"
                        noOfSections={4}
                        maxValue={
                          chartLineData.length > 0
                            ? Math.ceil(
                                (Math.max(...chartLineData.map((d) => d.value)) * 1.15) / 5
                              ) * 5
                            : 100
                        }
                        isAnimated
                        animationDuration={600}
                        showXAxisIndices={false}
                        rotateLabel={chartLineData.length > 10}
                      />
                    </View>
                  )}
                </View>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
