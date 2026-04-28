import DeviceActionLog from "@/components/devices/DeviceActionLog";
import DeviceAutoComponent from "@/components/devices/DeviceAutoComponent";
import DeviceDataLog from "@/components/devices/DeviceDataLog";
import DeviceScheduleComponent from "@/components/devices/DeviceScheduleComponent";
import DoorComponent from "@/components/devices/DoorComponent";
import FanComponent from "@/components/devices/FanComponent";
import LightComponent from "@/components/devices/LightComponent";
import MotionSensorComponent from "@/components/devices/MotionSensorComponent";
import SensorAlertComponent from "@/components/devices/SensorAlertComponent";
import SensorComponent from "@/components/devices/SensorComponent";
import DeviceEditModal from "@/components/modals/DeviceEditModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { DeviceService } from "@/service/device.service";
import { styles } from "@/styles/(tabs)/(devices)/[deviceId].styles";
import {
  getAction,
  getDeviceIcon,
  getUnit,
  isSensor,
} from "@/utils/devices.util";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/FontAwesome5";

// ─────────────────────────────────────────────────────────────────────────────
// Motion sensor có màn hình riêng — không dùng tab Lịch sử / Cài đặt chung
// ─────────────────────────────────────────────────────────────────────────────
const isMotionSensor = (type?: string) => type === "motionSensor";
const isSensorLikeType = (type?: string) =>
  (type || "").trim().toLowerCase().includes("sensor");

const getHistoryComponent = (device: DeviceResponse | null) => {
  if (!device) return null;
  if (device.type.endsWith("Sensor"))
    return <DeviceDataLog deviceId={device.id} />;
  else if (device.type.endsWith("Device"))
    return <DeviceActionLog deviceId={device.id} />;
};

const getSettingsComponent = (device: DeviceResponse | null) => {
  if (!device) return null;

  switch (device.type) {
    case "lightDevice":
      return <LightComponent device={device} />;
    case "fanDevice":
      return <FanComponent device={device} />;
    case "doorDevice":
      return <DoorComponent device={device} />;
    case "temperatureSensor":
    case "humiditySensor":
    case "lightSensor":
      return <SensorComponent device={device} />;
    case "motionSensor":
      return <MotionSensorComponent device={device} />;
    default:
      return null;
  }
};

const getAlertComponent = (device: DeviceResponse | null) => {
  if (!device) return null;

  if (isSensorLikeType(device.type)) {
    return <SensorAlertComponent device={device} />;
  }

  return null;
};

type TabKey = "settings" | "history" | "alerts";

// ─────────────────────────────────────────────────────────────────────────────

