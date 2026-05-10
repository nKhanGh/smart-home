// app/login.tsx
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Toast } from "@/components/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { registerPushToken } from "@/hooks/usePushNotification";
import { authService } from "@/service/auth.service";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../styles/login.styles";

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { fetchUserInfo } = useAuth();

  const handleLogin = async () => {
    if (!username.trim()) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng nhập tên đăng nhập",
      });
      return;
    }
    if (username.trim().length < 6) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Tên đăng nhập phải có ít nhất 6 ký tự",
      });
      return;
    }
    if (!password.trim()) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng nhập mật khẩu",
      });
      return;
    }
    if (password.trim().length < 8) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Mật khẩu phải có ít nhất 8 ký tự",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login(username, password);
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
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Đăng nhập thất bại",
        text2:
          error.response?.data?.msg ||
          "Vui lòng kiểm tra lại thông tin đăng nhập",
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

          <View style={styles.passwordWrap}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Mật khẩu"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <Pressable
              onPress={() => setShowPassword((prev) => !prev)}
              style={styles.passwordToggle}
              hitSlop={8}
            >
              <Ionicons
                name={!showPassword ? "eye-off" : "eye"}
                size={20}
                color="#6B7280"
              />
            </Pressable>
          </View>
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
