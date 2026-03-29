import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    position: 'relative',
  },

  topSection: {
    backgroundColor: '#C6F4AF',
    top: -32,
    height: '60%',
    width: '100%',
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  iconBox: {
    position: 'absolute',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 16,
    elevation: 3,
  },

  topLeft: {
    top: 64,
    left: 40,
  },

  topRight: {
    top: 64,
    right: 40,
  },

  bottomLeft: {
    bottom: 70,
    left: 40,
  },

  bottomRight: {
    bottom: 70,
    right: 40,
  },

  logoBox: {
    backgroundColor: '#1FB858',
    padding: 32,
    borderRadius: 40,
    elevation: 10,
  },

  homeIcon: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  smartText: {
    color: '#22C55E',
    fontSize: 40,
    fontWeight: 'bold',
  },

  homeText: {
    color: 'black',
    fontSize: 40,
    fontWeight: 'bold',
  },

  description: {
    color: '#22C55E',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
    fontWeight: '500',
    lineHeight: 24,
  },

  footer: {
    alignItems: 'center',
    paddingBottom: 48,
  },

  button: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 5,
  },

  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});