const DeviceDetailScreen = () => {
  const { deviceId } = useLocalSearchParams();
  const { user } = useAuth();

  const [device, setDevice] = useState<DeviceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeSetting, setTypeSetting] = useState<"auto" | "schedule">("auto");
  const [active, setActive] = useState<TabKey>("settings");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const { subscribe } = useSocket();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const handleDeviceUpdate = (data: any) => {
      if (data.deviceId === deviceId) {
        setDevice((prev) =>
          prev ? { ...prev, currentAction: data.value } : prev,
        );
      }
    };
    const unsubscribe = subscribe("device:action", handleDeviceUpdate);
    return () => {
      unsubscribe();
    };
  }, [subscribe, deviceId]);

  const showAlertTab = !!device && isSensorLikeType(device.type);
  const isDoorDevice = device?.type === "doorDevice";

  const visibleTabs = showAlertTab
    ? (["settings", "history", "alerts"] as const)
    : (["settings", "history"] as const);

  const getTabIndex = (tab: TabKey) => {
    const index = visibleTabs.indexOf(tab as any);
    return Math.max(index, 0);
  };

  const switchTab = (tab: TabKey) => {
    if (tab === active) return;
    if (tab === "alerts" && !showAlertTab) return;
    const targetIndex = getTabIndex(tab);
    setActive(tab);
    Animated.spring(slideAnim, {
      toValue: targetIndex,
      useNativeDriver: false,
      bounciness: 0,
      speed: 14,
    }).start();
  };

  useEffect(() => {
    const activeIndex = getTabIndex(active);
    slideAnim.setValue(activeIndex);
  }, [showAlertTab]);

  const sliderLeft = slideAnim.interpolate({
    inputRange: visibleTabs.map((_, idx) => idx),
    outputRange: visibleTabs.map(
      (_, idx) => `${(100 / visibleTabs.length) * idx}%`,
    ),
  });

  useEffect(() => {
    setDevice(null);
    setLoading(true);
    const fetchDeviceDetails = async () => {
      try {
        const response = await DeviceService.getDeviceById(deviceId as string);
        setDevice(response.data);
        setTypeSetting(
          response.data?.type === "doorDevice" ? "schedule" : "auto",
        );
      } catch (error) {
        console.error("Error fetching device details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDeviceDetails();
  }, [deviceId]);

  // ── Motion sensor: render màn hình riêng, bỏ qua toàn bộ layout chung ──
  // if (!loading && isMotionSensor(device?.type)) {
  //   return (
  //     <SafeAreaView style={styles.safe}>
  //       <MotionSensorComponent device={device} />
  //     </SafeAreaView>
  //   );
  // }

  // ── Layout chung cho các thiết bị còn lại ──
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace("/(tabs)/(rooms)")}>
            <Icon name="angle-left" size={20} color="#000" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}> {device?.name}</Text>
            <Text style={styles.headerSubTitle}>{device?.roomId.name}</Text>
          </View>
          {isAdmin && (
            <TouchableOpacity onPress={() => setEditModalVisible(true)}>
              <Icon name="edit" size={20} color="#22C55E" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.subHeader}>
          {loading ? (
            <LoadingSpinner
              variant="wave"
              color="#80c17f"
              style={{ margin: "auto" }}
            />
          ) : (
            <>
              <View style={styles.iconWrap}>
                <Text style={styles.icon}>
                  {getDeviceIcon(device?.type || "")}
                </Text>
              </View>
              <View>
                <Text style={styles.subHeaderTitle}> {device?.name}</Text>
                <View style={styles.roomInfo}>
                  <View style={styles.dot} />
                  <Text style={styles.roomInfoText}>{device?.roomId.name}</Text>
                </View>
                <Text style={styles.deviceDescription}>
                  {device?.description || "Không có mô tả nào cho thiết bị này."}
                </Text>
                {/* {device?.type !== "motionSensor" &&
                  (isSensor(device?.type || "") ? (
                    <Text style={styles.deviceStatus}>
                      {" "}
                      Ngưỡng cảnh báo: {device?.threshold || 0}{" "}
                      {getUnit(device?.type || "")}
                    </Text>
                  ) : (
                    <Text style={styles.deviceStatus}>
                      {" "}
                      {getAction(
                        device?.type || "",
                        device?.currentAction || "",
                      ).toUpperCase()}
                    </Text>
                  ))} */}
              </View>
            </>
          )}
        </View>

        <View style={styles.switchContainer}>
          <Animated.View
            style={[
              styles.switchSlider,
              { left: sliderLeft, width: `${100 / visibleTabs.length}%` },
            ]}
          />
          <Pressable
            style={styles.switchTab}
            onPress={() => switchTab("settings")}
          >
            <Icon
              name="cog"
              size={15}
              color={active === "settings" ? "#fff" : "#888"}
            />
            <Text
              style={[
                styles.switchLabel,
                active === "settings"
                  ? styles.switchLabelActive
                  : styles.switchLabelInactive,
              ]}
            >
              Cài đặt
            </Text>
          </Pressable>
          <Pressable
            style={styles.switchTab}
            onPress={() => switchTab("history")}
          >
            <Icon
              name="clipboard-list"
              size={15}
              color={active === "history" ? "#fff" : "#888"}
            />
            <Text
              style={[
                styles.switchLabel,
                active === "history"
                  ? styles.switchLabelActive
                  : styles.switchLabelInactive,
              ]}
            >
              Lịch sử
            </Text>
          </Pressable>
          {showAlertTab && (
            <Pressable
              style={styles.switchTab}
              onPress={() => switchTab("alerts")}
            >
              <Icon
                name="exclamation-triangle"
                size={15}
                color={active === "alerts" ? "#fff" : "#888"}
              />
              <Text
                style={[
                  styles.switchLabel,
                  active === "alerts"
                    ? styles.switchLabelActive
                    : styles.switchLabelInactive,
                ]}
              >
                Cảnh báo
              </Text>
            </Pressable>
          )}
        </View>

        {loading && (
          <LoadingSpinner
            variant="wave"
            color="#22C55E"
            style={{ margin: "auto", marginTop: 48 }}
          />
        )}

        {active === "history" && getHistoryComponent(device)}
        {active === "settings" && getSettingsComponent(device)}
        {active === "alerts" && getAlertComponent(device)}

        {active === "settings" && device?.type !== "motionSensor" && (
          <View style={styles.settingsSection}>
            <Text style={styles.settingsTitle}>Cài đặt</Text>
            {!isSensor(device?.type || "") && !isDoorDevice && (
              <View style={styles.settingsOptions}>
                <TouchableOpacity
                  style={[
                    styles.settingsOption,
                    typeSetting === "auto" && styles.settingsOptionActive,
                  ]}
                  onPress={() => setTypeSetting("auto")}
                >
                  <Text style={styles.settingsOptionIcon}>⚡</Text>
                  <Text style={styles.settingOptionText}>Tự động</Text>
                  <Text style={styles.settingOptionDescription}>
                    Theo cảm biến
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.settingsOption,
                    typeSetting === "schedule" && styles.settingsOptionActive,
                  ]}
                  onPress={() => setTypeSetting("schedule")}
                >
                  <Text style={styles.settingsOptionIcon}>🕐</Text>
                  <Text style={styles.settingOptionText}>Lịch hẹn giờ</Text>
                  <Text style={styles.settingOptionDescription}>
                    Tự động theo giờ
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {typeSetting === "auto" && !isDoorDevice && (
              <DeviceAutoComponent device={device as DeviceResponse} />
            )}
            {(typeSetting === "schedule" || isDoorDevice) && (
              <DeviceScheduleComponent device={device as DeviceResponse} />
            )}
          </View>
        )}
      </ScrollView>

      <DeviceEditModal
        visible={editModalVisible}
        device={device || undefined}
        onClose={() => setEditModalVisible(false)}
        onSuccess={async () => {
          try {
            const response = await DeviceService.getDeviceById(
              deviceId as string,
            );
            setDevice(response.data);
          } catch (error) {
            console.error("Error refreshing device details:", error);
          }
        }}
      />
    </SafeAreaView>
  );
};

export default DeviceDetailScreen;
