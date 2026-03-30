import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Easing,
  ViewStyle,
} from 'react-native';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type LoadingVariant = 'orbital' | 'pulse' | 'wave' | 'morph' | 'spinner';

interface LoadingSpinnerProps {
  /** Kích thước tổng thể của component (px). Mặc định: 64 */
  size?: number;
  /** Màu chính (hex / rgb / named). Mặc định: '#6C63FF' */
  color?: string;
  /** Biến thể animation. Mặc định: 'orbital' */
  variant?: LoadingVariant;
  /** Style tuỳ chỉnh cho container ngoài */
  style?: ViewStyle;
}

// ─────────────────────────────────────────────
// Orbital – 3 vòng quỹ đạo lồng nhau
// ─────────────────────────────────────────────

const OrbitalLoader: React.FC<{ size: number; color: string }> = ({ size, color }) => {
  const rotA = useRef(new Animated.Value(0)).current;
  const rotB = useRef(new Animated.Value(0)).current;
  const rotC = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = (anim: Animated.Value, duration: number, reverse = false) =>
      Animated.loop(
        Animated.timing(anim, {
          toValue: reverse ? -1 : 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

    spin(rotA, 1200);
    spin(rotB, 1800, true);
    spin(rotC, 2600);
  }, []);

  const toRad = (anim: Animated.Value) =>
    anim.interpolate({ inputRange: [-1, 1], outputRange: ['-360deg', '360deg'] });

  const dot = (radius: number) => {
    const pos = radius - size * 0.06;
    return {
      width: size * 0.12,
      height: size * 0.12,
      borderRadius: size * 0.06,
      backgroundColor: color,
      position: 'absolute' as const,
      top: size / 2 - size * 0.06,
      left: pos,
    };
  };

  const ring = (pct: number, opacity: number) => ({
    width: size * pct,
    height: size * pct,
    borderRadius: size * pct / 2,
    borderWidth: size * 0.025,
    borderColor: `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
    position: 'absolute' as const,
    top: size * (1 - pct) / 2,
    left: size * (1 - pct) / 2,
  });

  return (
    <View style={{ width: size, height: size }}>
      {/* Ring C */}
      <Animated.View style={[ring(1, 0.15), { transform: [{ rotate: toRad(rotC) }] }]}>
        <View style={dot(size * 1 - size * 0.06)} />
      </Animated.View>

      {/* Ring B */}
      <Animated.View style={[ring(0.72, 0.3), { transform: [{ rotate: toRad(rotB) }] }]}>
        <View style={dot(size * 0.72 - size * 0.06)} />
      </Animated.View>

      {/* Ring A */}
      <Animated.View style={[ring(0.44, 0.5), { transform: [{ rotate: toRad(rotA) }] }]}>
        <View style={dot(size * 0.44 - size * 0.06)} />
      </Animated.View>

      {/* Core */}
      <View
        style={{
          width: size * 0.16,
          height: size * 0.16,
          borderRadius: size * 0.08,
          backgroundColor: color,
          position: 'absolute',
          top: size * 0.42,
          left: size * 0.42,
        }}
      />
    </View>
  );
};

// ─────────────────────────────────────────────
// Pulse – hình tròn đập nhịp tim
// ─────────────────────────────────────────────

const PulseLoader: React.FC<{ size: number; color: string }> = ({ size, color }) => {
  const anims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    anims.forEach((anim, i) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(i * 400),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    });
  }, []);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
            transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) }],
          }}
        />
      ))}
      <View
        style={{
          width: size * 0.28,
          height: size * 0.28,
          borderRadius: size * 0.14,
          backgroundColor: color,
        }}
      />
    </View>
  );
};

// ─────────────────────────────────────────────
// Wave – 5 thanh nhảy sóng
// ─────────────────────────────────────────────

const WaveLoader: React.FC<{ size: number; color: string }> = ({ size, color }) => {
  const bars = 5;
  const anims = Array.from({ length: bars }, () => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    anims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 100),
          Animated.timing(anim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  const barW = size * 0.1;
  const gap = (size - bars * barW) / (bars - 1);

  return (
    <View style={{ width: size, height: size, flexDirection: 'row', alignItems: 'center' }}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={{
            width: barW,
            height: size * 0.6,
            marginLeft: i === 0 ? 0 : gap,
            borderRadius: barW / 2,
            backgroundColor: color,
            opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
            transform: [
              {
                scaleY: anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
};

// ─────────────────────────────────────────────
// Morph – hình vuông biến dạng liên tục
// ─────────────────────────────────────────────

const MorphLoader: React.FC<{ size: number; color: string }> = ({ size, color }) => {
  const progress = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1800,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      })
    ).start();

    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const borderRadius = progress.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [
      size * 0.08,
      size * 0.35,
      size * 0.5,
      size * 0.35,
      size * 0.08,
    ],
  });

  const scale = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.8, 1],
  });

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const s = size * 0.62;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          width: s,
          height: s,
          backgroundColor: color,
          borderRadius,
          transform: [{ rotate }, { scale }],
        }}
      />
    </View>
  );
};

// ─── Spinner – vòng tròn xoay đơn giản ───────────────────────────

const SpinnerLoader: React.FC<{ size: number; color: string }> = ({ size, color }) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const thickness = Math.max(2, size * 0.08);

  return (
    <View style={{ width: size, height: size }}>
      {/* Track (vòng nền mờ) */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: thickness,
          borderColor: `${color}28`,
          position: 'absolute',
        }}
      />
      {/* Arc xoay */}
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: thickness,
          borderColor: 'transparent',
          borderTopColor: color,
          transform: [{ rotate }],
        }}
      />
    </View>
  );
};

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────

/**
 * LoadingSpinner – component loading đẹp, có thể tuỳ chỉnh kích thước.
 *
 * @example
 * // Mặc định
 * <LoadingSpinner />
 *
 * // Tùy chỉnh
 * <LoadingSpinner size={96} color="#FF6B6B" variant="pulse" />
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 64,
  color = '#6C63FF',
  variant = 'orbital',
  style,
}) => {
  const renderVariant = () => {
    switch (variant) {
      case 'spinner':
        return <SpinnerLoader size={size} color={color} />;
      case 'pulse':
        return <PulseLoader size={size} color={color} />;
      case 'wave':
        return <WaveLoader size={size} color={color} />;
      case 'morph':
        return <MorphLoader size={size} color={color} />;
      case 'orbital':
      default:
        return <OrbitalLoader size={size} color={color} />;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {renderVariant()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LoadingSpinner;

export { OrbitalLoader, PulseLoader, WaveLoader, MorphLoader };
export type { LoadingSpinnerProps, LoadingVariant };