import React, { useState, useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useShop } from "../context/ShopContext";
import { inr } from "../utils/format";
import { titleCase } from "../theme/categoryThemes";

const SEARCH_PAGE_SIZE = 5;

export default function SearchOverlay() {
  const {
    theme,
    query,
    submitSearch,
    products,
    searching,
    recentSearches,
    removeRecentSearch,
    clearRecentSearches,
    trendingSearches,
    categories,
    selectCategory,
    setSelectedProduct,
  } = useShop();

  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Reset pagination to Page 1 on query or products change
  useEffect(() => {
    setPage(1);
  }, [query, products]);

  // Slice visible products according to page number
  const visibleProducts = useMemo(() => {
    return (products || []).slice(0, page * SEARCH_PAGE_SIZE);
  }, [products, page]);

  const totalResults = products ? products.length : 0;
  const currentCount = visibleProducts.length;
  const hasMore = currentCount < totalResults;

  // Manual handler when user clicks "Show More"
  const handleShowMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setPage((prev) => prev + 1);
      setLoadingMore(false);
    }, 200);
  };

  const renderHeader = () => {
    if (totalResults === 0) return null;
    return (
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsHeaderText}>
          Showing <Text style={styles.resultsHeaderBold}>{currentCount}</Text> of{" "}
          <Text style={styles.resultsHeaderBold}>{totalResults}</Text> results
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!hasMore) return <View style={{ height: 20 }} />;

    return (
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={[styles.showMoreButton, { borderColor: theme.bg[1] || "#0f172a" }]}
          activeOpacity={0.7}
          onPress={handleShowMore}
          disabled={loadingMore}
        >
          {loadingMore ? (
            <ActivityIndicator size="small" color={theme.bg[1] || "#0f172a"} />
          ) : (
            <>
              <Text style={[styles.showMoreText, { color: theme.bg[1] || "#0f172a" }]}>
                Show More ({totalResults - currentCount} remaining)
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.bg[1] || "#0f172a"} />
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const isEmpty = !query.trim();

  if (!isEmpty) {
    return (
      <View style={styles.fill}>
        {searching ? (
          <View style={styles.centerNote}>
            <ActivityIndicator size="small" color={theme.bg[1] || "#0f172a"} />
            <Text style={styles.centerNoteText}>Searching…</Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.centerNote}>
            <Text style={{ fontSize: 32 }}>🤔</Text>
            <Text style={styles.noResultsTitle}>No matches for "{query}"</Text>
            <Text style={styles.noResultsSub}>
              Double-check the spelling — misspelled or partial words still work.
            </Text>
          </View>
        ) : (
          <FlatList
            data={visibleProducts}
            keyExtractor={(item) => String(item.id)}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingVertical: 8 }}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderFooter}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultRow}
                activeOpacity={0.7}
                onPress={() => {
                  submitSearch(item.title);
                  setSelectedProduct(item);
                }}
              >
                <Image
                  source={{ uri: item.thumbnail }}
                  style={styles.resultThumb}
                  resizeMode="contain"
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.resultBrand} numberOfLines={1}>
                    {item.brand || titleCase(item.category)}
                  </Text>
                </View>
                <Text style={styles.resultPrice}>{inr(item.price)}</Text>
                <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  }

  return (
    <FlatList
      style={styles.fill}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      data={[]}
      renderItem={null}
      ListHeaderComponent={
        <>
          {recentSearches.length > 0 && (
            <View style={{ marginBottom: 22 }}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={[styles.clearAll, { color: theme.bg[1] }]}>
                    Clear all
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.chipWrap}>
                {recentSearches.map((term) => (
                  <View key={term} style={styles.recentChip}>
                    <TouchableOpacity onPress={() => submitSearch(term)}>
                      <Text style={styles.recentChipText}>{term}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeRecentSearch(term)}
                      hitSlop={8}
                    >
                      <Ionicons name="close" size={13} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {trendingSearches.length > 0 && (
            <View style={{ marginBottom: 22 }}>
              <View style={styles.sectionHead}>
                <Ionicons name="flame" size={15} color="#f97316" />
                <Text style={[styles.sectionTitle, { marginLeft: 4 }]}>
                  Trending Now
                </Text>
              </View>
              <View style={styles.chipWrap}>
                {trendingSearches.map((term) => (
                  <TouchableOpacity
                    key={term}
                    style={[
                      styles.trendChip,
                      { borderColor: theme.bg[1] + "33" },
                    ]}
                    onPress={() => submitSearch(term)}
                  >
                    <Ionicons
                      name="trending-up"
                      size={12}
                      color={theme.bg[1]}
                    />
                    <Text
                      style={[styles.trendChipText, { color: theme.bg[1] }]}
                      numberOfLines={1}
                    >
                      {term}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {categories.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Browse Categories</Text>
              <View style={[styles.chipWrap, { marginTop: 10 }]}>
                {categories.slice(0, 10).map((c) => (
                  <TouchableOpacity
                    key={c.slug}
                    style={styles.categoryChip}
                    onPress={() => selectCategory(c.slug)}
                  >
                    <Text style={styles.categoryChipText}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#ffffff" },
  centerNote: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 40,
  },
  centerNoteText: { color: "#94a3b8", fontSize: 13 },
  noResultsTitle: {
    fontWeight: "800",
    color: "#334155",
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
  noResultsSub: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 17,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  resultsHeaderText: { fontSize: 12, color: "#64748b" },
  resultsHeaderBold: { fontWeight: "700", color: "#0f172a" },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  resultThumb: {
    width: 42,
    height: 42,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
  },
  resultTitle: { fontSize: 13, fontWeight: "700", color: "#1e293b" },
  resultBrand: { fontSize: 11, color: "#94a3b8", marginTop: 1 },
  resultPrice: { fontSize: 13, fontWeight: "800", color: "#0f172a" },
  footerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  showMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: "#ffffff",
    width: "100%",
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: "700",
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: "#1e293b" },
  clearAll: { fontSize: 12, fontWeight: "700" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  recentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  recentChipText: { fontSize: 12, color: "#475569", fontWeight: "600" },
  trendChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#fff",
    borderWidth: 1.2,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    maxWidth: "100%",
  },
  trendChipText: { fontSize: 12, fontWeight: "700" },
  categoryChip: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  categoryChipText: { fontSize: 12, fontWeight: "700", color: "#334155" },
});


