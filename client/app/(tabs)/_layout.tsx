import { HapticTab } from "@/components/haptic-tab";
import VoiceCommandModal from "@/components/modals/VoiceCommandModal";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Tab config
const TAB_CONFIGS = [
  { name: "index", label: "TRANG CHỦ", icon: "home" },
  { name: "(rooms)/index", label: "PHÒNG", icon: "grid" },
  { name: "(stats)/index", label: "THỐNG KÊ", icon: "stats-chart" },
  { name: "(settings)/index", label: "CÀI ĐẶT", icon: "settings" },
] as const;

// Animated Tab Item
const TabItem = ({
  icon,
  label,
  active,
  onPress,
}: {
  icon: string;
  label: string;
  active: boolean;
  onPress: () => void;
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.82,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Pressable onPress={handlePress} style={styles.tabItem}>
      <Animated.View style={[styles.tabItemInner, { transform: [{ scale }] }]}>
        <Ionicons
          name={icon as any}
          size={24}
          color={active ? "#22C55E" : "#9CA3AF"}
        />
        <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

// ── Mic Button ───────────────────────────────────
const MicButton = ({ onPress }: { onPress: () => void }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.88,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <View style={styles.micWrapper}>
      <Pressable onPress={handlePress}>
        <Animated.View style={[styles.micButton, { transform: [{ scale }] }]}>
          <Ionicons name="mic" size={26} color="white" />
        </Animated.View>
      </Pressable>
    </View>
  );
};

const CustomTabBar = ({
  state,
  navigation,
  onMicPress,
}: BottomTabBarProps & { onMicPress: () => void }) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 12) + 12;
  const navigate = (route: (typeof state.routes)[0]) => {
    navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    navigation.navigate(route.name);
  };

  // Lấy đúng 4 route theo thứ tự TAB_CONFIG, không phụ thuộc state.routes
  const tabNames = TAB_CONFIGS.map((c) => c.name);
  const allRoutes = tabNames
    .map((name) => state.routes.find((r) => r.name === name))
    .filter(Boolean) as (typeof state.routes)[0][];

  const left = allRoutes.slice(0, 2);
  const right = allRoutes.slice(2, 4);

  const renderTab = (route: (typeof state.routes)[0]) => {
    const config = TAB_CONFIGS.find((c) => c.name === route.name);
    if (!config) return null;
    const active = state.routes[state.index]?.name === route.name;

    return (
      <TabItem
        key={route.key}
        icon={active ? config.icon : `${config.icon}-outline`}
        label={config.label}
        active={active}
        onPress={() => navigate(route)}
      />
    );
  };

  return (
    <View style={[styles.tabBar, { paddingBottom: bottomPadding }]}>
      {left.map(renderTab)}
      <MicButton onPress={onMicPress} />
      {right.map(renderTab)}
    </View>
  );
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);
  const renderTabBar = useCallback(
    (props: BottomTabBarProps) => (
      <CustomTabBar
        {...props}
        onMicPress={() => setIsVoiceModalVisible(true)}
      />
    ),
    [],
  );

  return (
    <>
      <Tabs
        tabBar={renderTabBar}
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: false,
          tabBarButton: HapticTab,
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Trang chủ" }} />
        <Tabs.Screen name="(rooms)" options={{ title: "Phòng" }} />
        <Tabs.Screen name="(stats)" options={{ title: "Thống kê" }} />
        <Tabs.Screen name="(settings)" options={{ title: "Cài đặt" }} />
      </Tabs>

      <VoiceCommandModal
        visible={isVoiceModalVisible}
        onClose={() => setIsVoiceModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingBottom: 24,
    paddingTop: 10,
    paddingHorizontal: 8,
    alignItems: "flex-end",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
  },
  tabItemInner: {
    alignItems: "center",
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  tabLabelActive: {
    color: "#22C55E",
  },
  micWrapper: {
    flex: 1,
    alignItems: "center",
    marginBottom: 8,
  },
  micButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
});
