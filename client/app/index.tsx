import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../styles/index.styles";

import { checkAndRefreshToken } from "@/utils/auth.util";

const SmartHomeOnboarding = () => {
  const router = useRouter();

  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 }),
      ),
      -1,
      true,
    );
  }, []);

  const startFunction = async () => {
    const result = await checkAndRefreshToken();
    if (result) {
      router.push("/(tabs)");
    } else {
      router.push("./login");
    }
  };

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleIconPress = (name: string) => {
    Alert.alert("Thông báo", `Bạn vừa nhấn vào tính năng: ${name}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background */}
      <View style={styles.topSection}>
        {/* Icons */}
        <TouchableOpacity
          onPress={() => handleIconPress("Độ ẩm")}
          style={[styles.iconBox, styles.topLeft]}
        >
          <Ionicons name="water" size={28} color="#3B82F6" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleIconPress("Nhiệt độ")}
          style={[styles.iconBox, styles.topRight]}
        >
          <MaterialCommunityIcons
            name="thermometer"
            size={28}
            color="#EF4444"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleIconPress("Cài đặt")}
          style={[styles.iconBox, styles.bottomLeft]}
        >
          <Ionicons name="settings" size={28} color="#6B7280" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleIconPress("Ánh sáng")}
          style={[styles.iconBox, styles.bottomRight]}
        >
          <Ionicons name="sunny" size={28} color="#F59E0B" />
        </TouchableOpacity>

        {/* Logo */}
        <Animated.View style={animatedLogoStyle}>
          <Image
            source={require("@/assets/images/smart-home.png")}
            style={styles.logoBox}
          />
        </Animated.View>
      </View>

      {/* Text */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.smartText}>Nex</Text>
          <Text style={styles.homeText}>Home</Text>
        </View>

        <Text style={styles.description}>
          Hệ thống nhà thông minh{"\n"}
          an toàn - tiết kiệm - tự động
        </Text>
      </View>

      {/* Button */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={startFunction} style={styles.button}>
          <Text style={styles.buttonText}>GET STARTED</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default SmartHomeOnboarding;
