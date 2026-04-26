// app/(tabs)/rooms.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import DoorPasswordModal from "@/components/modals/DoorPasswordModal";
import RoomUpdateModal from "@/components/modals/RoomUpdateModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { DeviceService } from "@/service/device.service";
import { RoomService } from "@/service/room.service";
import { styles } from "@/styles/(tabs)/(rooms)/index.styles";
import { getAction, getDeviceIcon, getNextAction } from "@/utils/devices.util";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/FontAwesome6";

const images: Record<string, any> = {
  "living-room.png": require("@/assets/images/living-room.png"),
  "bedroom.png": require("@/assets/images/bedroom.png"),
  "living-room1.png": require("@/assets/images/living-room1.png"),
  "living-room2.png": require("@/assets/images/living-room2.png"),
  "bedroom1.png": require("@/assets/images/bedroom1.png"),
  "bedroom2.png": require("@/assets/images/bedroom2.png"),
  // "kitchen.png": require("@/assets/images/kitchen.png"),
};

const getUnit = (type: DeviceResponse["type"]) => {
  switch (type) {
    case "temperatureSensor":
      return "°C";
    case "humiditySensor":
      return "%";
    case "lightSensor":
      return "lux";
    default:
      return "";
  }
};

const getIconBg = (type: DeviceResponse["type"]) => {
  switch (type) {
    case "lightDevice":
      return "#FEF9C3";
    case "fanDevice":
      return "#E0F2FE";
    case "temperatureSensor":
      return "#FFE4E6";
    case "humiditySensor":
      return "#EDE9FE";
    case "lightSensor":
      return "#FDE68A";
    case "airConditionerDevice":
      return "#DBEAFE";
    case "doorDevice":
      return "#e5ffe7";
    case "motionSensor":
      return "#FECACA";
    default:
      return "#F3F4F6";
  }
};

const isSensor = (type: DeviceResponse["type"]) => type.endsWith("Sensor");

const countByType = (devices: DeviceResponse[]) => ({
  door: devices.filter((d) => d.type === "doorDevice").length,
  light: devices.filter((d) => d.type === "lightDevice").length,
  fan: devices.filter((d) => d.type === "fanDevice").length,
  sensor: devices.filter((d) => isSensor(d.type)).length,
});

const sensorStyles: Record<string, any> = {
  temperatureSensor: styles.tempSensor,
  humiditySensor: styles.humiditySensor,
  lightSensor: styles.lightSensor,
  motionSensor: styles.motionSensor,
};

const sensorTextColor: Record<string, any> = {
  temperatureSensor: "#833a23",
  humiditySensor: "#1E40AF",
  lightSensor: "#92730e",
  motionSensor: "#991B1B",
};

const updateDeviceActionInRooms = (
  prevRooms: RoomResponse[],
  deviceId: string,
  action: string | number,
): RoomResponse[] =>
  prevRooms.map((room) => ({
    ...room,
    devices: room.devices.map((device) =>
      device.id === deviceId ? { ...device, currentAction: action } : device,
    ),
  }));

const updateDeviceDataInRooms = (
  prevRooms: RoomResponse[],
  deviceId: string,
  value: string | number,
): RoomResponse[] =>
  prevRooms.map((room) => ({
    ...room,
    devices: room.devices.map((device) =>
      device.id === deviceId ? { ...device, currentData: value } : device,
    ),
  }));

