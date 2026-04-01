import { StyleSheet } from "react-native";

export const statsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0FAF0",
    paddingTop: 12,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },

  // Period selector
  periodRow: {
    flexDirection: "row",
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  periodButtonActive: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  periodButtonTextActive: {
    color: "white",
  },

  // Sensor type selector
  sensorTypeRow: {
    flexDirection: "row",
    gap: 8,
  },
  sensorTypeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    gap: 2,
  },
  sensorTypeButtonActive: {
    borderWidth: 2,
  },
  sensorTypeEmoji: {
    fontSize: 18,
  },
  sensorTypeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B7280",
  },
  sensorTypeTextActive: {
    color: "#111827",
  },

  // Room picker
  roomPickerCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  roomPickerLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  roomScrollRow: {
    flexDirection: "row",
    gap: 8,
  },
  roomChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  roomChipActive: {
    backgroundColor: "#F0FDF4",
    borderColor: "#22C55E",
  },
  roomChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  roomChipTextActive: {
    color: "#16A34A",
  },

  // Current value card
  currentValueCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  currentValueAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  currentValueHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    marginBottom: 16,
  },
  currentValueEmoji: {
    fontSize: 28,
  },
  currentValueDeviceName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  currentValueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    marginBottom: 16,
  },
  currentValueNumber: {
    fontSize: 48,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 52,
  },
  currentValueUnit: {
    fontSize: 20,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },

  // Stats row (min/avg/max)
  statsRow: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
    alignSelf: "stretch",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  statUnit: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 1,
  },

  // Chart card
  chartCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 16,
  },
  chartWrapper: {
    alignItems: "center",
  },
  noDataText: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 14,
    paddingVertical: 32,
  },

  // Loading / empty state
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 14,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
  },
});
