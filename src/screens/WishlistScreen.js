import React from "react";
import {
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
import ScreenHeader from "../components/ScreenHeader";

export default function WishlistScreen() {
  const { theme, wishlistItems, toggleWishlist, addToCart, setSelectedProduct } = useShop();

  return (
    <View style={styles.flex}>
      <ScreenHeader title={`Wishlist (${wishlistItems.length})`} />

      <FlatList
        data={wishlistItems}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => setSelectedProduct(item)}
          >
            <View style={styles.thumbWrap}>
              <Image
                source={{ uri: item.thumbnail }}
                style={styles.thumb}
                resizeMode="contain"
              />
            </View>

            <View style={styles.details}>
              <Text style={styles.brand}>{item.brand || item.category}</Text>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>

              <View style={styles.priceRow}>
                <Text style={styles.price}>{inr(item.price)}</Text>
                {item.discountPercentage > 0 && (
                  <Text style={styles.off}>
                    {Math.round(item.discountPercentage)}% OFF
                  </Text>
                )}
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.cartBtn, { backgroundColor: theme.bg[1] }]}
                  onPress={() => addToCart(item, 1)}
                >
                  <Ionicons name="cart-outline" size={14} color="#fff" />
                  <Text style={styles.cartBtnText}>Add to Cart</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => toggleWishlist(item)}
                >
                  <Ionicons name="trash-outline" size={16} color="#f43f5e" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 36 }}>❤️</Text>
            <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
            <Text style={styles.emptySub}>
              Save items you love by tapping the heart icon on any product.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f8fafc" },
  list: { padding: 14, gap: 12 },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    gap: 12,
  },
  thumbWrap: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    justify: "center",
    alignItems: "center",
  },
  thumb: { width: "85%", height: "85%" },
  details: { flex: 1, justifyContent: "space-between" },
  brand: { fontSize: 10, fontWeight: "800", color: "#94a3b8", textTransform: "uppercase" },
  title: { fontSize: 13, fontWeight: "700", color: "#0f172a" },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  price: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  off: { fontSize: 10, fontWeight: "800", color: "#10b981" },
  actions: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  cartBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  cartBtnText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#fff1f2",
    justifyContent: "center",
    alignItems: "center",
  },
  empty: { alignItems: "center", paddingVertical: 80, gap: 6, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#334155" },
  emptySub: { fontSize: 12, color: "#94a3b8", textAlign: "center" },
});