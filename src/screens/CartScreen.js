import React, { useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useShop } from "../context/ShopContext";
import { inr } from "../utils/format";
import ScreenHeader from "../components/ScreenHeader";
import CheckoutModal from "../components/CheckoutModal";

export default function CartScreen() {
  const { theme, cartItems, cartTotal, changeQty, flashToast } = useShop();

  const [coupon, setCoupon] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [checkoutVisible, setCheckoutVisible] = useState(false);

  const handleApplyCoupon = () => {
    const clean = coupon.trim().toUpperCase();
    if (clean === "DISCOUNT10") {
      setDiscountPercent(10);
      setAppliedCoupon("DISCOUNT10");
      flashToast("10% discount applied! 🎉");
    } else if (clean === "KARTLY20") {
      setDiscountPercent(20);
      setAppliedCoupon("KARTLY20");
      flashToast("20% discount applied! 🎉");
    } else {
      flashToast("Invalid promo code");
    }
  };

  const discountAmount = (cartTotal * discountPercent) / 100;
  const finalTotal = Math.max(0, cartTotal - discountAmount);

  return (
    <View style={styles.flex}>
      <ScreenHeader title={`Your Cart (${cartItems.reduce((acc, i) => acc + i.qty, 0)})`} />
      <FlatList
        data={cartItems}
        keyExtractor={({ product }) => String(product.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item: { product, qty } }) => (
          <View style={styles.row}>
            <View style={styles.thumb}>
              <Image source={{ uri: product.thumbnail }} style={{ width: "80%", height: "80%" }} resizeMode="contain" />
            </View>
            <View style={styles.mid}>
              <Text style={styles.title} numberOfLines={1}>{product.title}</Text>
              <Text style={styles.each}>{inr(product.price)} each</Text>
              <View style={styles.stepper}>
                <TouchableOpacity style={styles.stepBtn} onPress={() => changeQty(product.id, -1)}>
                  <Ionicons name="remove" size={13} color="#334155" />
                </TouchableOpacity>
                <Text style={styles.qty}>{qty}</Text>
                <TouchableOpacity style={styles.stepBtn} onPress={() => changeQty(product.id, 1)}>
                  <Ionicons name="add" size={13} color="#334155" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.right}>
              <Text style={styles.lineTotal}>{inr(product.price * qty)}</Text>
              <TouchableOpacity onPress={() => changeQty(product.id, -qty)}>
                <Ionicons name="trash-outline" size={16} color="#fb7185" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 34 }}>🛒</Text>
            <Text style={styles.emptyTitle}>Cart is empty</Text>
            <Text style={styles.emptySub}>Add products to see them here</Text>
          </View>
        }
        ListFooterComponent={
          cartItems.length > 0 ? (
            <View style={styles.summary}>
              {/* Promo Code Input */}
              <Text style={styles.sectionHeader}>Promo Code</Text>
              <View style={styles.couponRow}>
                <TextInput
                  style={styles.couponInput}
                  placeholder="Enter code (e.g. DISCOUNT10)"
                  placeholderTextColor="#94a3b8"
                  value={coupon}
                  onChangeText={setCoupon}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[styles.applyBtn, { backgroundColor: theme.bg[1] }]}
                  onPress={handleApplyCoupon}
                >
                  <Text style={styles.applyBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>

              {appliedCoupon !== "" && (
                <View style={styles.appliedBadge}>
                  <Text style={styles.appliedText}>Code {appliedCoupon} applied!</Text>
                  <TouchableOpacity onPress={() => { setDiscountPercent(0); setAppliedCoupon(""); setCoupon(""); }}>
                    <Ionicons name="close-circle" size={16} color="#059669" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Price Calculation Summary */}
              <View style={[styles.summaryRow, { marginTop: 10 }]}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{inr(cartTotal)}</Text>
              </View>

              {discountAmount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Discount ({discountPercent}%)</Text>
                  <Text style={[styles.summaryValue, { color: "#f43f5e" }]}>-{inr(discountAmount)}</Text>
                </View>
              )}

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery</Text>
                <Text style={[styles.summaryValue, { color: "#059669" }]}>Free</Text>
              </View>

              <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalValue}>{inr(finalTotal)}</Text>
              </View>

              <TouchableOpacity
                style={[styles.checkoutBtn, { backgroundColor: theme.bg[1] }]}
                onPress={() => setCheckoutVisible(true)}
              >
                <Text style={styles.checkoutText}>Checkout · {inr(finalTotal)}</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      <CheckoutModal
        visible={checkoutVisible}
        onClose={() => setCheckoutVisible(false)}
        discountAmount={discountAmount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f8fafc" },
  list: { padding: 14, gap: 10 },
  row: {
    flexDirection: "row", gap: 10, alignItems: "center", backgroundColor: "#fff",
    borderRadius: 16, borderWidth: 1, borderColor: "#f1f5f9", padding: 10, marginBottom: 10,
  },
  thumb: { width: 60, height: 60, borderRadius: 12, backgroundColor: "#f8fafc", justifyContent: "center", alignItems: "center" },
  mid: { flex: 1, gap: 3 },
  title: { fontSize: 13, fontWeight: "700", color: "#1e293b" },
  each: { fontSize: 11, color: "#94a3b8" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  stepBtn: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center" },
  qty: { fontSize: 13, fontWeight: "800", width: 16, textAlign: "center" },
  right: { alignItems: "flex-end", gap: 10 },
  lineTotal: { fontSize: 13, fontWeight: "800", color: "#0f172a" },
  empty: { alignItems: "center", paddingVertical: 80, gap: 4 },
  emptyTitle: { fontWeight: "800", color: "#334155" },
  emptySub: { fontSize: 12, color: "#94a3b8" },
  summary: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#f1f5f9", padding: 16, marginTop: 6, gap: 8 },
  sectionHeader: { fontSize: 12, fontWeight: "800", color: "#475569" },
  couponRow: { flexDirection: "row", gap: 8 },
  couponInput: { flex: 1, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, paddingHorizontal: 12, height: 40, fontSize: 12, color: "#0f172a" },
  applyBtn: { paddingHorizontal: 16, justifyContent: "center", borderRadius: 10 },
  applyBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  appliedBadge: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#ecfdf5", padding: 8, borderRadius: 8 },
  appliedText: { fontSize: 11, fontWeight: "700", color: "#059669" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 13, color: "#64748b" },
  summaryValue: { fontSize: 13, color: "#64748b" },
  summaryTotalRow: { borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 8, marginTop: 2 },
  summaryTotalLabel: { fontWeight: "800", color: "#0f172a" },
  summaryTotalValue: { fontWeight: "800", color: "#0f172a" },
  checkoutBtn: { marginTop: 14, borderRadius: 16, paddingVertical: 14, alignItems: "center" },
  checkoutText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});