import {

  View,
  Text,

} from "react-native";
import { styles } from "@/styles/(tabs)/index.styles";
import RoomBadge from "@/components/home/RoomBadge";
import StatusCard from "@/components/home/StatusCard";

const SensorCard = ({
  emoji,
  label,
  value,
  unit,
  accentColor,
  roomName,
  device,
  onSelect,
}: {
  emoji: string;
  label: string;
  value: string | number;
  unit: string;
  accentColor: string;
  roomName?: string;
  device?: DeviceResponse[];
  onSelect: (device: DeviceResponse) => void;
}) => (
  <View style={styles.sensorCard}>
    <View style={[styles.sensorAccent, { backgroundColor: accentColor }]} />
    <View style={styles.sensorHeader}>
      <RoomBadge roomName={roomName || "Không xác định"} device={device || []} onSelect={onSelect} />
    </View>
    <Text style={styles.sensorEmoji}>{emoji}</Text>
    <View style={styles.sensorValueRow}>
      <Text style={styles.sensorValue}>{value}</Text>
      <Text style={styles.sensorUnit}>{unit}</Text>
    </View>
    <Text style={styles.sensorLabel}>{label}</Text>
    {StatusCard({
      value,
      type: label.toLowerCase().includes("nhiệt")
        ? "temperatureSensor"
        : label.toLowerCase().includes("độ ẩm")
          ? "humiditySensor"
          : "lightSensor",
    })}
  </View>
);

export default SensorCard;
