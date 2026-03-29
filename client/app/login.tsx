// app/login.tsx
import { authService } from "@/service/auth.service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "../styles/login.styles";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const response = await authService.login(email, password);
      console.log("Login response:", response);
      if (response.data) {
        // Lưu token vào AsyncStorage hoặc Context
        const { token, refreshToken } = response.data;
        await AsyncStorage.setItem("smart-home-access-token", token);
        await AsyncStorage.setItem("smart-home-refresh-token", refreshToken);
      }
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Image
            source={require("@/assets/images/smart-home.png")}
            style={styles.logoImage}
          />
        </View>
        <Text style={styles.logoTitle}>
          <Text style={styles.logoGreen}>Smart</Text>
          <Text style={styles.logoBlack}>Home</Text>
        </Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.title}>ĐĂNG NHẬP</Text>

        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
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
          <Text style={styles.buttonText}>ĐĂNG NHẬP</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
