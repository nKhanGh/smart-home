// app/(tabs)/rooms.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
} from "react-native";

import { styles } from "@/styles/(tabs)/(rooms)/index.styles";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/FontAwesome6";
import { RoomService } from "@/service/room.service";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";

// ── Types ──────────────────────────────────────────────────────────

const images: Record<string, any> = {
  "living-room.png": require("@/assets/images/living-room.png"),
  "bedroom.png": require("@/assets/images/bedroom.png"),
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

// ── Helpers ────────────────────────────────────────────────────────

const getDeviceIcon = (type: DeviceResponse["type"]) => {
  switch (type) {
    case "lightDevice":
      return "💡";
    case "fanDevice":
      return "🌀";
    case "temperatureSensor":
      return "🌡️";
    case "humiditySensor":
      return "💧";
    case "airConditionerDevice":
      return "❄️";
    case "lightSensor":
      return "🔆";
    case "doorDevice":
      return "🚪";
    default:
      return "🔌";
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

const getAction = (device: DeviceResponse) => {
  if (device.type === "doorDevice") {
    return device.currentAction === "0" || device.currentAction === 0 ? "Đang đóng" : "Đang mở";
  } else if (device.type.endsWith("Device")) {
    return device.currentAction === "0" || device.currentAction === 0 ? "Đang tắt" : "Đang bật";
  }
};

const DeviceRow = ({
  device,
  onToggle,
}: {
  device: DeviceResponse;
  onToggle: (id: string) => void;
}) => {
  const sensor = isSensor(device.type);

  return (
    <View style={styles.deviceRow}>
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
            {sensor ? "" : getAction(device)}
            {sensor && `Ngưỡng cảnh báo: ${device.threshold + getUnit(device.type)}`}
          </Text>
          {!sensor &&
          
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
          }
        </View>
      </View>

      {sensor ? (
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
        <Switch
          value={device.currentAction != "0"}
          onValueChange={() => onToggle(device._id)}
          trackColor={{ false: "#D1D5DB", true: "#86EFAC" }}
          thumbColor={device.currentAction === "0" || device.currentAction === 0 ? "#F9FAFB" : "#22C55E"}
          ios_backgroundColor="#D1D5DB"
        />
      )}
    </View>
  );
};

const RoomCard = ({
  room,
  onToggleDevice,
  onEditRoom,
}: {
  room: RoomResponse;
  onToggleDevice: (roomId: string, deviceId: string) => void;
  onEditRoom: (roomId: string) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const counts = countByType(room.devices);

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
      {expanded && room.devices.length > 0 && (
        <View style={styles.deviceList}>
          <View style={styles.divider} />
          {room.devices.map((device, idx) => (
            <View key={device._id}>
              <DeviceRow
                device={device}
                onToggle={(id) => onToggleDevice(room._id, id)}
              />
              {idx < room.devices.length - 1 && (
                <View style={styles.deviceDivider} />
              )}
            </View>
          ))}
        </View>
      )}

      {/* ── Nút chỉnh sửa ── */}
      {expanded && (
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => onEditRoom(room._id)}
          activeOpacity={0.7}
        >
          <Text style={styles.editBtnText}>CHỈNH SỬA THÔNG TIN PHÒNG</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Main Screen

const RoomsScreen = () => {
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const { user } = useAuth();

  const { subscribe } = useSocket();

  useEffect(() => {
    const handleData = (data: any) => {
      setRooms((prev) =>
        prev.map((room) => ({
          ...room,
          devices: room.devices.map((d) =>
            d._id === data.deviceId ? { ...d, currentData: data.value } : d,
          ),
        })),
      );
    };

    const handleAction = (data: any) => {
      console.log(data);
      setRooms((prev) =>
        prev.map((room) => ({
          ...room,
          devices: room.devices.map((d) =>
            d._id === data.deviceId ? { ...d, currentAction: data.value } : d,
          ),
        })),
      );
    };

    const unSubData = subscribe("sensor:data", handleData);
    const unSubAction = subscribe("device:action", handleAction);

    return () => {
      unSubData();
      unSubAction();
    };
  },[]);

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
      }
    };
    fetchRooms();
  }, []);

  const handleToggleDevice = (roomId: string, deviceId: string) => {
    setRooms((prev) =>
      prev.map((room) =>
        room._id !== roomId
          ? room
          : {
              ...room,
              devices: room.devices.map((d) =>
                d._id !== deviceId ? d : { ...d, isOn: !d.currentAction },
              ),
            },
      ),
    );
  };

  const handleEditRoom = (roomId: string) => {
    // TODO: navigate to edit screen
    console.log("Edit room:", roomId);
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

        {/* Room cards */}
        {rooms.map((room) => (
          <RoomCard
            key={room._id}
            room={room}
            onToggleDevice={handleToggleDevice}
            onEditRoom={handleEditRoom}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default RoomsScreen;
