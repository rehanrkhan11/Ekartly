import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useShop } from "../context/ShopContext";
import { emojiFor } from "../theme/categoryThemes";
import ScreenHeader from "../components/ScreenHeader";

export default function CategoriesScreen() {
  const { categories, selectCategory } = useShop();
  const navigation = useNavigation();

  const data = [{ slug: null, name: "All", isAll: true }, ...categories];

  const goHome = (slug) => {
    selectCategory(slug);
    navigation.navigate("Home");
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Shop by category" />
      <FlatList
        data={data}
        keyExtractor={(item) => item.slug || "all"}
        numColumns={3}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.tile} onPress={() => goHome(item.slug)}>
            <Text style={styles.emoji}>{item.isAll ? "✨" : emojiFor(item.slug)}</Text>
            <Text style={styles.label} numberOfLines={2}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f8fafc" },
  grid: { padding: 12 },
  tile: {
    flex: 1, margin: 6, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#f1f5f9",
    paddingVertical: 18, alignItems: "center", gap: 8,
  },
  emoji: { fontSize: 26 },
  label: { fontSize: 11, fontWeight: "800", color: "#475569", textAlign: "center", paddingHorizontal: 4 },
});
