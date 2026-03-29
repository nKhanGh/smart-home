// app/(tabs)/index.tsx
import { styles } from "@/styles/(tabs)/index.styles";
import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

// Types
type Device = {
  id: string;
  name: string;
  icon: string;
  on: boolean;
};

// ── Mock data ────────────────────────────────────
const DEVICES: Device[] = [
  { id: '1', name: 'Đèn phòng khách', icon: '💡', on: true },
  { id: '2', name: 'Quạt phòng khách', icon: '🌀', on: false },
  { id: '3', name: 'Đèn nhà bếp', icon: '💡', on: false },
  { id: '4', name: 'Đèn phòng ngủ bố', icon: '💡', on: false },
];

// ── Sub-components ───────────────────────────────
const SensorCard = ({
  emoji, label, value, unit, status, statusColor, accentColor,
}: {
  emoji: string; label: string; value: string; unit: string;
  status: string; statusColor: string; accentColor: string;
}) => (
  <View style={styles.sensorCard}>
    <View style={[styles.sensorAccent, { backgroundColor: accentColor }]} />
    <View style={styles.sensorHeader}>
      <View style={styles.roomBadge}>
        <View style={styles.dot} />
        <Text style={styles.roomBadgeText}>Phòng khách</Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </View>
    </View>
    <Text style={styles.sensorEmoji}>{emoji}</Text>
    <View style={styles.sensorValueRow}>
      <Text style={styles.sensorValue}>{value}</Text>
      <Text style={styles.sensorUnit}>{unit}</Text>
    </View>
    <Text style={styles.sensorLabel}>{label}</Text>
    <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
    </View>
  </View>
);

// ── Main Screen ──────────────────────────────────
export default function HomeScreen() {
  const [devices, setDevices] = useState<Device[]>(DEVICES);

  const toggleDevice = (id: string) => {
    setDevices(prev =>
      prev.map(d => d.id === id ? { ...d, on: !d.on } : d)
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Xin chào, Khang 👋</Text>
            <Text style={styles.date}>{new Date().toLocaleTimeString()} - {new Date().toLocaleDateString()}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>HK</Text>
          </View>
        </View>

        {/* ── Alert Banner ── */}
        <View style={styles.alertBanner}>
          <View style={styles.alertIconWrap}>
            <Text style={styles.alertIconText}>🔥</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertBold}>Cảnh báo nhiệt độ cao</Text>
            <Text style={styles.alertText}>38.5°C vượt ngưỡng cho phép 37°C</Text>
          </View>
        </View>

        {/* ── Sensor Row ── */}
        <View style={styles.sensorRow}>
          <SensorCard
            emoji="🌡️" label="NHIỆT ĐỘ" value="38.7" unit="°C"
            status="Cao" statusColor="#F59E0B" accentColor="#F97316"
          />
          <SensorCard
            emoji="💧" label="ĐỘ ẨM" value="70" unit="%"
            status="Bình thường" statusColor="#22C55E" accentColor="#3B82F6"
          />
        </View>

        {/* ── Light Card ── */}
        <View style={styles.lightCard}>
          <View style={[styles.sensorAccent, { backgroundColor: '#F59E0B' }]} />
          <View style={styles.lightCardTop}>
            <Text style={styles.lightEmoji}>☀️</Text>
            <Text style={styles.lightTitle}>ÁNH SÁNG</Text>
            <View style={styles.roomBadge}>
              <View style={styles.dot} />
              <Text style={styles.roomBadgeText}>Phòng khách</Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </View>
          </View>
          <View style={styles.lightCardBottom}>
            <View style={styles.sensorValueRow}>
              <Text style={styles.sensorValue}>142</Text>
              <Text style={styles.sensorUnit}>lux</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: '#3B82F622' }]}>
              <View style={[styles.statusDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={[styles.statusText, { color: '#3B82F6' }]}>Thấp</Text>
            </View>
          </View>
        </View>

        {/* ── Quick Devices ── */}
        <View style={styles.devicesCard}>
          <View style={styles.devicesHeader}>
            <Text style={styles.devicesTitle}>Thiết bị nhanh</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>Xem tất cả →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.devicesGrid}>
            {devices.map(device => (
              <TouchableOpacity
                key={device.id}
                style={[styles.deviceItem, device.on && styles.deviceItemOn]}
                onPress={() => toggleDevice(device.id)}
              >
                <Text style={styles.deviceIcon}>{device.icon}</Text>
                <Text style={styles.deviceName}>{device.name}</Text>
                <Text style={[styles.deviceStatus, device.on && styles.deviceStatusOn]}>
                  {device.on ? 'BẬT' : 'Tắt'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* ── Bottom Tab ── */}
      {/* <View style={styles.tabBar}>
        {[
          { icon: '🏠', label: 'TRANG CHỦ', active: true },
          { icon: '⊞', label: 'PHÒNG', active: false },
        ].map(tab => (
          <TouchableOpacity key={tab.label} style={styles.tabItem}>
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, tab.active && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))} */}

        {/* Mic Button */}
        {/* <View style={styles.micWrapper}>
          <TouchableOpacity style={styles.micButton}>
            <Text style={styles.micIcon}>🎤</Text>
          </TouchableOpacity>
        </View> */}

        {/* {[
          { icon: '📈', label: 'THỐNG KÊ', active: false },
          { icon: '⚙️', label: 'CÀI ĐẶT', active: false },
        ].map(tab => (
          <TouchableOpacity key={tab.label} style={styles.tabItem}>
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={styles.tabLabel}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View> */}
    </SafeAreaView>
  );
}

