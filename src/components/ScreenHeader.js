import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useShop } from "../context/ShopContext";

export default function ScreenHeader({ title, showBack = false, onBack, rightElement }) {
  const { theme } = useShop();

  return (
    <LinearGradient colors={theme?.bg || ["#1e3a8a", "#0f172a"]} style={styles.grad}>
      <SafeAreaView edges={["top"]}>
        <View style={styles.container}>
          <View style={styles.leftRow}>
            {showBack && (
              <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={8}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
            )}
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          </View>

          {rightElement && <View style={styles.rightWrap}>{rightElement}</View>}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  grad: {
    paddingBottom: 16,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
    flex: 1,
  },
  rightWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
});