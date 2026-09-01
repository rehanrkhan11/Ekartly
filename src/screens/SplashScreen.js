import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import ParticleField from "../components/ParticleField";
import { THEMES } from "../theme/categoryThemes";
import { useShop } from "../context/ShopContext";

export default function SplashScreen({ navigation }) {
  const { bootstrap } = useShop();
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dot0 = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    const bounce = (val, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: -6, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 300, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ])
      );
    bounce(dot0, 0).start();
    bounce(dot1, 150).start();
    bounce(dot2, 300).start();

    let alive = true;
    (async () => {
      const start = Date.now();
      await bootstrap();
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 1100 - elapsed);
      setTimeout(() => {
        if (alive) navigation.replace("Main");
      }, remaining);
    })();

    return () => { alive = false; };
  }, []);

  return (
    <LinearGradient colors={[THEMES.snow.bg[0], THEMES.snow.bg[1], "#3a1f7a"]} style={styles.container}>
      <ParticleField theme={THEMES.snow} dense />
      <Animated.View style={{ alignItems: "center", opacity, transform: [{ scale }] }}>
        <View style={styles.logo}>
          <Ionicons name="bag-handle" size={40} color="#1c4fa3" />
        </View>
        <Text style={styles.title}>Kartly</Text>
        <Text style={styles.tagline}>every category, its own weather</Text>
      </Animated.View>

      <View style={styles.dots}>
        {[dot0, dot1, dot2].map((d, i) => (
          <Animated.View key={i} style={[styles.dot, { transform: [{ translateY: d }] }]} />
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  logo: {
    width: 84, height: 84, borderRadius: 24, backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center", transform: [{ rotate: "-6deg" }],
    shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  title: { color: "#fff", fontSize: 32, fontWeight: "800", marginTop: 16, letterSpacing: 0.5 },
  tagline: { color: "#c7defd", fontSize: 13, marginTop: 4 },
  dots: { position: "absolute", bottom: 70, flexDirection: "row", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.85)" },
});
