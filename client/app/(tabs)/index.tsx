// app/(tabs)/index.tsx
import { DeviceService } from "@/service/device.service";
import { HomeDisplayService } from "@/service/homeDisplay.service";
import { styles } from "@/styles/(tabs)/index.styles";
import React, { useState, useRef, useEffect } from "react";
import { ScrollView, View, Text, TouchableOpacity, Modal, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { io, Socket } from "socket.io-client";
import RoomBadge from "@/components/home/RoomBadge";
import StatusCard from "@/components/home/StatusCard";
import AlertBanner from "@/components/home/AlertBanner";
import SensorCard from "@/components/home/SensorCard";

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

// Types
type Device = {
  id: string;
  name: string;
  icon: string;
  on: boolean;
};

// ── Mock data ────────────────────────────────────
const DEVICES: Device[] = [
  { id: "1", name: "Đèn phòng khách", icon: "💡", on: true },
  { id: "2", name: "Quạt phòng khách", icon: "🌀", on: false },
  { id: "3", name: "Đèn nhà bếp", icon: "💡", on: false },
  { id: "4", name: "Đèn phòng ngủ bố", icon: "💡", on: false },
];

export default function HomeScreen() {
  const [devices, setDevices] = useState<Device[]>(DEVICES);
  const [alerts, setAlerts] = useState<Alert[]>([]);
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
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const fetchSensorDevices = async () => {
      try {
        const response = await DeviceService.getSensorDevices();
        setSensorList(response.data);
        console.log("Sensor devices:", response.data);
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
        console.log("Home display data:", response.data);
      } catch (error) {
        console.error("Error fetching home display data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    socketRef.current = io(SERVER_URL, { transports: ["websocket"] });
    console.log("Connecting to socket server at:", SERVER_URL);

    const handleSensorAlert = (data: any) => {
      setAlerts((prev) => {
        const exists = prev.some((a) => a.deviceId === data.deviceId);
        if (exists) {
          return prev.map((a) => (a.deviceId === data.deviceId ? data : a));
        }
        return [...prev, data];
      });
    };

    const handleSensorNormal = (data: any) => {
      console.log("Received sensor normal:", data);
      setAlerts((prev) =>
        prev.filter((alert) => alert.deviceId !== data.deviceId),
      );
    };

    const handleData = (data: any) => {
      console.log("Received sensor data:", data);
      const state = sensorState.get(data.type) || {
        roomId: null,
        currentData: null,
        deviceId: null,
        roomName: null,
      };
      console.log("[Socket] Nhận data:", data);
      console.log("[Socket] State hiện tại:", state);
      console.log("[Socket] roomId match:", state?.roomId, "===", data.roomId);
      if (state.roomId !== data.roomId) return;
      setSensorState((prev) =>
        new Map(prev).set(data.type, {
          roomId: data.roomId,
          currentData: data.value,
          deviceId: data.deviceId,
          roomName: data.roomName,
        }),
      );
    };

    socketRef.current.on("sensor:data", handleData);
    socketRef.current.on("sensor:alert", handleSensorAlert);
    socketRef.current.on("sensor:normal", handleSensorNormal);

    return () => {
      socketRef.current?.off("sensor:alert", handleSensorAlert);
      socketRef.current?.off("sensor:normal", handleSensorNormal);
      socketRef.current?.off("sensor:data", handleData);
      socketRef.current?.disconnect();
    };
  }, []);

  const toggleDevice = (id: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, on: !d.on } : d)),
    );
  };

  const handleSelectRoom = async (sensorType: string, device: DeviceResponse) => {
    try {
      const response = await DeviceService.getCurrentData(device._id);
      console.log("Current data for device", device._id, ":", response.data);
      setSensorState((prev) =>
        new Map(prev).set(sensorType, { roomId: device.roomId._id, currentData: response?.data?.value, deviceId: device._id, roomName: device.roomId.name })
      );
      device.type === "temperatureSensor" && HomeDisplayService.updateHomeDisplayData({ tempId: device._id});
      device.type === "humiditySensor" && HomeDisplayService.updateHomeDisplayData({ humId: device._id});
      device.type === "lightSensor" && HomeDisplayService.updateHomeDisplayData({ briId: device._id});
      } catch (error) {
        console.error("Error fetching current data:", error);
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
            <Text style={styles.greeting}>Xin chào, Khang 👋</Text>
            <Text style={styles.date}>
              {new Date().toLocaleTimeString()} -{" "}
              {new Date().toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>HK</Text>
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
            device={sensorList.filter(d => d.type === "temperatureSensor")}
            onSelect={(device: DeviceResponse) => handleSelectRoom("temperatureSensor", device)}
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
            device={sensorList.filter(d => d.type === "humiditySensor")}
            onSelect={(device: DeviceResponse) => handleSelectRoom("humiditySensor", device)}
          />
        </View>

        {/* ── Light Card ── */}
        <View style={styles.lightCard}>
          <View style={[styles.sensorAccent, { backgroundColor: "#F59E0B" }]} />
          <View style={styles.lightCardTop}>
            <Text style={styles.lightEmoji}>☀️</Text>
            <Text style={styles.lightTitle}>ÁNH SÁNG</Text>
            {/* <View style={styles.roomBadge}>
              <View style={styles.dot} />
              <Text style={styles.roomBadgeText}>
                {sensorState.get("lightSensor")?.roomName || "Phòng khách"}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </View> */}
            <RoomBadge
              roomName={sensorState.get("lightSensor")?.roomName || "Phòng khách"} device={sensorList.filter(d => d.type === "lightSensor")}
              onSelect={(device: DeviceResponse) => handleSelectRoom("lightSensor", device)}
            />
          </View>
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
        </View>

        {/* ── Quick Devices ── */}
        <View style={styles.devicesCard}>
          <View style={styles.devicesHeader}>
            <Text style={styles.devicesTitle}>Thiết bị nhanh</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>Xem tất cả →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.devicesGrid}>
            {devices.map((device) => (
              <TouchableOpacity
                key={device.id}
                style={[styles.deviceItem, device.on && styles.deviceItemOn]}
                onPress={() => toggleDevice(device.id)}
              >
                <Text style={styles.deviceIcon}>{device.icon}</Text>
                <Text style={styles.deviceName}>{device.name}</Text>
                <Text
                  style={[
                    styles.deviceStatus,
                    device.on && styles.deviceStatusOn,
                  ]}
                >
                  {device.on ? "BẬT" : "Tắt"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
