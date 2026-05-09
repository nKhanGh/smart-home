import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import RootSiblings from "react-native-root-siblings";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/FontAwesome5";

const FA = Icon as any;

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "info" | "warning";

export type ToastPayload = {
  type?: ToastType;
  text1: string;
  text2?: string;
  duration?: number;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  ToastType,
  { bg: string; border: string; titleColor: string; subtitleColor: string; icon: string }
> = {
  success: { bg: "#ECFDF5", border: "#16A34A", titleColor: "#14532D", subtitleColor: "#166534", icon: "check-circle" },
  info:    { bg: "#EFF6FF", border: "#2563EB", titleColor: "#1E3A8A", subtitleColor: "#1D4ED8", icon: "info-circle" },
  warning: { bg: "#FFFBEB", border: "#D97706", titleColor: "#78350F", subtitleColor: "#92400E", icon: "exclamation-circle" },
  error:   { bg: "#FEF2F2", border: "#DC2626", titleColor: "#7F1D1D", subtitleColor: "#991B1B", icon: "times-circle" },
};

// Listener để các Modal đăng ký nhận toast
let listener: ((payload: ToastPayload & { type: ToastType }) => void) | null = null;

export const ToastEmitter = {
  register(fn: typeof listener) { listener = fn; },
  unregister() { listener = null; },
}

// ─── ToastBanner ─────────────────────────────────────────────────────────────

export const ToastBanner = ({
  type,
  text1,
  text2,
  onDismiss,
}: {
  type: ToastType;
  text1: string;
  text2?: string;
  onDismiss: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 200,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  };

  const { bg, border, titleColor, subtitleColor, icon } = TYPE_CONFIG[type];

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { top: insets.top + 12, opacity, transform: [{ translateY }] },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.card, { backgroundColor: bg, borderLeftColor: border }]}>
        <FA name={icon} size={20} color={border} style={styles.icon} solid />
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
            {text1}
          </Text>
          {text2 ? (
            <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={2}>
              {text2}
            </Text>
          ) : null}
        </View>
        <Pressable onPress={dismiss} hitSlop={8} style={styles.closeBtn}>
          <FA name="times" size={14} color="#9CA3AF" />
        </Pressable>
      </View>
    </Animated.View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 99999,
    elevation: 99999,
    pointerEvents: "box-none",
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
  },
  icon: { marginRight: 12 },
  textWrap: { flex: 1 },
  title: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
    marginTop: 1,
  },
  closeBtn: {
    marginLeft: 10,
    padding: 4,
  },
});

// ─── Public API ───────────────────────────────────────────────────────────────

export const Toast = {
  show({ type = "info", text1, text2, duration = 3000 }: ToastPayload) {
    let sibling: InstanceType<typeof RootSiblings> | null = null;

    const dismiss = () => {
      sibling?.destroy();
      sibling = null;
    };

    sibling = new RootSiblings(
      <ToastBanner
        type={type}
        text1={text1}
        text2={text2}
        onDismiss={dismiss}
      />
    );

    setTimeout(dismiss, duration);
  },
};