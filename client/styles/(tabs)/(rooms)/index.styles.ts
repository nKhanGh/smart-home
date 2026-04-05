import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0FAF2", marginBottom: -24 },
  scroll: { padding: 16, gap: 20 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 0,
    top: -8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#000",
    letterSpacing: -0.5,
  },
  headerSub: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  // Image
  imageWrap: { height: 160, position: "relative" },
  roomImage: { width: "100%", height: "100%", resizeMode: "cover" },
  imagePlaceholder: { backgroundColor: "#D1FAE5" },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  imageLabel: { position: "absolute", bottom: 14, left: 16 },
  roomName: { color: "#fff", fontSize: 20, fontWeight: "700" },
  roomCount: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 },

  // Stats row
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 20,
  },
  statItem: { alignItems: "center", gap: 2 },
  statIcon: { fontSize: 20 },
  statCount: { fontSize: 13, fontWeight: "700", color: "#374151" },
  expandBtn: { marginLeft: "auto" },
  expandIcon: { fontSize: 18, color: "#9CA3AF", fontWeight: "600" },

  // Device list
  deviceList: { paddingHorizontal: 16, paddingBottom: 4 },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginBottom: 8 },
  deviceDivider: { height: 1, backgroundColor: "#F9FAFB", marginVertical: 4 },

  // Device row
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  deviceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  deviceIconText: { fontSize: 22 },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  deviceMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 3,
  },
  deviceStatus: { fontSize: 12 },
  statusOn: { color: "#22C55E" },
  statusOff: { color: "#9CA3AF" },

  // Mode badge
  modeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeAuto: { backgroundColor: "#DCFCE7" },
  badgeManual: { backgroundColor: "#FEF3C7" },
  modeText: { fontSize: 11, fontWeight: "700" },
  modeTextAuto: { color: "#16A34A" },
  modeTextManual: { color: "#D97706" },

  // Sensor value
  sensorValue: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tempSensor: {
    backgroundColor: "#feefdb",
    borderRadius: 12,
  },
  humiditySensor: { backgroundColor: "#d1f8fa", borderRadius: 12 },
  lightSensor: { backgroundColor: "#FEF3C7", borderRadius: 12 },
  motionSensor: { backgroundColor: "#FEE2E2", borderRadius: 12 },
  sensorValueText: { fontSize: 13, fontWeight: "700", color: "#92400E" },

  // Edit button
  editBtn: {
    margin: 16,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#22C55E",
    borderStyle: "dashed",
    alignItems: "center",
  },
  editBtnText: {
    color: "#22C55E",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
