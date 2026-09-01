import React from "react";
import { ScrollView, Text, TouchableOpacity, StyleSheet, View } from "react-native";
import { useShop } from "../context/ShopContext";
import { emojiFor, themeForCategory } from "../theme/categoryThemes";

/**
 * Mirrors the reference screenshot: the active category renders as a raised
 * white rounded-top card that pokes below the gradient header into the
 * content beneath it. Inactive tabs stay flat, translucent pills on the
 * gradient. Selecting a tab re-fetches products for that category and
 * repaints the whole app's theme (header gradient + particle field).
 */
export default function CategoryTabs() {
  const { categories, activeCategory, selectCategory } = useShop();

  const tabs = [{ slug: null, name: "All", isAll: true }, ...categories];

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {tabs.map((c) => {
          const active = activeCategory === c.slug;
          const tint = c.slug ? themeForCategory(c.slug).bg[1] : themeForCategory(null).bg[1];
          return (
            <TouchableOpacity
              key={c.slug || "all"}
              activeOpacity={0.85}
              onPress={() => selectCategory(c.slug)}
              style={[styles.tab, active ? styles.tabActive : styles.tabInactive]}
            >
              <Text style={styles.emoji}>{c.isAll ? "✨" : emojiFor(c.slug)}</Text>
              <Text
                style={[
                  styles.label,
                  active ? { color: tint, fontWeight: "800" } : styles.labelInactive,
                ]}
                numberOfLines={1}
              >
                {c.isAll ? "All" : c.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    // negative margin lets the active pill's rounded top overlap the
    // content area below, matching the raised-card look in the screenshot
    marginBottom: -14,
    zIndex: 5,
  },
  row: {
    paddingHorizontal: 16,
    alignItems: "flex-end",
    gap: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 18,
  },
  tabInactive: {
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  tabActive: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 22,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  emoji: { fontSize: 14 },
  label: { fontSize: 13 },
  labelInactive: { color: "#ffffff", fontWeight: "700" },
});
