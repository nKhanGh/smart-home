import { useSocket } from "@/contexts/SocketContext";
import { DeviceService } from "@/service/device.service";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const MODES = [
  { label: "Tắt", value: "0", speed: 0 },
  { label: "Thấp", value: "40", speed: 1800 },
  { label: "Vừa", value: "70", speed: 900 },
  { label: "Mạnh", value: "100", speed: 380 },
] as const;

const getMode = (action: string) =>
  MODES.find((m) => m.value === action) ?? MODES[0];

// ── Fan illustration ──────────────────────────────────────────────────────────
const FanIllustration = ({ action }: { action: string }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const mode = getMode(action);

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.94,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();

    loopRef.current?.stop();
    loopRef.current = null;

    if (mode.speed === 0) {
      rotateAnim.setValue(0);
      return;
    }

    rotateAnim.setValue(0);
    loopRef.current = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: mode.speed,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loopRef.current.start();

    return () => {
      loopRef.current?.stop();
    };
  }, [action]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const bladeColor = "#5bb47c";
  const hubColor = "#16853F";
  const hubInnerColor = "#0F6B31";
  const ringColor = "rgba(22,133,63,0.82)";
  const grillColor = "rgba(22,133,63,0.56)";
  const grillBarColor = "rgba(22,133,63,0.46)";

  return (
    <Animated.View
      style={[styles.fanWrapper, { transform: [{ scale: scaleAnim }] }]}
    >
      {/* ── Lồng bảo vệ ── */}
      <View
        style={[
          styles.grille,
          {
            borderColor: ringColor,
          },
        ]}
      >
        {/* Vòng đồng tâm */}
        {[98, 74, 50, 26].map((size) => (
          <View
            key={size}
            style={[
              styles.grillRing,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderColor: grillColor,
              },
            ]}
          />
        ))}
        {/* Nan thẳng */}
        {[0, 45, 90, 135].map((deg) => (
          <View
            key={deg}
            style={[
              styles.grillBar,
              {
                transform: [{ rotate: `${deg}deg` }],
                backgroundColor: grillBarColor,
              },
            ]}
          />
        ))}

        {/* Cánh quạt */}
        <Animated.View
          style={[styles.bladeContainer, { transform: [{ rotate }] }]}
        >
          {[0, 120, 240].map((deg) => (
            <View
              key={deg}
              style={[
                styles.blade,
                {
                  backgroundColor: bladeColor,
                  transform: [
                    { rotate: `${deg}deg` },
                    { translateY: -16 },
                    { scaleX: 0.64 },
                  ],
                },
              ]}
            >
              <View style={styles.bladeHighlight} />
            </View>
          ))}
        </Animated.View>

        {/* Hub */}
        <View style={[styles.hub, { backgroundColor: hubColor }]}>
          <View style={[styles.hubInner, { backgroundColor: hubInnerColor }]} />
        </View>
      </View>

      {/* ── Hộp motor (phía sau lồng) ── */}
      <View style={styles.motorBox}>
        <View style={styles.motorRib} />
        <View style={[styles.motorRib, { marginTop: 4 }]} />
        {/* Vít góc */}
        {[
          { top: 4, left: 4 },
          { top: 4, right: 4 },
          { bottom: 4, left: 4 },
          { bottom: 4, right: 4 },
        ].map((pos) => (
          <View
            key={`${pos.top ?? "x"}-${pos.bottom ?? "x"}-${pos.left ?? "x"}-${pos.right ?? "x"}`}
            style={[styles.screw, pos]}
          />
        ))}
      </View>

      {/* ── Khớp nghiêng ── */}
      <View style={styles.tiltJoint}>
        <View style={styles.tiltJointBolt} />
      </View>

      {/* ── Cổ kết nối ── */}
      <View style={styles.neck} />

      {/* ── Khớp xoay ── */}
      <View style={styles.swivel} />

      {/* ── Cột đứng ── */}
      <View style={styles.pole}>
        {/* Highlight dọc */}
        <View style={styles.poleHighlight} />
      </View>

      {/* ── Đế ── */}
      <View style={styles.baseMid} />
      <View style={styles.baseBot} />
    </Animated.View>
  );
};

