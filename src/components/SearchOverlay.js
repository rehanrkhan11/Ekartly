import React, { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useShop } from "../context/ShopContext";
import { inr } from "../utils/format";

const QUICK_SUGGESTIONS = ["Sneakers", "Headphones", "Watch", "T-Shirt", "Jacket", "Backpack"];
const PAGE_SIZE = 8; // Controls how many items load per batch

// --- String Normalization Utility ---
function normalizeText(str) {
  if (!str) return "";
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Accent strip
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")     // Punctuation & symbols strip
    .replace(/\s+/g, " ")             // Collapse extra spaces
    .trim();
}

// --- Levenshtein Distance Algorithm ---
function getLevenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// --- Dynamic Fuzzy Tolerance ---
function getMaxAllowedDistance(wordLength) {
  if (wordLength <= 3) return 0; // Short words must match exactly
  if (wordLength <= 5) return 1; // 1 typo allowed
  if (wordLength <= 8) return 2; // 2 typos allowed
  return 3;                      // 3 typos allowed
}

// --- Multi-Tier Weighted Scoring ---
function getFieldTokenScore(token, targetRawValue, fieldWeight) {
  if (!targetRawValue) return 0;

  const raw = String(targetRawValue).trim();
  const norm = normalizeText(raw);

  if (!norm) return 0;

  // 1. Exact Match (Raw String Match)
  if (raw === token) {
    return 100 * fieldWeight;
  }

  // 2. Case-Insensitive Exact Match
  if (raw.toLowerCase() === token) {
    return 90 * fieldWeight;
  }

  // 3. Normalized Exact Match
  if (norm === token) {
    return 80 * fieldWeight;
  }

  // 4. Word Boundary / Substring Match
  if (norm.includes(token)) {
    const words = norm.split(" ");
    const isWordStart = words.some((w) => w.startsWith(token));
    return (isWordStart ? 65 : 50) * fieldWeight;
  }

  // 5. Fuzzy / Misspelling Match
  const targetWords = norm.split(" ").filter(Boolean);
  let bestFuzzyScore = 0;

  for (const word of targetWords) {
    if (word.includes(token) || token.includes(word)) {
      const subScore = 40 * fieldWeight;
      if (subScore > bestFuzzyScore) bestFuzzyScore = subScore;
      continue;
    }

    const dist = getLevenshteinDistance(token, word);
    const maxDist = getMaxAllowedDistance(token.length);

    if (dist <= maxDist) {
      const matchScore = (35 - dist * 8) * fieldWeight;
      if (matchScore > bestFuzzyScore) {
        bestFuzzyScore = matchScore;
      }
    }
  }

  return bestFuzzyScore;
}

// Calculate cumulative score across all metadata fields
function calculateProductScore(item, queryStr) {
  const normQuery = normalizeText(queryStr);
  if (!normQuery) return 0;

  const queryTokens = normQuery.split(" ").filter(Boolean);
  if (queryTokens.length === 0) return 0;

  const fields = [
    { value: item.name || item.title || item.label, weight: 1.0 },
    { value: item.brand || item.vendor, weight: 0.8 },
    { value: item.category || item.cat || item.type, weight: 0.6 },
    { value: item.description || item.desc, weight: 0.3 },
  ];

  let totalProductScore = 0;

  for (const token of queryTokens) {
    let bestScoreForToken = 0;

    for (const { value, weight } of fields) {
      if (!value) continue;
      const score = getFieldTokenScore(token, value, weight);
      if (score > bestScoreForToken) {
        bestScoreForToken = score;
      }
    }

    if (bestScoreForToken < 10) {
      return 0; 
    }

    totalProductScore += bestScoreForToken;
  }

  return totalProductScore;
}

