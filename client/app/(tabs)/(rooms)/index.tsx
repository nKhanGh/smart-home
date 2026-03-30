// app/(tabs)/rooms.tsx
import { View, Text, StyleSheet } from 'react-native';
export default function RoomsScreen() {
  return <View style={s.c}><Text>Phòng</Text></View>;
}
const s = StyleSheet.create({ c: { flex: 1, alignItems: 'center', justifyContent: 'center' } });