// ── Mode button ───────────────────────────────────────────────────────────────
const ModeBtn = ({
  mode,
  active,
  onPress,
}: {
  mode: (typeof MODES)[number];
  active: boolean;
  onPress: () => void;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.88,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
    >
      <Animated.View
        style={[
          styles.modeBtn,
          active && styles.modeBtnActive,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={[styles.modeBtnText, active && styles.modeBtnTextActive]}>
          {mode.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const FanComponent = ({ device }: { device: DeviceResponse }) => {
  const [currentAction, setCurrentAction] = useState(
    String(device.currentAction ?? "0"),
  );

  const { subscribe } = useSocket();

  useEffect(() => {
    const unsubscribe = subscribe("device:action", (data: any) => {
      if (data.deviceId === device.id) {
        setCurrentAction(String(data.value));
      }
    });
    return () => unsubscribe();
  }, [subscribe, device.id]);

  const handleActionChange = async (action: string) => {
    const prev = currentAction;
    try {
    //   setCurrentAction(action);
      await DeviceService.sendCommand(device.id, action);
    } catch (error) {
      console.error("Error updating device action:", error);
    //   setCurrentAction(prev);
    }
  };

  const isOn = currentAction !== "0";
  const activeMode = getMode(currentAction);

  return (
    <View style={styles.wrapper}>
      <FanIllustration action={currentAction} />

      {/* ── Right panel ── */}
      <View style={styles.rightPanel}>
        <View
          style={[
            styles.statusBox,
            {
              backgroundColor: isOn
                ? "rgba(34,197,94,0.10)"
                : "rgba(34,197,94,0.06)",
              borderColor: isOn
                ? "rgba(34,197,94,0.28)"
                : "rgba(21,128,61,0.35)",
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOn ? "#22C55E" : "#166534" },
            ]}
          />
          <Text
            style={[styles.statusText, { color: isOn ? "#86EFAC" : "#166534" }]}
          >
            {isOn ? activeMode.label : "Tắt"}
          </Text>
        </View>

        <View style={styles.modeGrid}>
          {MODES.map((mode) => (
            <ModeBtn
              key={mode.value}
              mode={mode}
              active={currentAction === mode.value}
              onPress={() => handleActionChange(mode.value)}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 36,
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },

  fanWrapper: {
    alignItems: "center",
    width: 174,
  },

  /* Lồng bảo vệ */
  grille: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "transparent",
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  grillRing: {
    position: "absolute",
    borderWidth: 1,
  },
  grillBar: {
    backgroundColor: "rgba(22,133,63,0.46)",
    position: "absolute",
    width: 130,
    height: 1,
  },

  /* Cánh quạt */
  bladeContainer: {
    position: "absolute",
    width: 130,
    height: 130,
    alignItems: "center",
    justifyContent: "center",
  },
  blade: {
    backgroundColor: "#16853F",
    position: "absolute",
    width: 48,
    height: 72,
    // Đầu nhọn phía trên, phình ở dưới — giống cánh quạt thật
    borderTopLeftRadius: 32,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 28,
    top: "50%",
    left: "50%",
    marginLeft: -24,
    marginTop: -36,
    overflow: "hidden",
  },
  bladeHighlight: {
    position: "absolute",
    top: 10,
    left: 6,
    width: 12,
    height: 22,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.30)",
    transform: [{ rotate: "15deg" }],
  },
  hub: {
    backgroundColor: "#16853F",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  hubInner: {
    backgroundColor: "#0F6B31",
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  /* Hộp motor */
  motorBox: {
    width: 48,
    height: 28,
    backgroundColor: "rgba(22,133,63,0.74)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(22,133,63,0.98)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -78,
    zIndex: -1,
  },
  motorRib: {
    width: 30,
    height: 3,
    borderRadius: 2,
    zIndex: -1,
    backgroundColor: "rgba(220,252,231,0.55)",
  },
  screw: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(187,247,208,0.85)",
    borderWidth: 0.5,
    zIndex: -1,
    borderColor: "rgba(22,133,63,0.9)",
  },

  /* Khớp nghiêng */
  tiltJoint: {
    width: 22,
    height: 14,
    backgroundColor: "rgba(22,133,63,0.78)",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(22,133,63,0.98)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: -1,
    marginTop: -2,
  },
  tiltJointBolt: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(220,252,231,0.9)",
    borderWidth: 1,
    zIndex: -1,
    borderColor: "rgba(22,133,63,0.9)",
  },

  /* Cổ */
  neck: {
    width: 14,
    height: 16,
    backgroundColor: "rgba(22,133,63,0.8)",
    borderRadius: 1,
    borderWidth: 1,
    borderColor: "rgba(22,133,63,0.98)",
    marginTop: -1,
    zIndex: -1,
  },

  /* Khớp xoay */
  swivel: {
    width: 26,
    height: 10,
    backgroundColor: "rgba(22,133,63,0.84)",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(22,133,63,0.98)",
    zIndex: -1,
    marginTop: -1,
  },

  /* Cột đứng */
  pole: {
    width: 9,
    height: 56,
    backgroundColor: "rgba(22,133,63,0.88)",
    borderRadius: 1,
    borderWidth: 1,
    borderColor: "rgba(22,133,63,0.98)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -1,
    overflow: "hidden",
    zIndex: -1,
  },
  poleHighlight: {
    width: 3,
    height: 48,
    borderRadius: 2,
    backgroundColor: "rgba(220,252,231,0.38)",
    zIndex: -1,
    marginLeft: -2,
  },

  /* Đế */
  baseMid: {
    width: 52,
    height: 9,
    backgroundColor: "rgba(22,133,63,0.9)",
    borderTopEndRadius: 15,
    borderTopStartRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(22,133,63,1)",
    marginTop: -1,
  },
  baseBot: {
    width: 76,
    height: 9,
    backgroundColor: "rgba(22,133,63,0.98)",
    borderTopEndRadius: 20,
    borderTopStartRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(22,133,63,1)",
    marginTop: -1,
  },

  /* Right panel */
  rightPanel: {
    alignItems: "center",
    gap: 14,
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
  modeGrid: {
    flexDirection: "column",
    gap: 10,
    width: 132,
    alignItems: "stretch",
  },
  modeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(21,128,61,0.7)",
    backgroundColor: "rgba(34,197,94,0.12)",
    alignItems: "center",
  },
  modeBtnActive: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#166534",
  },
  modeBtnTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});

export default FanComponent;
