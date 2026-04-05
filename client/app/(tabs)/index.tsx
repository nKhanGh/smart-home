// app/(tabs)/index.tsx
import { DeviceService } from "@/service/device.service";
import { HomeDisplayService } from "@/service/homeDisplay.service";
import { styles } from "@/styles/(tabs)/index.styles";
import React, { useState, useRef, useEffect } from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { io, Socket } from "socket.io-client";
import RoomBadge from "@/components/home/RoomBadge";
import StatusCard from "@/components/home/StatusCard";
import AlertBanner from "@/components/home/AlertBanner";
import SensorCard from "@/components/home/SensorCard";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useRouter } from "expo-router";
import DoorPasswordModal from "@/components/DoorPasswordModal";
import QuickDeviceModal from "@/components/QuickDeviceModal";
import Toast from "react-native-toast-message";
import { useSocket } from "@/contexts/SocketContext";
import { getAction, getNextAction } from "@/utils/devices.util";

const SERVER_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ?? "http://localhost:3000";

type SensorState = {
  roomId: string | null;
  currentData: string | number | null;
  deviceId: string | null;
  roomName: string | null;
};

type Alert = {
  deviceId: string;
  type: string;
  text: string;
  alert: string;
};

export default function HomeScreen() {
  const [devices, setDevices] = useState<DeviceInstantControl[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sensorList, setSensorList] = useState<DeviceResponse[]>([]);
  const [sensorState, setSensorState] = useState<Map<string, SensorState>>(
    new Map([
      [
        "temperatureSensor",
        { roomId: null, currentData: null, deviceId: null, roomName: null },
      ],
      [
        "humiditySensor",
        { roomId: null, currentData: null, deviceId: null, roomName: null },
      ],
      [
        "lightSensor",
        { roomId: null, currentData: null, deviceId: null, roomName: null },
      ],
    ]),
  );
  const [doorModalVisible, setDoorModalVisible] = useState(false);
  const [pendingDoorDevice, setPendingDoorDevice] =
    useState<DeviceInstantControl | null>(null);
  const [pendingAction, setPendingAction] = useState<string | number>("");

  const [quickModalVisible, setQuickModalVisible] = useState(false);

  const router = useRouter();

  const { subscribe } = useSocket();

  const { user } = useAuth();

  useEffect(() => {
    const fetchSensorDevices = async () => {
      try {
        const response = await DeviceService.getSensorDevices();
        setSensorList(response.data);
      } catch (error) {
        console.error("Error fetching sensor devices:", error);
      }
    };

    fetchSensorDevices();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await HomeDisplayService.getHomeDisplayData();
        const data = response.data;
        setSensorState((prev) =>
          new Map(prev)
            .set("temperatureSensor", {
              roomId: data.temp.roomId,
              currentData: data.temp.currentData,
              deviceId: data.temp.deviceId,
              roomName: data.temp.roomName,
            })
            .set("humiditySensor", {
              roomId: data.hum.roomId,
              currentData: data.hum.currentData,
              deviceId: data.hum.deviceId,
              roomName: data.hum.roomName,
            })
            .set("lightSensor", {
              roomId: data.bri.roomId,
              currentData: data.bri.currentData,
              deviceId: data.bri.deviceId,
              roomName: data.bri.roomName,
            }),
        );
        setDevices(data.instantControl);
      } catch (error) {
        console.error("Error fetching home display data:", error);
      } finally {
      }
      setInitialLoading(false);
    };

    fetchData();
  }, []);


  useEffect(() => {

    const handleSensorAlert = (data: any) => {
      setAlerts((prev) => {
        const exists = prev.some((a) => a.deviceId === data.deviceId);
        if (exists) {
          return prev.map((a) => (a.deviceId === data.deviceId ? data : a));
        }
        return [...prev, data];
      });
      Toast.show({
        type: "error",
        text1: data.alert,
        text2: data.text,
      });
    };

    const handleSensorNormal = (data: any) => {
      setAlerts((prev) =>
        prev.filter((alert) => alert.deviceId !== data.deviceId),
      );
      Toast.show({
        type: "info",
        text1: "Cảnh báo đã được giải quyết",
        text2: data.text,
      });
    };

    const handleData = (data: any) => {
      setSensorState((prev) => {
        const state = prev.get(data.type);


        if (!state || state.roomId !== data.roomId) return prev;

        return new Map(prev).set(data.type, {
          roomId: data.roomId,
          currentData: data.value,
          deviceId: data.deviceId,
          roomName: data.roomName,
        });
      });
    };

    const handleDeviceAction = (data: any) => {
      setDevices((prev) =>
        prev.map((d) =>
          d.id === data.deviceId ? { ...d, currentAction: data.value } : d,
        ),
      );
    }

    const unSubData = subscribe("sensor:data", handleData);
    const unSubAlert = subscribe("sensor:alert", handleSensorAlert);
    const unSubNormal = subscribe("sensor:normal", handleSensorNormal);
    const unSubDevice = subscribe("device:action", handleDeviceAction);

    return () => {
      unSubData();
      unSubAlert();
      unSubNormal();
      unSubDevice();
    };
  }, []);

  const handleSelectRoom = async (
    sensorType: string,
    device: DeviceResponse,
  ) => {
    try {
      const response = await DeviceService.getCurrentData(device.id);
      setSensorState((prev) =>
        new Map(prev).set(sensorType, {
          roomId: device.roomId._id,
          currentData: response?.data?.value,
          deviceId: device.id,
          roomName: device.roomId.name,
        }),
      );
      device.type === "temperatureSensor" &&
        HomeDisplayService.updateHomeDisplayData({ tempId: device.id });
      device.type === "humiditySensor" &&
        HomeDisplayService.updateHomeDisplayData({ humId: device.id });
      device.type === "lightSensor" &&
        HomeDisplayService.updateHomeDisplayData({ briId: device.id });
      Toast.show({
        type: "success",
        text1: "Cập nhật cảm biến",
        text2: `Đã chuyển sang ${device.name} - ${device.roomId.name}.`,
      });
    } catch (error) {
      console.error("Error fetching current data:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể lấy dữ liệu cảm biến.",
      });
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "airConditionerDevice":
        return "❄️";
      case "heaterDevice":
        return "🔥";
      case "lightDevice":
        return "💡";
      case "fanDevice":
        return "🌀";
      case "doorDevice":
        return "🚪";
      default:
        return "🔌";
    }
  };

  const handleDevicePress = (
    device: DeviceInstantControl,
    currentAction: string | number,
  ) => {
    if (device.type === "doorDevice") {
      setPendingDoorDevice(device);
      setPendingAction(currentAction);
      setDoorModalVisible(true);
    } else {
      toggleDevice(device.id, currentAction);
    }
  };

  const toggleDevice = async (
    deviceId: string,
    currentAction: string | number,
    password?: string,
  ) => {
    try {
      const newAction = getNextAction(devices.find(d => d.id === deviceId)?.type || "", currentAction);
      await DeviceService.sendCommand(
        deviceId,
        newAction,
        password ?? undefined,
      );
      setDevices((prev) =>
        prev.map((d) =>
          d.id === deviceId ? { ...d, currentAction: newAction } : d,
        ),
      );
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: `Đã ${newAction === "1" ? "bật" : "tắt"} thiết bị.`,
      });
    } catch (error) {
      console.error("Error toggling device:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể điều khiển thiết bị.",
      });
    }
  };

  const updateQuickDevices = async (deviceIds: string[]) => {
    try {
      await HomeDisplayService.updateHomeDisplayData({
        instantControl: deviceIds,
      });
      setDevices((prev) => prev.filter((d) => deviceIds.includes(d.id)));
      if (deviceIds.length > devices.length) {
        deviceIds.forEach(async (id) => {
          if (!devices.some((d) => d.id === id)) {
            try {
              const response = await DeviceService.getDeviceById(id);
              const data = response.data;
              const newDevice: DeviceInstantControl = {
                id,
                name: data.name,
                roomName: data.roomId.name,
                roomId: data.roomId._id,
                type: data.type,
                currentAction: data.currentAction || "0",
              };
              setDevices((prev) => [...prev, newDevice]);
            } catch (error) {
              console.error("Error fetching device by ID:", error);
            }
          }
        });
      }
      Toast.show({
        type: "success",
        text1: "Cập nhật thiết bị nhanh",
        text2: "Đã cập nhật danh sách thiết bị nhanh.",
      });
    } catch (error) {
      console.error("Error updating quick devices:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể cập nhật thiết bị nhanh.",
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Xin chào,{" "}
              {user?.fullName.split(" ")[
                user?.fullName?.split(" ").length - 1
              ] || "Khang"}{" "}
              👋
            </Text>
            <Text style={styles.date}>
              {new Date().toLocaleTimeString()} -{" "}
              {new Date().toLocaleDateString()}
            </Text>
          </View>
          <View
            style={[
              styles.avatar,
              { backgroundColor: user?.avatarColor || "#22C55E" },
            ]}
          >
            <Text style={styles.avatarText}>{user?.avatarInitials}</Text>
          </View>
        </View>

        {/* ── Alert Banner ── */}
        {alerts.map((alert) => (
          <AlertBanner
            key={alert.deviceId}
            alert={alert.alert}
            text={alert.text}
            type={alert.type}
          />
        ))}

        {/* ── Sensor Row ── */}
        <View style={styles.sensorRow}>
          <SensorCard
            emoji="🌡️"
            label="NHIỆT ĐỘ"
            value={sensorState.get("temperatureSensor")?.currentData || "0"}
            unit="°C"
            accentColor="#F97316"
            roomName={
              sensorState.get("temperatureSensor")?.roomName || "Phòng khách"
            }
            device={sensorList.filter((d) => d.type === "temperatureSensor")}
            onSelect={(device: DeviceResponse) =>
              handleSelectRoom("temperatureSensor", device)
            }
            isLoading={initialLoading}
          />
          <SensorCard
            emoji="💧"
            label="ĐỘ ẨM"
            value={sensorState.get("humiditySensor")?.currentData || "0"}
            unit="%"
            accentColor="#3B82F6"
            roomName={
              sensorState.get("humiditySensor")?.roomName || "Phòng khách"
            }
            device={sensorList.filter((d) => d.type === "humiditySensor")}
            onSelect={(device: DeviceResponse) =>
              handleSelectRoom("humiditySensor", device)
            }
            isLoading={initialLoading}
          />
        </View>

        {/* ── Light Card ── */}
        <View style={styles.lightCard}>
          <View style={[styles.sensorAccent, { backgroundColor: "#F59E0B" }]} />
          <View style={styles.lightCardTop}>
            <Text style={styles.lightEmoji}>☀️</Text>
            <Text style={styles.lightTitle}>ÁNH SÁNG</Text>
            <RoomBadge
              roomName={
                sensorState.get("lightSensor")?.roomName || "Phòng khách"
              }
              device={sensorList.filter((d) => d.type === "lightSensor")}
              onSelect={(device: DeviceResponse) =>
                handleSelectRoom("lightSensor", device)
              }
            />
          </View>
          {initialLoading ? (
            <LoadingSpinner size={48} color="#22C55E" variant="wave" />
          ) : (
            <View style={styles.lightCardBottom}>
              <View style={styles.sensorValueRow}>
                <Text style={styles.sensorValue}>
                  {sensorState.get("lightSensor")?.currentData || "0"}
                </Text>
                <Text style={styles.sensorUnit}>lux</Text>
              </View>
              {StatusCard({
                value: sensorState.get("lightSensor")?.currentData || "0",
                type: "lightSensor",
              })}
            </View>
          )}
        </View>

        {/* ── Quick Devices ── */}
        <View style={styles.devicesCard}>
          <View style={styles.devicesHeader}>
            <Text style={styles.devicesTitle}>Thiết bị nhanh</Text>
            <TouchableOpacity>
              <Text
                style={styles.viewAll}
                onPress={() => router.push("/(tabs)/(rooms)")}
              >
                Xem tất cả →
              </Text>
            </TouchableOpacity>
          </View>
          {initialLoading ? (
            <LoadingSpinner size={48} color="#22C55E" variant="wave" />
          ) : (
            <View style={styles.devicesGrid}>
              {devices.map((device) => (
                <TouchableOpacity
                  key={device.id}
                  style={[
                    styles.deviceItem,
                    (device.currentAction !== "0") && styles.deviceItemOn,
                  ]}
                  onPress={() =>
                    handleDevicePress(device, device.currentAction)
                  }
                >
                  <Text style={styles.deviceIcon}>
                    {getDeviceIcon(device.type)}
                  </Text>
                  <Text style={styles.deviceName}>
                    {device.name} - {device.roomName}
                  </Text>
                  <Text
                    style={[
                      styles.deviceStatus,
                      (device.currentAction !== "0")
                        ? styles.deviceStatusOn
                        : null,
                    ]}
                  >
                    {getAction(device.type, device.currentAction)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={styles.updateButton}>
            <Text
              style={styles.updateButtonText}
              onPress={() => setQuickModalVisible(true)}
            >
              Đổi thiết bị nhanh
            </Text>
          </View>
        </View>
      </ScrollView>
      <DoorPasswordModal
        doAction={toggleDevice}
        doorModalVisible={doorModalVisible}
        pendingAction={pendingAction}
        pendingDoorDevice={pendingDoorDevice}
        setDoorModalVisible={setDoorModalVisible}
      />
      {quickModalVisible &&
        <QuickDeviceModal
          visible={quickModalVisible}
          setVisible={setQuickModalVisible}
          selectedDevices={devices}
          onConfirm={updateQuickDevices}
        />
      }
    </SafeAreaView>
  );
}
