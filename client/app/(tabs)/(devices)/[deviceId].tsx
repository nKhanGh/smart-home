import DeviceActionLog from "@/components/devices/DeviceActionLog";
import DeviceDataLog from "@/components/devices/DeviceDataLog";
import DoorComponent from "@/components/devices/DoorComponent";
import FanComponent from "@/components/devices/FanComponent";
import LightComponent from "@/components/devices/LightComponent";
import SensorComponent from "@/components/devices/SensorComponent";
import { useSocket } from "@/contexts/SocketContext";
import { DeviceService } from "@/service/device.service";
import { styles } from "@/styles/(tabs)/(devices)/[deviceId].styles";
import { getAction, getUnit, isSensor } from "@/utils/devices.util";
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

  const [active, setActive] = useState<"settings" | "history">("settings");
  const slideAnim = useRef(new Animated.Value(0)).current;

  const { subscribe } = useSocket();

  const navigation = useNavigation();

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
    const fetchDeviceDetails = async () => {
      try {
        const response = await DeviceService.getDeviceById(deviceId as string);
        console.log("Fetched device details:", response.data);
        setDevice(response.data);
      } catch (error) {
        console.error("Error fetching device details:", error);
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
              {device?.name || "Tên thiết bị"}
            </Text>
            <Text style={styles.headerSubTitle}>
              {device?.roomId.name || "Mô tả thiết bị"}
            </Text>
          </View>
        </View>
        <View style={styles.subHeader}>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>💡</Text>
          </View>
          <View>
            <Text style={styles.subHeaderTitle}>
              {" "}
              {device?.name || "Tên thiết bị"}
            </Text>
            <View style={styles.roomInfo}>
              <View style={styles.dot}></View>
              <Text style={styles.roomInfoText}>
                {device?.roomId.name || "Mô tả thiết bị"}
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
        {active === "history" && getHistoryComponent(device)}
        {active === "settings" && getSettingsComponent(device)}
      </ScrollView>
    </SafeAreaView>
  );
};

export default DeviceDetailScreen;
