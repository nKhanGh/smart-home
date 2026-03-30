// app/(tabs)/index.tsx
import { DeviceService } from "@/service/device.service";
import { HomeDisplayService } from "@/service/homeDisplay.service";
import { styles } from "@/styles/(tabs)/index.styles";
import React, { useState, useRef, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Animated,
  TextInput,
  Pressable,
  StyleSheet,
} from "react-native";
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

export default function HomeScreen() {
  const [devices, setDevices] = useState<DeviceInstantControl[]>([]);
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

  const [doorModalVisible, setDoorModalVisible] = useState(false);
  const [pendingDoorDevice, setPendingDoorDevice] =
    useState<DeviceInstantControl | null>(null);
  const [pendingAction, setPendingAction] = useState<string | number>("");
  const [pinDigits, setPinDigits] = useState(["", "", "", "", "", ""]);
  const [pinError, setPinError] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;

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
        setDevices(data.instantControl);
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

  const handleSelectRoom = async (
    sensorType: string,
    device: DeviceResponse,
  ) => {
    try {
      const response = await DeviceService.getCurrentData(device._id);
      console.log("Current data for device", device._id, ":", response.data);
      setSensorState((prev) =>
        new Map(prev).set(sensorType, {
          roomId: device.roomId._id,
          currentData: response?.data?.value,
          deviceId: device._id,
          roomName: device.roomId.name,
        }),
      );
      device.type === "temperatureSensor" &&
        HomeDisplayService.updateHomeDisplayData({ tempId: device._id });
      device.type === "humiditySensor" &&
        HomeDisplayService.updateHomeDisplayData({ humId: device._id });
      device.type === "lightSensor" &&
        HomeDisplayService.updateHomeDisplayData({ briId: device._id });
    } catch (error) {
      console.error("Error fetching current data:", error);
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
    console.log("Device pressed:", device);
    if (device.type === "doorDevice") {
      setPendingDoorDevice(device);
      setPendingAction(currentAction);
      setPinDigits(["", "", "", "", "", ""]);
      setPinError("");
      setDoorModalVisible(true);
    } else {
      toggleDevice(device, currentAction);
    }
  };

  const toggleDevice = async (
    device: DeviceInstantControl,
    currentAction: string | number,
    password?: string,
  ) => {
    try {
      const newAction = currentAction === "1" ? "0" : "1";
      await DeviceService.sendCommand(
        device.id,
        newAction,
        password ?? undefined,
      );
      setDevices((prev) =>
        prev.map((d) =>
          d.id === device.id ? { ...d, currentAction: newAction } : d,
        ),
      );
    } catch (error) {
      console.error("Error toggling device:", error);
    }
  };

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePinChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...pinDigits];
    next[index] = value.slice(-1);
    setPinDigits(next);
    setPinError("");
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !pinDigits[index] && index > 0) {
      const next = [...pinDigits];
      next[index - 1] = "";
      setPinDigits(next);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleConfirmPin = async () => {
    const pin = pinDigits.join("");
    if (pin.length < 6) {
      setPinError("Vui lòng nhập đủ 6 ký tự.");
      triggerShake();
      return;
    }
    setPinLoading(true);
    try {
      await toggleDevice(pendingDoorDevice!, pendingAction, pin);
      setDoorModalVisible(false);
    } catch {
      setPinError("Mật khẩu không đúng. Thử lại.");
      triggerShake();
      setPinDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setPinLoading(false);
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
            device={sensorList.filter((d) => d.type === "temperatureSensor")}
            onSelect={(device: DeviceResponse) =>
              handleSelectRoom("temperatureSensor", device)
            }
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
              roomName={
                sensorState.get("lightSensor")?.roomName || "Phòng khách"
              }
              device={sensorList.filter((d) => d.type === "lightSensor")}
              onSelect={(device: DeviceResponse) =>
                handleSelectRoom("lightSensor", device)
              }
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
                style={[
                  styles.deviceItem,
                  device.currentAction === "1" && styles.deviceItemOn,
                ]}
                onPress={() => handleDevicePress(device, device.currentAction)} // ← đổi ở đây
              >
                <Text style={styles.deviceIcon}>
                  {getDeviceIcon(device.type)}
                </Text>
                <Text style={styles.deviceName}>{device.name}</Text>
                <Text
                  style={[
                    styles.deviceStatus,
                    device.currentAction === "1" ? styles.deviceStatusOn : null,
                  ]}
                >
                  {device.currentAction === "1" ? "BẬT" : "Tắt"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
      <Modal
        transparent
        visible={doorModalVisible}
        animationType="fade"
        onRequestClose={() => setDoorModalVisible(false)}
      >
        <Pressable
          style={modalStyles.backdrop}
          onPress={() => setDoorModalVisible(false)}
        >
          <Pressable
            style={modalStyles.sheet}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Icon cửa */}
            <View style={modalStyles.iconWrap}>
              <Text style={modalStyles.iconText}>🔐</Text>
            </View>

            <Text style={modalStyles.title}>Xác nhận mật khẩu</Text>
            <Text style={modalStyles.subtitle}>
              {pendingDoorDevice?.name ?? "Khóa cửa"} —{" "}
              {pendingAction === "1" ? "Tắt thiết bị" : "Bật thiết bị"}
            </Text>

            {/* 6 ô nhập */}
            <Animated.View
              style={[
                modalStyles.pinRow,
                { transform: [{ translateX: shakeAnim }] },
              ]}
            >
              {pinDigits.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => {
                    inputRefs.current[i] = ref;
                  }}
                  style={[
                    modalStyles.pinBox,
                    digit ? modalStyles.pinBoxFilled : null,
                  ]}
                  value={digit ? "●" : ""}
                  onChangeText={(v) => handlePinChange(v, i)}
                  onKeyPress={(e) => handlePinKeyPress(e, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  caretHidden
                />
              ))}
            </Animated.View>

            {/* Thông báo lỗi */}
            {!!pinError && (
              <Text style={modalStyles.errorText}>{pinError}</Text>
            )}

            {/* Nút xác nhận */}
            <TouchableOpacity
              style={[
                modalStyles.confirmBtn,
                pinDigits.join("").length === 6 && modalStyles.confirmBtnActive,
                pinLoading && modalStyles.confirmBtnLoading,
              ]}
              onPress={handleConfirmPin}
              disabled={pinLoading}
              activeOpacity={0.8}
            >
              <Text style={modalStyles.confirmBtnText}>
                {pinLoading ? "Đang gửi..." : "Xác nhận"}
              </Text>
            </TouchableOpacity>

            {/* Nút huỷ */}
            <TouchableOpacity
              onPress={() => setDoorModalVisible(false)}
              style={modalStyles.cancelBtn}
            >
              <Text style={modalStyles.cancelText}>Huỷ bỏ</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 0,
  },
  sheet: {
    width: "100%",
    backgroundColor: "#F0FAF2",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 40,
    alignItems: "center",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,

    elevation: 24,
  },

  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#BBF7D0",
    marginBottom: 20,
  },

  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#DCFCE7",
    borderWidth: 2,
    borderColor: "#86EFAC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  iconText: { fontSize: 32 },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#14532D",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: "#4ADE80",
    marginBottom: 32,
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: 0.1,
  },

  pinRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  pinBox: {
    width: 46,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#86EFAC",
    backgroundColor: "#FFFFFF",
    color: "#15803D",
    fontSize: 22,
    textAlign: "center",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  pinBoxFilled: {
    borderColor: "#16A34A",
    backgroundColor: "#DCFCE7",
    shadowColor: "#22C55E",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },

  errorText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 12,
    letterSpacing: 0.1,
  },

  confirmBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#BBF7D0",
    alignItems: "center",
    marginTop: 4,
  },
  confirmBtnActive: {
    backgroundColor: "#22C55E",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmBtnLoading: {
    opacity: 0.65,
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  cancelBtn: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  cancelText: {
    color: "#86EFAC",
    fontSize: 14,
    fontWeight: "500",
  },
});
