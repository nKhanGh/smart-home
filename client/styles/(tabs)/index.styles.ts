import { StyleSheet } from "react-native";

//  Styles
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0FAF0",
    // paddingTop: 24
    paddingTop: 12,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    // paddingTop: 16,
    // paddingBottom: 20,
    gap: 16,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },
  date: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

  // Alert
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },

  alertIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  alertIconText: { fontSize: 18 },
  alertBold: { fontWeight: "700", color: "#EF4444", fontSize: 13 },
  alertText: { color: "#6B7280", fontSize: 12, marginTop: 1 },
  alertCloseBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  alertCloseText: {
    fontSize: 14,
    fontWeight: "700",
  },

  // Sensor Row
  sensorRow: {
    flexDirection: "row",
    gap: 12,
  },
  sensorCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sensorAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sensorHeader: {
    marginTop: 8,
    marginBottom: 10,
  },
  roomBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
    gap: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#22C55E",
  },
  roomBadgeText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
  dropdownArrow: {
    fontSize: 9,
    color: "#6B7280",
  },
  sensorEmoji: { fontSize: 28, marginBottom: 8 },
  sensorValueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
  },
  sensorValue: {
    fontSize: 40,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 44,
  },
  sensorUnit: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 6,
  },
  sensorLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 1,
    marginTop: 2,
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Light Card
  lightCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  lightCardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 12,
    gap: 10,
  },
  lightEmoji: { fontSize: 28 },
  lightTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 1,
  },
  lightCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  // Devices
  devicesCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  devicesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  devicesTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  viewAll: {
    color: "#22C55E",
    fontSize: 14,
    fontWeight: "600",
  },
  devicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  devicesEmpty: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  devicesEmptyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  devicesEmptyText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  devicesEmptySubtext: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  deviceItem: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: "transparent",
    width: "23%",
  },
  deviceItemOn: {
    backgroundColor: "#DCFCE7",
    borderColor: "#86EFAC",
  },
  deviceIcon: { fontSize: 26 },
  deviceName: {
    fontSize: 11,
    color: "#374151",
    textAlign: "center",
    fontWeight: "500",
  },
  deviceStatus: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  deviceStatusOn: {
    color: "#22C55E",
    fontWeight: "700",
  },
  updateButton: {
    marginTop: 12,
    marginLeft: "auto",
  },

  updateButtonText: {
    color: "#22C55E",
    fontSize: 14,
    fontWeight: "600",
  },

  // Tab Bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingBottom: 16,
    paddingTop: 10,
    paddingHorizontal: 8,
    alignItems: "flex-end",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  tabIcon: { fontSize: 22 },
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  micIcon: { fontSize: 24 },
});
