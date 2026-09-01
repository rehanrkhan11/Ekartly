import React from "react";
import { StatusBar, StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { ShopProvider, useShop } from "./src/context/ShopContext";

// Screens
import HomeScreen from "./src/screens/HomeScreen";
import CartScreen from "./src/screens/CartScreen";
import WishlistScreen from "./src/screens/WishlistScreen";
import AccountScreen from "./src/screens/AccountScreen";

// Global Overlay Component
import ProductModal from "./src/components/ProductModal";

const Tab = createBottomTabNavigator();

function GlobalToast() {
  const { toast, theme } = useShop();
  if (!toast) return null;

  return (
    <View 
      pointerEvents="none" 
      style={[styles.toastBanner, { backgroundColor: theme.bg?.[1] || "#0f172a" }]}
    >
      <Text style={styles.toastText}>{toast}</Text>
    </View>
  );
}

function MainTabs() {
  const { cartCount, wishlistItems, theme } = useShop();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.bg?.[1] || "#0f172a",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Wishlist") {
            iconName = focused ? "heart" : "heart-outline";
          } else if (route.name === "Cart") {
            iconName = focused ? "bag" : "bag-outline";
          } else if (route.name === "Account") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size - 2} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{
          tabBarBadge: wishlistItems?.length > 0 ? wishlistItems.length : null,
          tabBarBadgeStyle: styles.badgeStyle,
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarBadge: cartCount > 0 ? cartCount : null,
          tabBarBadgeStyle: styles.badgeStyle,
        }}
      />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <ShopProvider>
      <NavigationContainer>
        <StatusBar barStyle="light-content" />
        <MainTabs />
        <ProductModal />
        <GlobalToast />
      </NavigationContainer>
    </ShopProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  badgeStyle: {
    backgroundColor: "#f59e0b",
    color: "#0f172a",
    fontSize: 10,
    fontWeight: "800",
  },
  toastBanner: {
    position: "absolute",
    bottom: 75,
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