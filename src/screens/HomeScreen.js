import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useShop } from "../context/ShopContext";
import { titleCase } from "../theme/categoryThemes";
import ParticleField from "../components/ParticleField";
import CategoryTabs from "../components/CategoryTabs";
import ProductCard from "../components/ProductCard";
import SearchOverlay from "../components/SearchOverlay";

const PAGE_SIZE = 10;

export default function HomeScreen({ navigation }) {
  const {
    theme,
    query,
    activeCategory,
    products = [],
    loading,
    searching,
    cartCount,
    setSelectedProduct,
    bootstrap,
    selectedAddress,
  } = useShop();

  const [refreshing, setRefreshing] = useState(false);
  const [searchOverlayVisible, setSearchOverlayVisible] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Reset pagination state when search query or category updates
  useEffect(() => {
    setPage(1);
  }, [activeCategory, query]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (typeof bootstrap === "function") {
      await bootstrap();
    }
    setRefreshing(false);
  }, [bootstrap]);

  // Slice products based on current page
  const visibleProducts = useMemo(() => {
    return Array.isArray(products) ? products.slice(0, page * PAGE_SIZE) : [];
  }, [products, page]);

  // Load next batch handler
  const handleLoadMore = () => {
    if (loadingMore || visibleProducts.length >= products.length) {
      return;
    }
    setLoadingMore(true);
    setTimeout(() => {
      setPage((prevPage) => prevPage + 1);
      setLoadingMore(false);
    }, 300);
  };

  const headerTitle = query?.trim()
    ? `Results for "${query}"`
    : activeCategory
    ? titleCase(activeCategory)
    : "Best in store";

  const isBusy = loading || searching;

  // Render bottom loader when pulling next batch
  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme?.bg?.[1] || "#0f172a"} />
      </View>
    );
  };

  // Format delivery location string dynamically
  const locationDisplay = selectedAddress
    ? `${selectedAddress.pincode ? selectedAddress.pincode + " — " : ""}${
        selectedAddress.address || selectedAddress.city || "Select Location"
      }`
    : "Select Delivery Address";

  return (
    <View style={styles.flex}>
      {/* Top Gradient Header */}
      <LinearGradient
        colors={theme?.bg || ["#1e3a8a", "#0f172a"]}
        style={styles.header}
      >
        <ParticleField theme={theme} />
        <SafeAreaView edges={["top"]}>
          {/* Location & Cart Row */}
          <View style={styles.deliverRow}>
            <TouchableOpacity
              style={styles.deliverLeft}
              activeOpacity={0.7}
              onPress={() => navigation?.navigate("Location")}
            >
              <Ionicons name="location-outline" size={18} color="#fff" />
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.deliverSmall}>Deliver to</Text>
                <Text style={styles.deliverBig} numberOfLines={1}>
                  {locationDisplay}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={14} color="#fff" style={{ marginLeft: 2 }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cartIcon}
              activeOpacity={0.8}
              onPress={() => navigation?.navigate("Cart")}
            >
              <Ionicons name="bag-outline" size={18} color="#fff" />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Fake Search Bar Trigger */}
          <TouchableOpacity
            style={styles.searchBarTrigger}
            activeOpacity={0.9}
            onPress={() => setSearchOverlayVisible(true)}
          >
            <Ionicons name="search" size={17} color="#94a3b8" />
            <Text style={styles.searchPlaceholder} numberOfLines={1}>
              {query?.trim() ? query : "Search products, brands and more..."}
            </Text>
            <Ionicons name="mic-outline" size={16} color="#94a3b8" />
          </TouchableOpacity>

          {/* Category Tabs */}
          <CategoryTabs />
        </SafeAreaView>
      </LinearGradient>

      {/* Main Product List */}
      <FlatList
        data={visibleProducts}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme?.bg?.[1] || "#0f172a"]}
            tintColor={theme?.bg?.[1] || "#0f172a"}
          />
        }
        ListFooterComponent={renderFooter}
        ListHeaderComponent={
          <>
            {!query?.trim() && (
              <LinearGradient colors={theme?.bg || ["#1e3a8a", "#0f172a"]} style={styles.banner}>
                <ParticleField theme={theme} dense />
                <View style={styles.dealTag}>
                  <Text style={styles.dealTagText}>DEAL OF THE DAY</Text>
                </View>
                <Text style={styles.bannerTitle}>
                  {theme?.name || "Snow"} in {activeCategory ? titleCase(activeCategory) : "Store"}
                </Text>
                <Text style={styles.bannerSub}>
                  Up to 60% off — refreshed for every category
                </Text>
              </LinearGradient>
            )}

            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>{headerTitle}</Text>
              <Text style={styles.sectionCount}>{products.length} items</Text>
            </View>

            {isBusy && (
              <ActivityIndicator
                style={{ marginVertical: 24 }}
                color={theme?.bg?.[1] || "#0f172a"}
                size="large"
              />
            )}
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{ flex: 0.5 }}
            activeOpacity={0.9}
            onPress={() => setSelectedProduct(item)}
          >
            <ProductCard product={item} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !isBusy ? (
            <View style={styles.empty}>
              <Text style={{ fontSize: 34 }}>🔍</Text>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySub}>Try a different search or category</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={handleRefresh}>
                <Text style={styles.retryText}>Reload Store</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* Modern Fullscreen Search Modal */}
      <SearchOverlay
        visible={searchOverlayVisible}
        onClose={() => setSearchOverlayVisible(false)}
        navigation={navigation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f8fafc" },
  header: { paddingBottom: 16, overflow: "hidden" },
  deliverRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
  },
  deliverLeft: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1, marginRight: 12 },
  deliverSmall: { color: "rgba(255,255,255,0.7)", fontSize: 10 },
  deliverBig: { color: "#fff", fontSize: 12, fontWeight: "800" },
  cartIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    backgroundColor: "#fbbf24",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  cartBadgeText: { fontSize: 9, fontWeight: "800", color: "#1e293b" },
  searchBarTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13,
    color: "#64748b",
  },
  listContent: { paddingBottom: 30 },
  banner: {
    margin: 14,
    borderRadius: 22,
    padding: 18,
    minHeight: 130,
    justifyContent: "center",
    overflow: "hidden",
  },
  dealTag: {
    alignSelf: "flex-start",
    backgroundColor: "#fbbf24",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  dealTagText: { fontSize: 9, fontWeight: "800", color: "#1e293b" },
  bannerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  bannerSub: { color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 4 },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#1e293b" },
  sectionCount: { fontSize: 11, color: "#94a3b8" },
  empty: { alignItems: "center", paddingVertical: 60, gap: 4 },
  emptyTitle: { fontWeight: "800", color: "#334155" },
  emptySub: { fontSize: 12, color: "#94a3b8" },
  retryBtn: {
    marginTop: 12,
    backgroundColor: "#0f172a",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  footerLoader: { paddingVertical: 16, alignItems: "center" },
});