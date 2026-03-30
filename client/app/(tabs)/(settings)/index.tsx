// app/(tabs)/settings.tsx
import { View, Text, StyleSheet } from 'react-native';
export default function SettingsScreen() {
  return <View style={s.c}><Text>Cài đặt</Text></View>;
}
const s = StyleSheet.create({ c: { flex: 1, alignItems: 'center', justifyContent: 'center' } });