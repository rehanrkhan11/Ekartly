import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const TAB_ICONS = {
  Home: { active: "home", inactive: "home-outline" },
  Setting: { active: "settings", inactive: "settings-outline" },
  Floor: { active: "layers", inactive: "layers-outline" },
  Devices: { active: "grid", inactive: "grid-outline" },
};

export default function FloatingTabBar({
  state,
  descriptors,
  navigation,
  translateY = new Animated.Value(0), // Passed from parent or default to 0
}) {
  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel ?? options.title ?? route.name;
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

          const iconConfig = TAB_ICONS[route.name] || {
            active: "square",
            inactive: "square-outline",
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              {isFocused && (
                <View style={styles.activeSparkle}>
                  <Ionicons name="sparkles" size={10} color="#f97316" />
                </View>
              )}

              <Ionicons
                name={isFocused ? iconConfig.active : iconConfig.inactive}
                size={20}
                color={isFocused ? "#f97316" : "#94a3b8"}
              />

              <Text
                style={[
                  styles.tabLabel,
                  { color: isFocused ? "#f97316" : "#94a3b8" },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
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
    backgroundColor: "#ffffff",
    borderRadius: 35,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 8,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    position: "relative",
    paddingTop: 6,
  },
  activeSparkle: {
    position: "absolute",
    top: -4,
    alignSelf: "center",
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
  },
});