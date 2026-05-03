import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
    width: '100%',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 14,
    marginTop: 32,
  },
  logoBox: {
    // width: 72,
    // height: 72,
    // backgroundColor: '#22C55E',
    // borderRadius: 18,
    // alignItems: 'center',
    // justifyContent: 'center',
    // shadowColor: '#22C55E',
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.35,
    // shadowRadius: 8,
    // elevation: 6,
  },
  logoImage: {
    width: 72,
    height: 72,
  },
  logoTitle: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  logoGreen: {
    color: '#22C55E',
  },
  logoBlack: {
    color: '#111827',
  },

  // ── Form ────────────────────────────────────────
  form: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 52,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 36,
    letterSpacing: 0.5,
  },
  inputGroup: {
    gap: 14,
    marginBottom: 28,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
    fontSize: 16,
    color: '#111827',
  },
  button: {
    backgroundColor: '#22C55E',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 24,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 1.5,
  },

  // ── Register ────────────────────────────────────
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: '#6B7280',
    fontSize: 15,
  },
  registerLink: {
    color: '#22C55E',
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});