export default function SearchOverlay({ visible, onClose, navigation }) {
  const shopContext = useShop();

  // Safely fallback to allProducts master inventory first
  const rawProducts = useMemo(() => {
    if (Array.isArray(shopContext?.allProducts) && shopContext.allProducts.length > 0) {
      return shopContext.allProducts;
    }
    return shopContext?.products || [];
  }, [shopContext]);

  const theme = shopContext?.theme;
  const setSelectedProduct = shopContext?.setSelectedProduct;

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(false);

  // --- Pagination State ---
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const primaryColor = theme?.bg?.[1] || "#0f172a";

  const categories = useMemo(() => {
    if (!Array.isArray(rawProducts) || rawProducts.length === 0) return ["All"];
    const cats = Array.from(
      new Set(rawProducts.map((p) => p?.category || p?.cat || p?.type).filter(Boolean))
    );
    return ["All", ...cats];
  }, [rawProducts]);


  function capitalizeWord(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

  // Priority-based ranked products pipeline
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(rawProducts) || rawProducts.length === 0) return [];
    if (!query.trim() && selectedCategory === "All") return [];

    // Category filter
    const categoryFiltered = rawProducts.filter((item) => {
      if (selectedCategory === "All") return true;
      const itemCat = normalizeText(item?.category || item?.cat || item?.type || "");
      return itemCat === normalizeText(selectedCategory);
    });

    if (!query.trim()) {
      return categoryFiltered;
    }

    // Score each item, filter unmapped ones, and sort by highest priority score
    return categoryFiltered
      .map((item) => ({
        item,
        score: calculateProductScore(item, query),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item);
  }, [query, selectedCategory, rawProducts]);

  // Paginated visible items subset
  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const handleQueryChange = (text) => {
    setQuery(text);
    setVisibleCount(PAGE_SIZE); // Reset pagination on new search
    setLoading(true);
    setTimeout(() => setLoading(false), 100);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setVisibleCount(PAGE_SIZE); // Reset pagination on category change
  };

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  const handleSelectProduct = (product) => {
    Keyboard.dismiss();
    onClose();
    if (setSelectedProduct) {
      setSelectedProduct(product);
    }
  };

  const handleClear = () => {
    setQuery("");
    setSelectedCategory("All");
    setVisibleCount(PAGE_SIZE);
  };

  if (!visible) return null;

  const hasMore = visibleCount < filteredProducts.length;

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <SafeAreaView style={styles.container}>
        {/* Top Floating Search Header */}
        <View style={styles.headerContainer}>
          <View style={styles.searchBar}>
            <TouchableOpacity onPress={onClose} style={styles.iconBtn} hitSlop={8}>
              <Ionicons name="arrow-back" size={22} color="#334155" />
            </TouchableOpacity>
            

            <TextInput
              style={styles.input}
              placeholder="Search products, brands, categories..."
              placeholderTextColor="#94a3b8"
              value={query}
              onChangeText={handleQueryChange}
              autoFocus
              returnKeyType="search"
            />

            {loading ? (
              <ActivityIndicator size="small" color={primaryColor} style={{ marginRight: 6 }} />
            ) : query.length > 0 ? (
              <TouchableOpacity onPress={handleClear} style={styles.iconBtn} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Category Filter Chips */}
          {categories.length > 1 && (
            <FlatList
              horizontal
              data={categories}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
              renderItem={({ item }) => {
                const active = selectedCategory === item;
                return (
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      active && { backgroundColor: primaryColor, borderColor: primaryColor },
                    ]}
                    onPress={() => handleCategorySelect(item)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>

        {/* Results Body */}
        <View style={styles.body}>
          {!query.trim() && selectedCategory === "All" ? (
            /* Popular Searches State */
            <View style={styles.suggestionContainer}>
              <View style={styles.suggestionHeader}>
                <Ionicons name="trending-up" size={18} color={primaryColor} />
                <Text style={styles.suggestionTitle}>Popular Searches</Text>
              </View>

              <View style={styles.tagWrap}>
                {QUICK_SUGGESTIONS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.suggestionTag}
                    onPress={() => handleQueryChange(item)}
                  >
                    <Ionicons name="search-outline" size={14} color="#64748b" />
                    <Text style={styles.tagText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            /* Fuzzy Results List with Controlled Pagination */
            <FlatList
              data={displayedProducts}
              keyExtractor={(item, index) =>
                item.id?.toString() || item._id?.toString() || index.toString()
              }
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.resultsList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const itemName = item.name || item.title || item.label || "Unnamed Product";
                const itemCat = item.category || item.cat || item.type || "General";
                const itemPrice = item.price || item.cost || 0;
                const itemImage =
                  item.image || item.img || item.thumbnail || "https://via.placeholder.com/150";

                return (
                  <TouchableOpacity
                    style={styles.productCard}
                    activeOpacity={0.7}
                    onPress={() => handleSelectProduct(item)}
                  >
                    <Image source={{ uri: itemImage }} style={styles.productImg} />

                    <View style={styles.productInfo}>
                      <Text style={styles.productCategory}>{itemCat}</Text>
                      <Text style={styles.productName} numberOfLines={1}>
                        {itemName}
                      </Text>
                      <Text style={styles.productPrice}>
                        {typeof inr === "function" ? inr(itemPrice) : `₹${itemPrice}`}
                      </Text>
                    </View>
                    

                    <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                  </TouchableOpacity>
                );
              }}
              /* Pagination Footer Component */
              ListFooterComponent={
                hasMore ? (
                  <View style={styles.paginationFooter}>
                    <Text style={styles.counterText}>
                      Showing {displayedProducts.length} of {filteredProducts.length} products
                    </Text>

                    <TouchableOpacity
                      style={[styles.showMoreBtn, { backgroundColor: primaryColor }]}
                      onPress={handleShowMore}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.showMoreBtnText}>Show More</Text>
                      <Ionicons name="chevron-down" size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                ) : displayedProducts.length > 0 ? (
                  <Text style={styles.endText}>Showing all {filteredProducts.length} results</Text>
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={48} color="#cbd5e1" />
                  <Text style={styles.emptyTitle}>No products found</Text>
                  <Text style={styles.emptySub}>
                    {rawProducts.length === 0
                      ? "Loading products inventory..."
                      : `We couldn't find anything matching "${query}".`}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  headerContainer: {
    backgroundColor: "#ffffff",
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    elevation: 3,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 14,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: { flex: 1, fontSize: 14, color: "#0f172a", marginLeft: 8, paddingVertical: 4 },
  iconBtn: { padding: 4 },
  categoryList: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  chipText: { fontSize: 12, fontWeight: "600", color: "#64748b" },
  chipTextActive: { color: "#ffffff", fontWeight: "700" },
  body: { flex: 1 },
  suggestionContainer: { padding: 20 },
  suggestionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  suggestionTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a" },
  tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  suggestionTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  tagText: { fontSize: 13, color: "#334155", fontWeight: "500" },
  resultsList: { padding: 16, gap: 10 },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  productImg: { width: 52, height: 52, borderRadius: 10, backgroundColor: "#f1f5f9" },
  productInfo: { flex: 1, marginLeft: 12 },
  productCategory: { fontSize: 10, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" },
  productName: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginVertical: 2 },
  productPrice: { fontSize: 13, fontWeight: "800", color: "#059669" },

  // --- Pagination Styles ---
  paginationFooter: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 24,
    gap: 10,
  },
  counterText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  showMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  showMoreBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  endText: {
    textAlign: "center",
    fontSize: 12,
    color: "#94a3b8",
    marginVertical: 16,
    fontWeight: "500",
  },

  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a", marginTop: 12 },
  emptySub: { fontSize: 12, color: "#64748b", textAlign: "center", marginTop: 6, lineHeight: 18 },
});