import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useShop } from "../context/ShopContext";
import { emojiFor, titleCase } from "../theme/categoryThemes";

// ----------------------------------------------------
// CATEGORY GROUPS
// ----------------------------------------------------

const GROUPS = [
  { id: "all", label: "All" },
  { id: "women", label: "Women" },
  { id: "men", label: "Men" },
  { id: "accessories", label: "Accessories" },
  { id: "home", label: "Home" },
];

const SORT_OPTIONS = [
  {
    id: "recommended",
    label: "Recommended",
  },
  {
    id: "most",
    label: "Most products",
  },
  {
    id: "fewest",
    label: "Fewest products",
  },
  {
    id: "az",
    label: "Name A → Z",
  },
  {
    id: "za",
    label: "Name Z → A",
  },
];

// ----------------------------------------------------
// GROUP FILTER
// ----------------------------------------------------

const belongsToGroup = (slug, group) => {
  if (!slug) return false;

  switch (group) {
    case "women":
      return slug.startsWith("womens-");

    case "men":
      return slug.startsWith("mens-");

    case "accessories":
      return [
        "mobile-accessories",
        "sports-accessories",
        "sunglasses",
      ].includes(slug);

    case "home":
      return [
        "furniture",
        "home-decoration",
        "kitchen-accessories",
        "lighting",
      ].includes(slug);

    case "all":
    default:
      return true;
  }
};

// ----------------------------------------------------
// CATEGORY CARD
// ----------------------------------------------------

