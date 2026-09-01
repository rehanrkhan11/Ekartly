import React, { useRef } from "react";
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { inr } from "../utils/format";
import { titleCase } from "../theme/categoryThemes";
import { useShop } from "../context/ShopContext";

export default function ProductCard({ product }) {
  const { theme, wishlist, toggleWishlist, cart, addToCart, changeQty, setSelectedProduct } = useShop();
  const inWishlist = !!wishlist[product.id];
  const qtyInCart = cart[product.id]?.qty || 0;

  const cardScale = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const addScale = useRef(new Animated.Value(1)).current;

  const pressIn = () => Animated.spring(cardScale, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () => Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  const bounce = (val) => {
    Animated.sequence([
      Animated.spring(val, { toValue: 1.35, useNativeDriver: true, speed: 50 }),
      Animated.spring(val, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
  };

  const onHeartPress = (e) => {
    e.stopPropagation();
    bounce(heartScale);
    toggleWishlist(product);
  };

  const onAddPress = () => {
    bounce(addScale);
    addToCart(product);
  };

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: cardScale }] }]}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => setSelectedProduct(product)}
        onPressIn={pressIn}
        onPressOut={pressOut}
      >
        <View style={styles.imageWrap}>
          {product.discountPercentage > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{Math.round(product.discountPercentage)}% OFF</Text>
            </View>
          )}
          <TouchableOpacity style={styles.heartBtn} onPress={onHeartPress} hitSlop={6}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons
                name={inWishlist ? "heart" : "heart-outline"}
                size={15}
                color={inWishlist ? theme.bg[1] : "#94a3b8"}
              />
            </Animated.View>
          </TouchableOpacity>
          <Image source={{ uri: product.thumbnail }} style={styles.image} resizeMode="contain" />
        </View>

        <View style={styles.body}>
          <Text style={styles.brand} numberOfLines={1}>
            {product.brand || titleCase(product.category)}
          </Text>
          <Text style={styles.title} numberOfLines={2}>{product.title}</Text>

          <View style={styles.ratingRow}>
            <View style={styles.ratingPill}>
              <Text style={styles.ratingText}>{product.rating?.toFixed(1)}</Text>
              <Ionicons name="star" size={9} color="#fff" />
            </View>
            <Text style={styles.stock}>({product.stock} in stock)</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{inr(product.price)}</Text>
            {product.discountPercentage > 0 && (
              <Text style={styles.strike}>
                {inr(product.price / (1 - product.discountPercentage / 100))}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {qtyInCart === 0 ? (
        <TouchableOpacity
          onPress={onAddPress}
          activeOpacity={0.85}
          style={[styles.addBtn, { backgroundColor: theme.accent, borderColor: theme.bg[1] + "33" }]}
        >
          <Animated.View style={{ transform: [{ scale: addScale }], flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Ionicons name="cart-outline" size={13} color={theme.bg[1]} />
            <Text style={[styles.addBtnText, { color: theme.bg[1] }]}>Add to Cart</Text>
          </Animated.View>
        </TouchableOpacity>
      ) : (
        <Animated.View style={[styles.stepper, { borderColor: theme.bg[1], transform: [{ scale: addScale }] }]}>
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => { bounce(addScale); changeQty(product.id, -1); }}
          >
            <Ionicons name="remove" size={15} color={theme.bg[1]} />
          </TouchableOpacity>
          <Text style={[styles.stepperQty, { color: theme.bg[1] }]}>{qtyInCart}</Text>
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => { bounce(addScale); changeQty(product.id, 1); }}
          >
            <Ionicons name="add" size={15} color={theme.bg[1]} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    overflow: "hidden",
    margin: 6,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  imageWrap: { height: 130, backgroundColor: "#f8fafc", justifyContent: "center", alignItems: "center" },
  image: { width: "80%", height: "80%" },
  discountBadge: {
    position: "absolute", top: 8, left: 8, zIndex: 2,
    backgroundColor: "#f43f5e", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 3,
  },
  discountText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  heartBtn: {
    position: "absolute", top: 8, right: 8, zIndex: 2,
    width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.92)",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
  },
  body: { padding: 10, gap: 3 },
  brand: { fontSize: 9, fontWeight: "800", color: "#94a3b8", textTransform: "uppercase" },
  title: { fontSize: 13, fontWeight: "700", color: "#1e293b", minHeight: 34 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  ratingPill: {
    flexDirection: "row", alignItems: "center", gap: 2,
    backgroundColor: "#059669", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2,
  },
  ratingText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  stock: { fontSize: 10, color: "#94a3b8" },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 2 },
  price: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  strike: { fontSize: 11, color: "#94a3b8", textDecorationLine: "line-through" },
  addBtn: {
    marginHorizontal: 10, marginBottom: 10, paddingVertical: 8, borderRadius: 12,
    alignItems: "center", borderWidth: 1.5,
  },
  addBtnText: { fontWeight: "800", fontSize: 12 },
  stepper: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginHorizontal: 10, marginBottom: 10, borderRadius: 12, borderWidth: 1.5,
    paddingVertical: 4, paddingHorizontal: 6,
  },
  stepperBtn: { width: 26, height: 26, justifyContent: "center", alignItems: "center" },
  stepperQty: { fontWeight: "800", fontSize: 13 },
});
