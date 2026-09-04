// src/components/ProductCardSkeleton.js
import React from "react";
import { View, StyleSheet } from "react-native";
import Skeleton from "./Skeleton";

export function ProductCardSkeleton() {
  return (
    <View style={styles.cardContainer}>
      {/* Top badges row (Discount tag on left, heart icon on right) */}
      <View style={styles.topRow}>
        <Skeleton width={48} height={18} borderRadius={10} />
        <Skeleton width={20} height={20} borderRadius={10} />
      </View>

      {/* Product Image Placeholder */}
      <View style={styles.imageWrapper}>
        <Skeleton width="80%" height={100} borderRadius={12} />
      </View>

      {/* Content Section */}
      <View style={styles.infoSection}>
        {/* Brand Name */}
        <Skeleton width="45%" height={10} borderRadius={4} style={{ marginBottom: 6 }} />

        {/* Product Title (Two lines) */}
        <Skeleton width="90%" height={13} borderRadius={4} style={{ marginBottom: 4 }} />
        <Skeleton width="65%" height={13} borderRadius={4} style={{ marginBottom: 8 }} />

        {/* Rating & Stock Badge */}
        <Skeleton width={95} height={18} borderRadius={6} style={{ marginBottom: 10 }} />

        {/* Price Row (Main price + discounted original price) */}
        <View style={styles.priceRow}>
          <Skeleton width={55} height={16} borderRadius={4} />
          <Skeleton width={35} height={12} borderRadius={4} />
        </View>

        {/* Add To Cart Button */}
        <Skeleton width="100%" height={36} borderRadius={12} style={{ marginTop: 10 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 10,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  imageWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
  infoSection: {
    marginTop: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});

export default ProductCardSkeleton;