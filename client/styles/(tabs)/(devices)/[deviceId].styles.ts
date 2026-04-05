import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0FAF2", marginBottom: -24 },
    scroll: {
    paddingHorizontal: 20,
    // paddingTop: 16,
    // paddingBottom: 20,
    gap: 16,
  },
  header: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    letterSpacing: -0.3,
  },
  headerSubTitle: {
    fontSize: 14,
    color: "#aba8a8",
    fontWeight: "300",
    letterSpacing: -0.3,
    marginLeft: 6,
  },

  subHeader: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: "#16853F",
    borderRadius: 16,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginTop: 8,
  },
  iconWrap: {
    padding: 16,
    backgroundColor: "#28BC5F",
    borderRadius: 8,
  },
  icon: {
    fontSize: 20,
  },
  subHeaderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: -0.3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 4,
    backgroundColor: "#BBF7D0",
  },
  roomInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roomInfoText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "300",
    marginTop: 4,
  },
  deviceStatus: {
    color: "#d1d1d1",
    marginTop: 6,
    fontSize: 12,
  },

  switchContainer: {
    flexDirection: "row",
    backgroundColor: "#e1e1e1",
    borderRadius: 16,
    padding: 5,
    position: "relative",
    width: 340,
    alignSelf: "center",
  },
  switchSlider: {
    position: "absolute",
    top: 5,
    width: "50%",
    bottom: 5,
    backgroundColor: "#22c55e",
    borderRadius: 16,
    marginLeft: 5,
    textAlign: "center",
  },
  switchTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 10,
    zIndex: 1,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  switchLabelActive: { color: "#fff" },
  switchLabelInactive: { color: "#787878" },
})