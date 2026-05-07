import DoorChangePasswordModal from "@/components/modals/DoorChangePasswordModal";
import DoorPasswordModal from "@/components/modals/DoorPasswordModal";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { DeviceService } from "@/service/device.service";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const DOOR_W = 150;
const DOOR_H = 240;

// ── Door illustration ─────────────────────────────────────────────────────────
const DoorIllustration = ({
  openAnim,
  glowAnim,
}: {
  openAnim: Animated.Value;
  glowAnim: Animated.Value;
}) => {
  const translateX = openAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(DOOR_W - 10)],
  });
  const skewY = openAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-2deg"],
  });
  const opacity = openAnim.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [1, 0.65, 0.12],
  });
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.frameOuter}>
      <View style={styles.roomBg} />
      <Animated.View style={[styles.floorGlow, { opacity: glowOpacity }]} />

      <View style={[styles.hinge, { top: 22 }]} />
      <View style={[styles.hinge, { bottom: 22 }]} />

      <Animated.View
        style={[
          styles.doorPanel,
          { transform: [{ translateX }, { skewY }], opacity },
        ]}
      >
        <View style={[styles.grain, { left: "22%" }]} />
        <View style={[styles.grain, { left: "48%", opacity: 0.07 }]} />
        <View style={[styles.grain, { left: "70%", opacity: 0.04 }]} />
        <View style={styles.insetTop} />
        <View style={styles.insetBottom} />
        <View style={styles.knobPlate} />
        <View style={styles.knobStem} />
        <View style={styles.knob} />
      </Animated.View>

      <View style={styles.floorLine} />
    </View>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const DoorComponent = ({ device }: { device: DeviceResponse }) => {
  const [currentAction, setCurrentAction] = useState(
    String(device.currentAction ?? "0"),
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [changePassVisible, setChangePassVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<string>("0");
  const [isOpen, setIsOpen] = useState(currentAction === "1");

  useEffect(() => {
    setIsOpen(currentAction === "1");
  }, [currentAction]);
  const { user } = useAuth();

  const openAnim = useRef(
    new Animated.Value(currentAction === "1" ? 1 : 0),
  ).current;
  const glowAnim = useRef(
    new Animated.Value(currentAction === "1" ? 1 : 0),
  ).current;

  const { subscribe } = useSocket();

  useEffect(() => {
    const unsubscribe = subscribe("device:action", (data: any) => {
      if (data.deviceId === device.id) {
        const value = String(data.value);
        setCurrentAction(value);
        Animated.parallel([
          Animated.spring(openAnim, {
            toValue: value === "1" ? 1 : 0,
            useNativeDriver: true,
            friction: 8,
            tension: 38,
          }),
          Animated.timing(glowAnim, {
            toValue: value === "1" ? 1 : 0,
            duration: 480,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start();
      }
    });
    return () => unsubscribe();
  }, [subscribe, device.id]);


  const handleToggle = () => {
    setPendingAction(isOpen ? "0" : "1");
    setModalVisible(true);
  };

  const doAction = async (
    id: string,
    action: string | number,
    password?: string,
  ) => {
    try {
      await DeviceService.sendCommand(id, String(action), password);
    } catch (error) {
      console.error("Error sending door command:", error);
    }
  };

  return (
    <>
      <View style={styles.wrapper}>
        {/* ── Door scene ── */}
        <DoorIllustration openAnim={openAnim} glowAnim={glowAnim} />

        {/* ── Right panel ── */}
        <View style={styles.rightPanel}>
          {/* Status box */}
          <View
            style={[
              styles.statusBox,
              {
                backgroundColor: isOpen
                  ? "rgba(34,197,94,0.1)"
                  : "rgba(244,121,33,0.1)",
                borderColor: isOpen
                  ? "rgba(34,197,94,0.25)"
                  : "rgba(244,121,33,0.25)",
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOpen ? "#22c55e" : "#f47921" },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: isOpen ? "#22c55e" : "#f47921" },
              ]}
            >
              {isOpen ? "Đang mở" : "Đang đóng"}
            </Text>
          </View>
          <Switch
            value={device.currentAction != "0"}
            onValueChange={() => handleToggle()}
            trackColor={{ false: "#D1D5DB", true: "#86EFAC" }}
            thumbColor={
              device.currentAction === "0" || device.currentAction === 0
                ? "#F9FAFB"
                : "#22C55E"
            }
            ios_backgroundColor="#D1D5DB"
          />
          {user?.role === "admin" && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setChangePassVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnText}>Đổi mật khẩu khóa</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <DoorPasswordModal
        doorModalVisible={modalVisible}
        setDoorModalVisible={setModalVisible}
        pendingDoorDevice={device}
        pendingAction={pendingAction}
        doAction={doAction}
      />
      <DoorChangePasswordModal
        visible={changePassVisible}
        setVisible={setChangePassVisible}
        device={device}
      />
    </>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 36,
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },

  /* ── Door frame ── */
  frameOuter: {
    width: DOOR_W + 24,
    height: DOOR_H + 24,
    borderWidth: 3,
    borderColor: "#4A2E0E",
    borderRadius: 7,
    overflow: "hidden",
    position: "relative",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.45,
        shadowRadius: 6,
      },
      android: { elevation: 6 },
    }),
  },
  roomBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0D0804",
  },
  floorGlow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    backgroundColor: "rgba(251,191,36,0.10)",
  },
  floorLine: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#3D2009",
  },
  hinge: {
    position: "absolute",
    left: 9,
    width: 7,
    height: 20,
    borderRadius: 3.5,
    backgroundColor: "#7A6040",
    zIndex: 10,
    borderWidth: 0.5,
    borderColor: "#9A8060",
  },
  doorPanel: {
    position: "absolute",
    left: 12,
    top: 8,
    width: DOOR_W,
    height: DOOR_H,
    backgroundColor: "#7B3A10",
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: "#4A2E0E",
    overflow: "hidden",
  },
  grain: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  insetTop: {
    position: "absolute",
    top: 11,
    left: 9,
    right: 9,
    height: 44,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: "#4A2E0E",
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  insetBottom: {
    position: "absolute",
    top: 65,
    left: 9,
    right: 9,
    bottom: 10,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: "#4A2E0E",
    backgroundColor: "rgba(0,0,0,0.10)",
  },
  knobPlate: {
    position: "absolute",
    right: 9,
    top: "50%",
    marginTop: -14,
    width: 5,
    height: 28,
    borderRadius: 3,
    backgroundColor: "#A07840",
  },
  knobStem: {
    position: "absolute",
    right: 8,
    top: "50%",
    marginTop: -6,
    width: 7,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#C8A45A",
  },
  knob: {
    position: "absolute",
    right: 8,
    top: "50%",
    marginTop: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#D4AF37",
    borderWidth: 1,
    borderColor: "#9A7820",
  },

  /* ── Right panel ── */
  rightPanel: {
    alignItems: "center",
    gap: 16,
  },

  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  actionBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 0,
    backgroundColor: "#16A34A",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 6,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
});

export default DoorComponent;
