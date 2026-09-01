import React from "react";
import { StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useShop } from "../context/ShopContext";

export default function ScreenHeader({ title }) {
  const { theme } = useShop();
  return (
    <LinearGradient colors={theme.bg} style={styles.grad}>
      <SafeAreaView edges={["top"]}>
        <Text style={styles.title}>{title}</Text>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  grad: { paddingBottom: 16 },
  title: { color: "#fff", fontSize: 20, fontWeight: "800", paddingHorizontal: 18, paddingTop: 8 },
});
