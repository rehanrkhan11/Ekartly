import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SplashScreen from "../screens/SplashScreen";
import BottomTabs from "./BottomTabs";
import ProductModal from "../components/ProductModal";
import Toast from "../components/Toast";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Main" component={BottomTabs} />
      </Stack.Navigator>
      {/* Rendered above all screens so any tab can open a product or show a toast */}
      <ProductModal />
      <Toast />
    </>
  );
}
