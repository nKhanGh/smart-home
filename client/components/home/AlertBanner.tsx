import { View, Text } from "react-native";
import { styles } from "@/styles/(tabs)/index.styles";

const AlertBanner = ({
  alert,
  text,
  type,
}: {
  alert: string;
  text: string;
  type: string;
}) => {
  const alertSelect = {
    icon:
      type === "temperatureSensor"
        ? "🔥"
        : type === "humiditySensor"
          ? "💧"
          : "☀️",
    backgroundColor:
      type === "temperatureSensor"
        ? "#e2440022"
        : type === "humiditySensor"
          ? "#3B82F622"
          : "#F59E0B22",
    textColor:
      type === "temperatureSensor"
        ? "#ec1f04"
        : type === "humiditySensor"
          ? "#3B82F6"
          : "#F59E0B",
    iconBackground:
      type === "temperatureSensor"
        ? "#F59E0B11"
        : type === "humiditySensor"
          ? "#3B82F611"
          : "#F59E0B11",
  };
  return (
    <View
      style={[
        styles.alertBanner,
        {
          backgroundColor: alertSelect.backgroundColor,
          borderColor: alertSelect.textColor,
        },
      ]}
    >
      <View
        style={[
          styles.alertIconWrap,
          { backgroundColor: alertSelect.iconBackground },
        ]}
      >
        <Text
          style={[
            styles.alertIconText,
            {
              color: alertSelect.textColor,
              backgroundColor: alertSelect.iconBackground,
            },
          ]}
        >
          {alertSelect.icon}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.alertBold, { color: alertSelect.textColor }]}>
          {alert}
        </Text>
        <Text style={[styles.alertText, { color: alertSelect.textColor }]}>
          {text}
        </Text>
      </View>
    </View>
  );
};

export default AlertBanner;