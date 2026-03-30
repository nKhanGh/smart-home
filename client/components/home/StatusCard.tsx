import { styles } from "@/styles/(tabs)/index.styles";
import { View, Text } from "react-native";


const StatusCard = ({
  value,
  type,
}: {
  value: string | number;
  type: string;
}) => {
  if (type === "temperatureSensor") {
    const tempValue = Number.parseFloat(value as string);
    if (tempValue < 20) {
      return (
        <View style={[styles.statusBadge, { backgroundColor: "#3B82F622" }]}>
          <View style={[styles.statusDot, { backgroundColor: "#3B82F6" }]} />
          <Text style={[styles.statusText, { color: "#3B82F6" }]}>Thấp</Text>
        </View>
      );
    } else if (tempValue <= 30) {
      return (
        <View style={[styles.statusBadge, { backgroundColor: "#22C55E22" }]}>
          <View style={[styles.statusDot, { backgroundColor: "#22C55E" }]} />
          <Text style={[styles.statusText, { color: "#22C55E" }]}>
            Bình thường
          </Text>
        </View>
      );
    } else {
      return (
        <View style={[styles.statusBadge, { backgroundColor: "#F59E0B22" }]}>
          <View style={[styles.statusDot, { backgroundColor: "#F59E0B" }]} />
          <Text style={[styles.statusText, { color: "#F59E0B" }]}>Cao</Text>
        </View>
      );
    }
  } else if (type === "humiditySensor") {
    const humValue = Number.parseFloat(value as string);
    if (humValue <= 30) {
      return (
        <View style={[styles.statusBadge, { backgroundColor: "#3B82F622" }]}>
          <View style={[styles.statusDot, { backgroundColor: "#3B82F6" }]} />
          <Text style={[styles.statusText, { color: "#3B82F6" }]}>Thấp</Text>
        </View>
      );
    } else if (humValue <= 60) {
      return (
        <View style={[styles.statusBadge, { backgroundColor: "#22C55E22" }]}>
          <View style={[styles.statusDot, { backgroundColor: "#22C55E" }]} />
          <Text style={[styles.statusText, { color: "#22C55E" }]}>
            Bình thường
          </Text>
        </View>
      );
    } else {
      return (
        <View style={[styles.statusBadge, { backgroundColor: "#F59E0B22" }]}>
          <View style={[styles.statusDot, { backgroundColor: "#F59E0B" }]} />
          <Text style={[styles.statusText, { color: "#F59E0B" }]}>Cao</Text>
        </View>
      );
    }
  } else if (type === "lightSensor") {
    const lightValue = Number.parseFloat(value as string);
    if (lightValue < 100) {
      return (
        <View style={[styles.statusBadge, { backgroundColor: "#3B82F622" }]}>
          <View style={[styles.statusDot, { backgroundColor: "#3B82F6" }]} />
          <Text style={[styles.statusText, { color: "#3B82F6" }]}>Thấp</Text>
        </View>
      );
    } else if (lightValue <= 500) {
      return (
        <View style={[styles.statusBadge, { backgroundColor: "#22C55E22" }]}>
          <View style={[styles.statusDot, { backgroundColor: "#22C55E" }]} />
          <Text style={[styles.statusText, { color: "#22C55E" }]}>
            Bình thường
          </Text>
        </View>
      );
    } else {
      return (
        <View style={[styles.statusBadge, { backgroundColor: "#F59E0B22" }]}>
          <View style={[styles.statusDot, { backgroundColor: "#F59E0B" }]} />
          <Text style={[styles.statusText, { color: "#F59E0B" }]}>Cao</Text>
        </View>
      );
    }
  } else {
    return (
      <Text style={[styles.statusText, { color: "#6B7280" }]}>
        Không xác định
      </Text>
    );
  }
};

export default StatusCard;