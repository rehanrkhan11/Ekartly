import React, { useState, useMemo } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Image,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useShop } from "../context/ShopContext";
import { emojiFor, themeForCategory, titleCase } from "../theme/categoryThemes";
import ScreenHeader from "../components/ScreenHeader";

// Preset pastel card backgrounds matching the design UI
const PASTEL_COLORS = [
  "#FFECD9", // Light Warm Orange
  "#FFE5EC", // Light Pink/Peach
  "#E8EAFF", // Soft Lavender/Purple
  "#E6F7FF", // Light Sky Blue
  "#FEF9C3", // Light Pastel Yellow
  "#DCFCE7", // Soft Mint Green
];

const MAIN_PILLS = [
  { id: "all", label: "All", icon: "✨" },
  { id: "women", label: "Women", icon: "👗" },
  { id: "men", label: "Men", icon: "👔" },
  { id: "accessories", label: "Accessories", icon: "🎧" },
  { id: "home", label: "Home", icon: "🏺" },
];

export default function CategoriesScreen() {
  const { categories, selectCategory } = useShop();
  const navigation = useNavigation();
  const [activePill, setActivePill] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = useMemo(() => {
    let result = categories;
    if (activePill !== "all") {
      result = result.filter((c) =>
        c.slug.toLowerCase().includes(activePill.toLowerCase())
      );
    }
    if (searchQuery.trim()) {
      result = result.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
      );
    }
    return result;
  }, [categories, activePill, searchQuery]);

  const goHome = (slug) => {
    selectCategory(slug);
    navigation.navigate("Home");
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search category or item..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterIcon}>⚡</Text>
        </TouchableOpacity>
      </View>

      {/* Top Shop By Category Heading */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Shop By Category</Text>
        <TouchableOpacity onPress={() => goHome(null)}>
          <Text style={styles.seeAllText}>See All ↗</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Pill Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillContainer}
      >
        {MAIN_PILLS.map((pill) => {
          const isActive = activePill === pill.id;
          return (
            <TouchableOpacity
              key={pill.id}
              style={[styles.pill, isActive && styles.activePill]}
              onPress={() => setActivePill(pill.id)}
            >
              <Text style={styles.pillIcon}>{pill.icon}</Text>
              <Text style={[styles.pillText, isActive && styles.activePillText]}>
                {pill.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderCard = ({ item, index }) => {
    const cardBg = PASTEL_COLORS[index % PASTEL_COLORS.length];

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: cardBg }]}
        activeOpacity={0.88}
        onPress={() => goHome(item.slug)}
      >
        {/* Rating Badge */}
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>⭐ 4.9</Text>
        </View>

        {/* Favorite Heart Button */}
        <TouchableOpacity style={styles.heartBtn}>
          <Text style={styles.heartIcon}>♡</Text>
        </TouchableOpacity>

        {/* Center Content / Emoji Preview */}
        <View style={styles.cardVisualContainer}>
          <Text style={styles.cardEmoji}>{emojiFor(item.slug)}</Text>
        </View>

        {/* Card Footer Details */}
        <View style={styles.cardFooter}>
          <View style={styles.cardTitleCol}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {titleCase(item.name)}
            </Text>
            <Text style={styles.cardPrice}>$28.00</Text>
          </View>
          <View style={styles.cartBtn}>
            <Text style={styles.cartIcon}>🛍️</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Category" />
      <FlatList
        data={filteredCategories}
        keyExtractor={(item) => item.slug}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        renderItem={renderCard}
        columnWrapperStyle={styles.columnWrapper}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  gridContainer: {
    paddingHorizontal: 16,
    paddingBottom: 110, // Leaves clearance for the floating bottom bar
  },
  headerContainer: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#0F172A",
  },
  filterBtn: {
    padding: 6,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
  },
  filterIcon: {
    fontSize: 14,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563EB",
  },
  pillContainer: {
    gap: 8,
    paddingBottom: 6,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
  },
  activePill: {
    backgroundColor: "#2563EB", // Bright blue active pill
  },
  pillIcon: {
    fontSize: 14,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  activePillText: {
    color: "#FFFFFF",
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  card: {
    width: "48%",
    height: 210,
    borderRadius: 24,
    padding: 12,
    justifyContent: "space-between",
    position: "relative",
  },
  ratingBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#1E293B",
  },
  heartBtn: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  heartIcon: {
    fontSize: 14,
    color: "#EF4444",
  },
  cardVisualContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  cardEmoji: {
    fontSize: 54,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cardTitleCol: {
    flex: 1,
    paddingRight: 4,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },
  cardPrice: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 2,
  },
  cartBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
  cartIcon: {
    fontSize: 12,
  },
});