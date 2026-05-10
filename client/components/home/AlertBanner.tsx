import { styles } from "@/styles/(tabs)/index.styles";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

const AlertBanner = ({
  alert,
  text,
  type,
  onClose,
}: {
  alert: string;
  text: string;
  type: string;
  onClose?: () => void;
}) => {
  const alertSelect = (() => {
    switch (type) {
      case "temperatureSensor":
        return {
          icon: "🔥",
          backgroundColor: "#e2440022",
          textColor: "#ec1f04",
          iconBackground: "#F59E0B11",
        };
      case "humiditySensor":
        return {
          icon: "💧",
          backgroundColor: "#3B82F622",
          textColor: "#3B82F6",
          iconBackground: "#3B82F611",
        };
      case "motionSensor":
        return {
          icon: "🚶",
          backgroundColor: "#8B5CF622",
          textColor: "#7C3AED",
          iconBackground: "#8B5CF611",
        };
      default:
        return {
          icon: "☀️",
          backgroundColor: "#F59E0B22",
          textColor: "#F59E0B",
          iconBackground: "#F59E0B11",
        };
    }
  })();
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
      {onClose ? (
        <Pressable onPress={onClose} hitSlop={8} style={styles.alertCloseBtn}>
          <Ionicons name="close" size={16} color={alertSelect.textColor} />
        </Pressable>
      ) : null}
    </View>
  );
};

export default AlertBanner;
