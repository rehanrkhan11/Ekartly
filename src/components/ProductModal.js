import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useShop } from "../context/ShopContext";
import { inr } from "../utils/format";
import { titleCase } from "../theme/categoryThemes";

const { height, width } = Dimensions.get("window");

export default function ProductModal() {
  const { selectedProduct, setSelectedProduct, theme, wishlist, toggleWishlist, addToCart } = useShop();
  const translateY = useRef(new Animated.Value(height)).current;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (selectedProduct) {
      setActiveImageIndex(0);
      setQuantity(1);
      translateY.setValue(height);
      Animated.timing(translateY, { toValue: 0, duration: 280, useNativeDriver: true }).start();
    }
  }, [selectedProduct]);

  const close = () => {
    Animated.timing(translateY, { toValue: height, duration: 200, useNativeDriver: true }).start(() =>
      setSelectedProduct(null)
    );
  };

  if (!selectedProduct) return null;
  const p = selectedProduct;
  const inWishlist = !!wishlist[p.id];

  // Fallback gallery array if p.images is empty
  const images = p.images && p.images.length > 0 ? p.images : [p.thumbnail];

  return (
    <Modal transparent visible animationType="fade" onRequestClose={close}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={close}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />
          <TouchableOpacity style={styles.closeBtn} onPress={close}>
            <Ionicons name="close" size={16} color="#334155" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Gallery Image Slider */}
            <View style={[styles.imageWrap, { backgroundColor: theme.accent || "#f1f5f9" }]}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const slide = Math.round(e.nativeEvent.contentOffset.x / width);
                  if (slide !== activeImageIndex) setActiveImageIndex(slide);
                }}
                scrollEventThrottle={16}
              >
                {images.map((imgUrl, idx) => (
                  <View key={idx} style={styles.slideView}>
                    <Image source={{ uri: imgUrl }} style={styles.productImage} resizeMode="contain" />
                  </View>
                ))}
              </ScrollView>

              {/* Indicator Dots */}
              {images.length > 1 && (
                <View style={styles.dotContainer}>
                  {images.map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.dot,
                        { backgroundColor: idx === activeImageIndex ? theme.bg[1] : "#cbd5e1" },
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>

            <View style={styles.content}>
              <View style={styles.metaHeader}>
                <Text style={styles.brand}>{p.brand || titleCase(p.category)}</Text>
                {/* Stock Badge */}
                {p.stock === 0 ? (
                  <Text style={[styles.stockTag, { color: "#ef4444", backgroundColor: "#fef2f2" }]}>
                    Out of stock
                  </Text>
                ) : p.stock < 5 ? (
                  <Text style={[styles.stockTag, { color: "#f59e0b", backgroundColor: "#fffbeb" }]}>
                    Only {p.stock} left!
                  </Text>
                ) : (
                  <Text style={[styles.stockTag, { color: "#10b981", backgroundColor: "#ecfdf5" }]}>
                    In Stock
                  </Text>
                )}
              </View>

              <Text style={styles.title}>{p.title}</Text>

              <View style={styles.ratingRow}>
                <View style={styles.ratingPill}>
                  <Text style={styles.ratingText}>{p.rating?.toFixed(1) || "4.5"}</Text>
                  <Ionicons name="star" size={9} color="#fff" />
                </View>
                <Text style={styles.sub}>{titleCase(p.category)}</Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.price}>{inr(p.price)}</Text>
                {p.discountPercentage > 0 && (
                  <>
                    <Text style={styles.strike}>
                      {inr(p.price / (1 - p.discountPercentage / 100))}
                    </Text>
                    <Text style={styles.off}>{Math.round(p.discountPercentage)}% off</Text>
                  </>
                )}
              </View>

              <Text style={styles.desc}>{p.description}</Text>

              {/* Feature Badges */}
              <View style={styles.featureRow}>
                <View style={styles.featureBadge}>
                  <Ionicons name="car-outline" size={14} color="#64748b" />
                  <Text style={styles.featureText}>Free Shipping</Text>
                </View>
                <View style={styles.featureBadge}>
                  <Ionicons name="shield-checkmark-outline" size={14} color="#64748b" />
                  <Text style={styles.featureText}>7 Days Return</Text>
                </View>
              </View>

              {/* Quantity Picker & Actions */}
              <View style={styles.quantityContainer}>
                <Text style={styles.quantityLabel}>Quantity</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    <Ionicons name="remove" size={14} color="#334155" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{quantity}</Text>
                  <TouchableOpacity style={styles.stepBtn} onPress={() => setQuantity((q) => q + 1)}>
                    <Ionicons name="add" size={14} color="#334155" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={() => toggleWishlist(p)}
                  style={[
                    styles.wishBtn,
                    { borderColor: theme.bg[1], backgroundColor: inWishlist ? theme.bg[1] : "#fff" },
                  ]}
                >
                  <Ionicons
                    name={inWishlist ? "heart" : "heart-outline"}
                    size={20}
                    color={inWishlist ? "#fff" : theme.bg[1]}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    addToCart(p, quantity);
                    close();
                  }}
                  disabled={p.stock === 0}
                  style={[
                    styles.cartBtn,
                    { backgroundColor: p.stock === 0 ? "#cbd5e1" : theme.bg[1] },
                  ]}
                >
                  <Text style={styles.cartBtnText}>
                    {p.stock === 0 ? "Out of Stock" : `Add to Cart · ${inr(p.price * quantity)}`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(10,14,25,0.55)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: height * 0.88 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0", alignSelf: "center", marginTop: 10 },
  closeBtn: {
    position: "absolute", top: 14, right: 14, zIndex: 10,
    width: 30, height: 30, borderRadius: 15, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center",
  },
  imageWrap: { height: 230, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: 10 },
  slideView: { width, height: 210, justifyContent: "center", alignItems: "center" },
  productImage: { width: "75%", height: 180 },
  dotContainer: { flexDirection: "row", justifyContent: "center", gap: 6, position: "absolute", bottom: 10, width: "100%" },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  content: { padding: 20, gap: 10 },
  metaHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { fontSize: 11, fontWeight: "800", color: "#94a3b8", textTransform: "uppercase" },
  stockTag: { fontSize: 10, fontWeight: "800", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  title: { fontSize: 19, fontWeight: "800", color: "#0f172a" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  ratingPill: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#059669", borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3 },
  ratingText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  sub: { fontSize: 11, color: "#94a3b8" },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  price: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  strike: { fontSize: 13, color: "#94a3b8", textDecorationLine: "line-through" },
  off: { fontSize: 12, fontWeight: "800", color: "#f43f5e" },
  desc: { fontSize: 13, color: "#64748b", lineHeight: 19 },
  featureRow: { flexDirection: "row", gap: 12, marginVertical: 4 },
  featureBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f8fafc", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  featureText: { fontSize: 11, color: "#64748b", fontWeight: "600" },
  quantityContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  quantityLabel: { fontSize: 13, fontWeight: "700", color: "#334155" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#f1f5f9", borderRadius: 10, padding: 4 },
  stepBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },
  qtyText: { fontSize: 14, fontWeight: "800", color: "#0f172a" },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 8, marginBottom: 12 },
  wishBtn: { width: 54, height: 48, borderRadius: 16, borderWidth: 2, justifyContent: "center", alignItems: "center" },
  cartBtn: { flex: 1, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  cartBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
});