const DeviceRow = ({
  device,
  onClickDevice,
}: {
  device: DeviceResponse;
  onClickDevice: (
    device: DeviceResponse,
    currentAction: string | number,
  ) => void;
}) => {
  const sensor = isSensor(device.type);
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.deviceRow}
      onPress={() => router.push(`/(devices)/${device.id}`)}
    >
      {/* Icon */}
      <View
        style={[
          styles.deviceIconWrap,
          { backgroundColor: getIconBg(device.type) },
        ]}
      >
        <Text style={styles.deviceIconText}>{getDeviceIcon(device.type)}</Text>
      </View>

      {/* Info */}
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{device.name}</Text>
        <View style={styles.deviceMeta}>
          <Text
            style={[
              styles.deviceStatus,
              device.currentAction ? styles.statusOn : styles.statusOff,
            ]}
          >
            {sensor ? "" : getAction(device.type, device.currentAction ?? "0")}
            {sensor && device.type !== "motionSensor" &&
              `Ngưỡng cảnh báo: ${device.threshold + getUnit(device.type)}`}
          </Text>
          {/* {!sensor && (
            <View
              style={[
                styles.modeBadge,
                device.mode === "AUTO" ? styles.badgeAuto : styles.badgeManual,
              ]}
            >
              <Text
                style={[
                  styles.modeText,
                  device.mode === "AUTO"
                    ? styles.modeTextAuto
                    : styles.modeTextManual,
                ]}
              >
                {!sensor && device.mode}
              </Text>
            </View>
          )} */}
        </View>
      </View>

      {device.type !== "motionSensor" &&(sensor ? (
        <View style={[styles.sensorValue, sensorStyles[device.type]]}>
          <Text
            style={[
              styles.sensorValueText,
              { color: sensorTextColor[device.type] },
            ]}
          >
            {device.currentData} {getUnit(device.type)}
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onClickDevice(device, device.currentAction ?? "0")}
        >
          <Switch
            value={device.currentAction != "0"}
            onValueChange={() =>
              onClickDevice(device, device.currentAction ?? "0")
            }
            trackColor={{ false: "#D1D5DB", true: "#86EFAC" }}
            thumbColor={
              device.currentAction === "0" || device.currentAction === 0
                ? "#F9FAFB"
                : "#22C55E"
            }
            ios_backgroundColor="#D1D5DB"
          />
        </TouchableOpacity>
      ))}
    </TouchableOpacity>
  );
};

const RoomCard = ({
  room,
  onClickDevice,
  onEditRoom,
}: {
  room: RoomResponse;
  onClickDevice: (
    device: DeviceResponse,
    currentAction: string | number,
  ) => void;
  onEditRoom: (roomId: string) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  const animHeight = useRef(new Animated.Value(0)).current;
  const counts = countByType(room.devices);

  useEffect(() => {
    Animated.spring(animHeight, {
      toValue: expanded ? contentHeight : 0,
      useNativeDriver: false,
      bounciness: 0,
      speed: 14,
    }).start();
  }, [expanded, contentHeight]);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.imageWrap}>
          {room.backgroundName ? (
            <Image
              source={images[room.backgroundName]}
              style={styles.roomImage}
            />
          ) : (
            <View style={[styles.roomImage, styles.imagePlaceholder]} />
          )}
          <View style={styles.imageOverlay} />
          <View style={styles.imageLabel}>
            <Text style={styles.roomName}>{room.name}</Text>
            <Text style={styles.roomCount}>{room.devices.length} thiết bị</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.statsRow}>
        {[
          {
            icon: <Icon name="lightbulb" size={24} color="#000" />,
            count: counts.light,
          },
          {
            icon: <Icon name="fan" size={24} color="#000" />,
            count: counts.fan,
          },
          {
            icon: <Icon name="door-closed" size={24} color="#000" />,
            count: counts.door,
          },
          {
            icon: <Icon name="thermometer" size={24} color="#000" />,
            count: counts.sensor,
          },
        ].map((item, i) => (
          <View key={i} style={styles.statItem}>
            <Text style={styles.statIcon}>{item.icon}</Text>
            <Text style={styles.statCount}>{item.count}</Text>
          </View>
        ))}
        <TouchableOpacity
          style={styles.expandBtn}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={styles.expandIcon}>
            {expanded ? (
              <Icon name="angle-up" size={18} color="#000" />
            ) : (
              <Icon name="angle-down" size={18} color="#000" />
            )}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Danh sách thiết bị (collapsible) ── */}
      {(room.devices.length > 0 || expanded) && (
        <Animated.View style={{ height: animHeight, overflow: "hidden" }}>
          {/* đo chiều cao thật khi render lần đầu */}
          <View
            onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}
            style={styles.deviceList}
          >
            <View style={styles.divider} />
            {room.devices.map((device, idx) => (
              <View key={device.id}>
                <DeviceRow device={device} onClickDevice={onClickDevice} />
                {idx < room.devices.length - 1 && (
                  <View style={styles.deviceDivider} />
                )}
              </View>
            ))}
            {expanded && (
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => onEditRoom(room.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.editBtnText}>
                  CHỈNH SỬA THÔNG TIN PHÒNG
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}

      {/* ── Nút chỉnh sửa ── */}
    </View>
  );
};