const CategoryCard = ({
  category,
  productCount,
  isFavorite,
  onFavorite,
  onPress,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 30,
      bounciness: 5,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 25,
      bounciness: 7,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          transform: [{ scale }],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.categoryCard,
          pressed && styles.categoryCardPressed,
        ]}
      >
        {/* TOP ROW */}
        <View style={styles.cardTopRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>CATEGORY</Text>
          </View>

          <TouchableOpacity
            onPress={() => onFavorite(category.slug)}
            activeOpacity={0.7}
            style={styles.favoriteButton}
          >
            <MaterialCommunityIcons
              name={isFavorite ? "heart" : "heart-outline"}
              size={21}
              color={isFavorite ? "#FF4D67" : "#777"}
            />
          </TouchableOpacity>
        </View>

        {/* EMOJI */}
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>
            {emojiFor(category.slug)}
          </Text>
        </View>

        {/* NAME */}
        <Text style={styles.categoryName} numberOfLines={1}>
          {titleCase(category.name || category.slug)}
        </Text>

        {/* PRODUCT COUNT */}
        <View style={styles.countRow}>
          <MaterialCommunityIcons
            name="shopping-outline"
            size={16}
            color="#777"
          />

          <Text style={styles.productCount}>
            {productCount} {productCount === 1 ? "product" : "products"}
          </Text>
        </View>

        {/* BOTTOM */}
        <View style={styles.cardBottomRow}>
          <Text style={styles.exploreText}>Explore category</Text>

          <View style={styles.arrowButton}>
            <MaterialCommunityIcons
              name="arrow-top-right"
              size={19}
              color="#111"
            />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

// ----------------------------------------------------
// MAIN SCREEN
// ----------------------------------------------------

export default function CategoriesScreen({ navigation }) {
  const {
    categories = [],
    allProducts = [],
    selectCategory,
    loading,
    flashToast,
  } = useShop();

  const [activeGroup, setActiveGroup] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [sortVisible, setSortVisible] = useState(false);

  const [favoriteCategories, setFavoriteCategories] = useState([]);

  // --------------------------------------------------
  // LOAD FAVORITES
  // --------------------------------------------------

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const saved = await AsyncStorage.getItem(
          "@favorite_categories"
        );

        if (saved) {
          setFavoriteCategories(JSON.parse(saved));
        }
      } catch (error) {
        console.log("Failed to load favorite categories:", error);
      }
    };

    loadFavorites();
  }, []);

  // --------------------------------------------------
  // SAVE FAVORITES
  // --------------------------------------------------

  const toggleFavorite = async (slug) => {
    try {
      let updatedFavorites;

      if (favoriteCategories.includes(slug)) {
        updatedFavorites = favoriteCategories.filter(
          (item) => item !== slug
        );
      } else {
        updatedFavorites = [
          ...favoriteCategories,
          slug,
        ];
      }

      setFavoriteCategories(updatedFavorites);

      await AsyncStorage.setItem(
        "@favorite_categories",
        JSON.stringify(updatedFavorites)
      );

      if (flashToast) {
        flashToast(
          favoriteCategories.includes(slug)
            ? "Removed from favorites"
            : "Added to favorites"
        );
      }
    } catch (error) {
      console.log("Failed to save category favorite:", error);
    }
  };

  // --------------------------------------------------
  // PRODUCT COUNT BY CATEGORY
  // --------------------------------------------------

  const productCounts = useMemo(() => {
    const counts = {};

    allProducts.forEach((product) => {
      const category = product?.category;

      if (!category) return;

      counts[category] = (counts[category] || 0) + 1;
    });

    return counts;
  }, [allProducts]);

  // --------------------------------------------------
  // FILTER + SEARCH + SORT
  // --------------------------------------------------

  const visibleCategories = useMemo(() => {
    let result = categories.filter((category) =>
      belongsToGroup(category.slug, activeGroup)
    );

    const searchValue = search.trim().toLowerCase();

    if (searchValue) {
      result = result.filter((category) => {
        const name = String(category.name || "").toLowerCase();
        const slug = String(category.slug || "").toLowerCase();

        return (
          name.includes(searchValue) ||
          slug.includes(searchValue)
        );
      });
    }

    result = [...result];

    switch (sortBy) {
      case "most":
        result.sort(
          (a, b) =>
            (productCounts[b.slug] || 0) -
            (productCounts[a.slug] || 0)
        );
        break;

      case "fewest":
        result.sort(
          (a, b) =>
            (productCounts[a.slug] || 0) -
            (productCounts[b.slug] || 0)
        );
        break;

      case "az":
        result.sort((a, b) =>
          String(a.name || a.slug).localeCompare(
            String(b.name || b.slug)
          )
        );
        break;

      case "za":
        result.sort((a, b) =>
          String(b.name || b.slug).localeCompare(
            String(a.name || a.slug)
          )
        );
        break;

      case "recommended":
      default:
        break;
    }

    return result;
  }, [
    categories,
    activeGroup,
    search,
    sortBy,
    productCounts,
  ]);

  // --------------------------------------------------
  // OPEN CATEGORY
  // --------------------------------------------------

  const openCategory = async (slug) => {
    try {
      await selectCategory(slug);

      navigation.navigate("Home");
    } catch (error) {
      console.log("Category navigation error:", error);
    }
  };

  // --------------------------------------------------
  // RESET
  // --------------------------------------------------

  const resetFilters = () => {
    setActiveGroup("all");
    setSearch("");
    setSortBy("recommended");
  };

  // --------------------------------------------------
  // RENDER CARD
  // --------------------------------------------------

  const renderCategory = ({ item }) => {
    const count = productCounts[item.slug] || 0;

    return (
      <CategoryCard
        category={item}
        productCount={count}
        isFavorite={favoriteCategories.includes(item.slug)}
        onFavorite={toggleFavorite}
        onPress={() => openCategory(item.slug)}
      />
    );
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading && categories.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#111" />

        <Text style={styles.loadingText}>
          Loading categories...
        </Text>
      </View>
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.smallTitle}>
            DISCOVER
          </Text>

          <Text style={styles.title}>
            Categories
          </Text>
        </View>

        <View style={styles.categoryIcon}>
          <MaterialCommunityIcons
            name="shape-outline"
            size={25}
            color="#111"
          />
        </View>
      </View>

      {/* SEARCH */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons
          name="magnify"
          size={22}
          color="#777"
        />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search categories..."
          placeholderTextColor="#999"
          style={styles.searchInput}
          returnKeyType="search"
        />

        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch("")}
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={20}
              color="#999"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* GROUP TABS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.groupContainer}
      >
        {GROUPS.map((group) => {
          const active = activeGroup === group.id;

          return (
            <TouchableOpacity
              key={group.id}
              onPress={() => setActiveGroup(group.id)}
              activeOpacity={0.8}
              style={[
                styles.groupPill,
                active && styles.groupPillActive,
              ]}
            >
              <Text
                style={[
                  styles.groupText,
                  active && styles.groupTextActive,
                ]}
              >
                {group.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* FILTER / SORT ROW */}
      <View style={styles.filterRow}>
        <Text style={styles.resultText}>
          {visibleCategories.length} categories
        </Text>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortVisible(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="tune-variant"
            size={18}
            color="#111"
          />

          <Text style={styles.sortButtonText}>
            {SORT_OPTIONS.find(
              (item) => item.id === sortBy
            )?.label || "Sort"}
          </Text>

          <MaterialCommunityIcons
            name="chevron-down"
            size={18}
            color="#111"
          />
        </TouchableOpacity>
      </View>

      {/* ACTIVE SORT */}
      {sortBy !== "recommended" && (
        <View style={styles.activeFilter}>
          <Text style={styles.activeFilterText}>
            Sorted by{" "}
            {
              SORT_OPTIONS.find(
                (item) => item.id === sortBy
              )?.label
            }
          </Text>

          <TouchableOpacity
            onPress={() => setSortBy("recommended")}
          >
            <MaterialCommunityIcons
              name="close"
              size={18}
              color="#555"
            />
          </TouchableOpacity>
        </View>
      )}

      {/* CATEGORY LIST */}
      {visibleCategories.length > 0 ? (
        <FlatList
          data={visibleCategories}
          keyExtractor={(item) =>
            item.slug || item.name
          }
          renderItem={renderCategory}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons
              name="magnify-close"
              size={40}
              color="#777"
            />
          </View>

          <Text style={styles.emptyTitle}>
            No categories found
          </Text>

          <Text style={styles.emptyText}>
            Try another search or reset your filters.
          </Text>

          <TouchableOpacity
            onPress={resetFilters}
            style={styles.resetButton}
            activeOpacity={0.8}
          >
            <Text style={styles.resetButtonText}>
              Reset filters
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* SORT MODAL */}
      <Modal
        visible={sortVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSortVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSortVisible(false)}
        >
          <Pressable
            style={styles.sortSheet}
            onPress={(event) =>
              event.stopPropagation()
            }
          >
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                Sort categories
              </Text>

              <TouchableOpacity
                onPress={() => setSortVisible(false)}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={23}
                  color="#111"
                />
              </TouchableOpacity>
            </View>

            {SORT_OPTIONS.map((option) => {
              const active = sortBy === option.id;

              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => {
                    setSortBy(option.id);
                    setSortVisible(false);
                  }}
                  style={[
                    styles.sortOption,
                    active &&
                      styles.sortOptionActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      active &&
                        styles.sortOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>

                  {active && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={22}
                      color="#111"
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ----------------------------------------------------
// STYLES
// ----------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F5",
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F7F5",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#777",
  },

  // HEADER

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  smallTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#999",
    marginBottom: 4,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#111",
    letterSpacing: -1,
  },

  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },

  // SEARCH

  searchContainer: {
    marginHorizontal: 20,
    height: 52,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 2,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#111",
  },

  // GROUPS

  groupContainer: {
    paddingHorizontal: 20,
    paddingVertical: 17,
    gap: 9,
  },

  groupPill: {
    paddingHorizontal: 17,
    height: 38,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ECECEC",
  },

  groupPillActive: {
    backgroundColor: "#111",
    borderColor: "#111",
  },

  groupText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#666",
  },

  groupTextActive: {
    color: "#FFFFFF",
  },

  // FILTER

  filterRow: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  resultText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#777",
  },

  sortButton: {
    height: 40,
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,

    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },

  sortButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111",
  },

  activeFilter: {
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 13,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#ECECEC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  activeFilterText: {
    fontSize: 12,
    color: "#555",
    fontWeight: "600",
  },

  // LIST

  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 120,
  },

  // CARD

  cardWrapper: {
    marginBottom: 14,
  },

  categoryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,

    shadowColor: "#000",
    shadowOpacity: 0.055,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 3,
  },

  categoryCardPressed: {
    opacity: 0.96,
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  categoryBadge: {
    backgroundColor: "#F2F2F0",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },

  categoryBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#777",
  },

  favoriteButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#F7F7F5",
    alignItems: "center",
    justifyContent: "center",
  },

  emojiContainer: {
    width: 65,
    height: 65,
    borderRadius: 21,
    backgroundColor: "#F7F7F5",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    marginBottom: 13,
  },

  emoji: {
    fontSize: 31,
  },

  categoryName: {
    fontSize: 21,
    fontWeight: "800",
    color: "#111",
    letterSpacing: -0.4,
  },

  countRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
    gap: 6,
  },

  productCount: {
    fontSize: 13,
    color: "#777",
    fontWeight: "600",
  },

  cardBottomRow: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F0F0EE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  exploreText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555",
  },

  arrowButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#F2F2F0",
    alignItems: "center",
    justifyContent: "center",
  },

  // EMPTY STATE

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingBottom: 80,
  },

  emptyIcon: {
    width: 82,
    height: 82,
    borderRadius: 28,
    backgroundColor: "#EDEDEB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
  },

  emptyText: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
    color: "#888",
  },

  resetButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },

  resetButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  // MODAL

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },

  sortSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 35,
  },

  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 5,
    backgroundColor: "#D7D7D7",
    marginBottom: 18,
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  sheetTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#111",
  },

  sortOption: {
    height: 54,
    borderRadius: 15,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  sortOptionActive: {
    backgroundColor: "#F1F1EF",
  },

  sortOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },

  sortOptionTextActive: {
    color: "#111",
    fontWeight: "800",
  },
});