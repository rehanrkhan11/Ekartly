import React, { useState } from "react";
import {
  Alert,
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

export default function CheckoutModal({ visible, onClose, navigation, discountAmount = 0 }) {
  const { cartItems, cartTotal, clearCart, theme, flashToast, selectedAddress } = useShop();

  const [paymentMethod, setPaymentMethod] = useState("upi");

  const finalTotal = Math.max(0, cartTotal - discountAmount);

  const handleOpenLocationPicker = () => {
    onClose();
    if (navigation) {
      navigation.navigate("Location");
    }
  };

  const handlePlaceOrder = () => {
    if (!selectedAddress) {
      Alert.alert("Missing Address", "Please select a valid delivery address.");
      return;
    }

    clearCart();
    onClose();
    flashToast("🎉 Order placed successfully!");
  };

  if (!visible) return null;

  const displayAddress = selectedAddress
    ? `${selectedAddress.address}${selectedAddress.city ? `, ${selectedAddress.city}` : ""}${
        selectedAddress.pincode ? ` - ${selectedAddress.pincode}` : ""
      }`
    : "No delivery address selected";

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="arrow-back" size={20} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Shipping Address Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.rowAlign}>
                <Ionicons name="location-outline" size={18} color={theme?.bg?.[1] || "#0f172a"} />
                <Text style={styles.cardTitle}>
                  Shipping Address {selectedAddress?.label ? `(${selectedAddress.label})` : ""}
                </Text>
              </View>
              <TouchableOpacity onPress={handleOpenLocationPicker}>
                <Text style={[styles.actionText, { color: theme?.bg?.[1] || "#0f172a" }]}>
                  Change
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.addressText}>{displayAddress}</Text>
          </View>

          {/* Payment Method Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment Method</Text>

            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === "upi" && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod("upi")}
            >
              <View style={styles.rowAlign}>
                <Ionicons name="qr-code-outline" size={20} color="#0f172a" />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.paymentMethodTitle}>UPI / Google Pay / PhonePe</Text>
                  <Text style={styles.paymentMethodSub}>Instant payment via UPI app</Text>
                </View>
              </View>
              <Ionicons
                name={paymentMethod === "upi" ? "radio-button-on" : "radio-button-off"}
                size={20}
                color={paymentMethod === "upi" ? theme?.bg?.[1] || "#0f172a" : "#cbd5e1"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === "card" && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod("card")}
            >
              <View style={styles.rowAlign}>
                <Ionicons name="card-outline" size={20} color="#0f172a" />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.paymentMethodTitle}>Credit / Debit Card</Text>
                  <Text style={styles.paymentMethodSub}>Visa, Mastercard, RuPay</Text>
                </View>
              </View>
              <Ionicons
                name={paymentMethod === "card" ? "radio-button-on" : "radio-button-off"}
                size={20}
                color={paymentMethod === "card" ? theme?.bg?.[1] || "#0f172a" : "#cbd5e1"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === "cod" && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod("cod")}
            >
              <View style={styles.rowAlign}>
                <Ionicons name="cash-outline" size={20} color="#0f172a" />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.paymentMethodTitle}>Cash on Delivery (COD)</Text>
                  <Text style={styles.paymentMethodSub}>Pay cash at doorstep</Text>
                </View>
              </View>
              <Ionicons
                name={paymentMethod === "cod" ? "radio-button-on" : "radio-button-off"}
                size={20}
                color={paymentMethod === "cod" ? theme?.bg?.[1] || "#0f172a" : "#cbd5e1"}
              />
            </TouchableOpacity>
          </View>

          {/* Order Summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Summary ({cartItems.length} Items)</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{inr(cartTotal)}</Text>
            </View>

            {discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Coupon Discount</Text>
                <Text style={[styles.summaryValue, { color: "#f43f5e" }]}>-{inr(discountAmount)}</Text>
              </View>
            )}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={[styles.summaryValue, { color: "#10b981" }]}>FREE</Text>
            </View>

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalValue}>{inr(finalTotal)}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action Footer */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerSub}>Total</Text>
            <Text style={styles.footerPrice}>{inr(finalTotal)}</Text>
          </View>

          <TouchableOpacity
            style={[styles.placeOrderBtn, { backgroundColor: theme?.bg?.[1] || "#0f172a" }]}
            onPress={handlePlaceOrder}
          >
            <Text style={styles.placeOrderText}>Confirm & Pay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  container: { padding: 16, gap: 14 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    gap: 12,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a" },
  rowAlign: { flexDirection: "row", alignItems: "center" },
  actionText: { fontSize: 12, fontWeight: "700" },
  addressText: { fontSize: 13, color: "#475569", lineHeight: 18 },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    backgroundColor: "#f8fafc",
  },
  paymentOptionActive: { borderColor: "#0f172a", backgroundColor: "#fff" },
  paymentMethodTitle: { fontSize: 13, fontWeight: "700", color: "#0f172a" },
  paymentMethodSub: { fontSize: 10, color: "#94a3b8" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 13, color: "#64748b" },
  summaryValue: { fontSize: 13, fontWeight: "700", color: "#0f172a" },
  totalRow: { borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 10 },
  totalLabel: { fontSize: 14, fontWeight: "800", color: "#0f172a" },
  totalValue: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  footerSub: { fontSize: 10, color: "#94a3b8", fontWeight: "700" },
  footerPrice: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  placeOrderBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  placeOrderText: { color: "#fff", fontWeight: "800", fontSize: 13 },
});