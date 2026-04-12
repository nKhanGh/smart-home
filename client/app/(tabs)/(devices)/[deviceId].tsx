import DeviceActionLog from "@/components/devices/DeviceActionLog";
import DeviceAutoComponent from "@/components/devices/DeviceAutoComponent";
import DeviceDataLog from "@/components/devices/DeviceDataLog";
import DeviceScheduleComponent from "@/components/devices/DeviceScheduleComponent";
import DoorComponent from "@/components/devices/DoorComponent";
import FanComponent from "@/components/devices/FanComponent";
import LightComponent from "@/components/devices/LightComponent";
import SensorComponent from "@/components/devices/SensorComponent";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useSocket } from "@/contexts/SocketContext";
import { DeviceService } from "@/service/device.service";
import { styles } from "@/styles/(tabs)/(devices)/[deviceId].styles";
import { getAction, getDeviceIcon, getUnit, isSensor } from "@/utils/devices.util";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
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
    default:
      return null;
  }
};

const DeviceDetailScreen = () => {
  const { deviceId } = useLocalSearchParams();

  const [device, setDevice] = useState<DeviceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeSetting, setTypeSetting] = useState<"auto" | "schedule">("auto");

  const [active, setActive] = useState<"settings" | "history">("settings");
  const slideAnim = useRef(new Animated.Value(0)).current;

  const { subscribe } = useSocket();

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

  const switchTab = (tab: "settings" | "history") => {
    if (tab === active) return;
    setActive(tab);
    Animated.spring(slideAnim, {
      toValue: tab === "settings" ? 0 : 1,
      useNativeDriver: false,
      bounciness: 0,
      speed: 14,
    }).start();
  };

  const sliderLeft = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "50%"],
  });

  useEffect(() => {
    setDevice(null);
    setLoading(true);
    const fetchDeviceDetails = async () => {
      try {
        const response = await DeviceService.getDeviceById(deviceId as string);
        console.log("Fetched device details:", response.data);
        setDevice(response.data);
      } catch (error) {
        console.error("Error fetching device details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeviceDetails();
  }, [deviceId]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace("/(tabs)/(rooms)")}>
            <Icon name="angle-left" size={20} color="#000" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>
              {" "}
              {device?.name}
            </Text>
            <Text style={styles.headerSubTitle}>
              {device?.roomId.name}
            </Text>
          </View>
        </View>
        <View style={styles.subHeader}>
          {loading ? <LoadingSpinner variant="wave" color="#80c17f" style={{margin: "auto"}} /> : <>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>{getDeviceIcon(device?.type || "")}</Text>
          </View>
          <View>
            <Text style={styles.subHeaderTitle}>
              {" "}
              {device?.name}
            </Text>
            <View style={styles.roomInfo}>
              <View style={styles.dot}></View>
              <Text style={styles.roomInfoText}>
                {device?.roomId.name}
              </Text>
            </View>
            {isSensor(device?.type || "") ? (
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
                ).toUpperCase() +
                  " - " +
                  device?.mode.toUpperCase()}
              </Text>
            )}
          </View>
          </>}
        </View>
        <View style={styles.switchContainer}>
          {/* Sliding background */}
          <Animated.View style={[styles.switchSlider, { left: sliderLeft }]} />

          {/* Cài đặt */}
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

          {/* Lịch sử */}
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
        </View>
        {loading ? <LoadingSpinner variant="wave" color="#22C55E" style={{margin: "auto", marginTop: 48}} /> : null}
        {active === "history" && getHistoryComponent(device)}
        {active === "settings" && getSettingsComponent(device)}
        {active === "settings" && (
          <View style={styles.settingsSection}>
            <Text style={styles.settingsTitle}>Cài đặt</Text>
            <View style={styles.settingsOptions}>
              <TouchableOpacity 
                style={[styles.settingsOption, typeSetting === "auto" && styles.settingsOptionActive]} 
                onPress={() => setTypeSetting("auto")}
              >
                <Text style={styles.settingsOptionIcon}>⚡</Text>
                <Text style={styles.settingOptionText}>Tự động</Text>
                <Text style={styles.settingOptionDescription}>Theo cảm biến</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.settingsOption, typeSetting === "schedule" && styles.settingsOptionActive]} 
                onPress={() => setTypeSetting("schedule")}
              >
                <Text style={styles.settingsOptionIcon}>🕐</Text>
                <Text style={styles.settingOptionText}>Lịch hẹn giờ</Text>
                <Text style={styles.settingOptionDescription}>Tự động theo giờ</Text>
              </TouchableOpacity>
            </View>
            {typeSetting === "auto" && <DeviceAutoComponent device={device as DeviceResponse} />}
          </View>
        )
        }
      </ScrollView>
    </SafeAreaView>
  );
};

export default DeviceDetailScreen;
