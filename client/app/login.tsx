// app/login.tsx
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { registerPushToken } from "@/hooks/usePushNotification";
import { authService } from "@/service/auth.service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { styles } from "../styles/login.styles";

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { fetchUserInfo } = useAuth();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await authService.login(username, password);
      console.log("Login response:", response);
      if (response.data) {
        // Lưu token vào AsyncStorage hoặc Context
        const { token, refreshToken } = response.data;
        await AsyncStorage.setItem("smart-home-access-token", token);
        await AsyncStorage.setItem("smart-home-refresh-token", refreshToken);
        await registerPushToken();
      }
      await fetchUserInfo();
      router.replace("/(tabs)");
      Toast.show({
        type: "success",
        text1: "Đăng nhập thành công",
        text2: `Chào mừng ${username}!`,
      });
    } catch (error) {
      console.error("Login error:", error);
      Toast.show({
        type: "error",
        text1: "Đăng nhập thất bại",
        text2: "Vui lòng kiểm tra lại tên đăng nhập và mật khẩu.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logoImage}
          />
        </View>
        <Text style={styles.logoTitle}>
          <Text style={styles.logoGreen}>Nex</Text>
          <Text style={styles.logoBlack}>Home</Text>
        </Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.title}>ĐĂNG NHẬP</Text>

        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="Tên đăng nhập"
            placeholderTextColor="#9CA3AF"
            value={username}
            onChangeText={setUsername}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Mật khẩu"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          activeOpacity={0.85}
        >
          {loading ? (
            <LoadingSpinner size={24} color="#FFFFFF" variant="spinner" />
          ) : (
            <Text style={styles.buttonText}>ĐĂNG NHẬP</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
