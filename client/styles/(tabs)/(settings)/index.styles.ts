import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0FAF2", marginBottom: -24 },
  scroll: { padding: 16, gap: 20 },

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

  userCardGreen: {
    backgroundColor: "#16853F",
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    marginBottom: 8,
    shadowColor: "#28BC5F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  avatarBig: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#28BC5F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarBigText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 22,
  },

  userNameGreen: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  userRoleGreen: {
    color: 'white',
    fontSize: 14,
    marginTop: 2,
  },
  userEmailGreen: {
    color: 'white',
    fontSize: 13,
    marginTop: 10,
  },

  sectionSubText: {
    color: '#A0A0A0',
    fontSize: 12,
    marginTop: 4,
  },
  sectionCardAlert: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  sectionAlertRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionLabel: {
    color: '#A0A0A0',
    fontSize: 13,
    fontWeight: 'bold',
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 3,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionText: {
    fontSize: 16,
    color: '#222',
    fontWeight: 'bold',
  },

  thresholdLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
  },
  thresholdValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16853F',
    marginLeft: 8,
  },
  thresholdMinMaxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  thresholdMinMax: {
    color: '#A0A0A0',
    fontSize: 15,
  },
	
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    marginTop: 13,
    gap: 8,
  },
  logoutText: {
    color: '#DC2626',
    fontWeight: 'bold',
    fontSize: 16,
  },
});