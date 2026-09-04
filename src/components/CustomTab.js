import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function CustomTabBar({ state, descriptors, navigation }) {
  // Mapping tabs: 
  // [0] Categories, [1] Wishlist, [2] Home (Center FAB), [3] Cart, [4] Account
  const getIconName = (routeName, isFocused) => {
    switch (routeName) {
      case "Categories":
        return isFocused ? "grid" : "grid-outline";
      case "Wishlist":
        return isFocused ? "bookmark" : "bookmark-outline";
      case "Home":
        return "leaf"; // Center FAB icon
      case "Cart":
        return isFocused ? "bag-handle" : "bag-handle-outline";
      case "Account":
        return isFocused ? "person" : "person-outline";
      default:
        return "square-outline";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Render Floating Center Button (Home)
          if (index === 2) {
            return (
              <View key={route.key} style={styles.centerButtonContainer}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={onPress}
                  style={styles.centerButton}
                >
                  <Ionicons name="leaf" size={26} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            );
          }

          // Standard Tab Items
          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <Ionicons
                name={getIconName(route.name, isFocused)}
                size={22}
                color={isFocused ? "#2D8A56" : "#A0AEC0"}
              />
              {isFocused && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 25,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 10,
    // Soft floating shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#2D8A56",
    marginTop: 4,
  },
  centerButtonContainer: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    top: -20, // Elevates the button above the bar
  },
  centerButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#2D8A56", // Main green accent color
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2D8A56",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 4,
    borderColor: "#F4F6F8", // Matching your screen background color
  },
});