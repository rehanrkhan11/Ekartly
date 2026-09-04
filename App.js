import React from "react";
import { StatusBar, StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { ShopProvider, useShop } from "./src/context/ShopContext";

// Navigation
import RootNavigator from "./src/navigation/RootNavigator";

// Global Overlay Component
import ProductModal from "./src/components/ProductModal";

function GlobalToast() {
  const { toast, theme } = useShop();
  if (!toast) return null;

  return (
    <View
      pointerEvents="none"
      style={[styles.toastBanner, { backgroundColor: theme?.bg?.[1] || "#0f172a" }]}
    >
      <Text style={styles.toastText}>{toast}</Text>
    </View>
  );
}

export default function App() {
  return (
    <ShopProvider>
      <NavigationContainer>
        <StatusBar barStyle="light-content" />
        <RootNavigator />
        <ProductModal />
        <GlobalToast />
      </NavigationContainer>
    </ShopProvider>
  );
}

const styles = StyleSheet.create({
  toastBanner: {
    position: "absolute",
    // ==========================================
    // UPDATED HERE: Increased bottom spacing to 110
    // so toasts float above the new navigation bar
    // ==========================================
    bottom: 110,
    // ==========================================
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    zIndex: 9999,
  },
  toastText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 12,
  },
});