// Main Screen

const RoomsScreen = () => {
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const { subscribe } = useSocket();

  const [doorModalVisible, setDoorModalVisible] = useState(false);
  const [pendingDoorDevice, setPendingDoorDevice] =
    useState<DeviceResponse | null>(null);
  const [pendingAction, setPendingAction] = useState<string | number>("");

  const [roomUpdateModalVisible, setRoomUpdateModalVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomResponse | null>(null);

  const handleDevicePress = (
    device: DeviceResponse,
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
      const device = rooms
        .flatMap((r) => r.devices)
        .find((d) => d.id === deviceId);
      if (!device) {
        console.error("Device not found");
        return;
      }

      const newAction = getNextAction(device.type, currentAction);
      await DeviceService.sendCommand(
        device.id,
        newAction,
        password ?? undefined,
      );
      setRooms((prev) => updateDeviceActionInRooms(prev, device.id, newAction));
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

  useEffect(() => {
    const handleData = (data: any) => {
      setRooms((prev) =>
        updateDeviceDataInRooms(prev, data.deviceId, data.value),
      );
    };

    const handleAction = (data: any) => {
      setRooms((prev) =>
        updateDeviceActionInRooms(prev, data.deviceId, data.value),
      );
    };

    const unSubData = subscribe("sensor:data", handleData);
    const unSubAction = subscribe("device:action", handleAction);

    return () => {
      unSubData();
      unSubAction();
    };
  }, []);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await RoomService.getRooms();
        console.log("Fetched rooms:", response.data);
        setRooms(
          response.data.map((r) => {
            r.devices = r.devices.filter(
              (d) => d.type.endsWith("Device") || d.type.endsWith("Sensor"),
            );
            return r;
          }),
        );
      } catch (error) {
        console.error("Failed to fetch rooms:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const handleEditRoom = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
      setEditingRoom(room);
      setRoomUpdateModalVisible(true);
    } else {
      console.error("Room not found for editing:", roomId);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Các phòng</Text>
            <Text style={styles.headerSub}>Quản lý thiết bị theo phòng</Text>
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
        {loading ? (
          <View style={{ marginTop: 40 }}>
            <LoadingSpinner variant="wave" color="#22C55E" />
          </View>
        ) : null}

        {/* Room cards */}
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            onClickDevice={handleDevicePress}
            onEditRoom={handleEditRoom}
          />
        ))}
      </ScrollView>
      <DoorPasswordModal
        doAction={toggleDevice}
        doorModalVisible={doorModalVisible}
        pendingAction={pendingAction}
        pendingDoorDevice={pendingDoorDevice}
        setDoorModalVisible={setDoorModalVisible}
      />

      <RoomUpdateModal
        onUpdate={(roomId, name, backgroundName) => {
          setRooms((prev) =>
            prev.map((r) =>
              r.id === roomId ? { ...r, name, backgroundName } : r,
            ),
          );
        }}
        room={editingRoom as RoomResponse}
        setVisible={setRoomUpdateModalVisible}
        visible={roomUpdateModalVisible}
      />
    </SafeAreaView>
  );
};

export default RoomsScreen;
