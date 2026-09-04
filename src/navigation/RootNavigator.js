import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

// Import your complete 5-tab bottom bar component
import BottomTabs from "./BottomTabs";

// Import any detail screens that should cover the bottom tab bar when opened
import ProductModal from "../components/ProductModal";

const Stack = createStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Set BottomTabs as the main screen */}
      <Stack.Screen name="MainTabs" component={BottomTabs} />
    </Stack.Navigator>
  );
}