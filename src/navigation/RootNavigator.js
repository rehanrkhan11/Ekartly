import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import BottomTabs from "./BottomTabs";
import LocationScreen from "../screens/LocationScreen";

const Stack = createStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={BottomTabs} />
      <Stack.Screen
        name="Location"
        component={LocationScreen}
        options={{
          presentation: "modal",
        }}
      />
    </Stack.Navigator>
  );
}