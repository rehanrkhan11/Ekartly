import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, StyleSheet, Text, View, Easing } from "react-native";

const { width } = Dimensions.get("window");

function Particle({ left, size, duration, delay, drift, opacity, symbol, color }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-30, 260] });
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, drift] });
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const fade = progress.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, opacity, opacity, 0] });

  return (
    <Animated.Text
      style={{
        position: "absolute",
        left,
        top: 0,
        fontSize: size,
        color,
        opacity: fade,
        transform: [{ translateY }, { translateX }, { rotate }],
      }}
    >
      {symbol}
    </Animated.Text>
  );
}

export default function ParticleField({ theme, dense = false, style }) {
  const particles = useMemo(() => {
    const n = dense ? 20 : 10;
    return Array.from({ length: n }, (_, i) => ({
      id: i,
      left: Math.random() * (width - 24),
      size: 10 + Math.random() * 12,
      duration: 5000 + Math.random() * 4000,
      delay: Math.random() * 3000,
      drift: (Math.random() - 0.5) * 50,
      opacity: 0.35 + Math.random() * 0.45,
    }));
  }, [theme.name, dense]);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      {particles.map((p) => (
        <Particle key={p.id} {...p} symbol={theme.symbol} color={theme.glow} />
      ))}
    </View>
  );
}
