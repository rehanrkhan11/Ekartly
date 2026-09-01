import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useShop } from "../context/ShopContext";
import ScreenHeader from "../components/ScreenHeader";

export default function AccountScreen() {
  const { theme, cartCount, wishlistItems, flashToast } = useShop();

  const menuSections = [
    {
      title: "My Orders",
      items: [
        { icon: "cube-outline", label: "Active Orders", badge: "2" },
        { icon: "time-outline", label: "Order History", badge: null },
        { icon: "refresh-outline", label: "Returns & Refunds", badge: null },
      ],
    },
    {
      title: "Account Settings",
      items: [
        { icon: "location-outline", label: "Saved Addresses", badge: "1" },
        { icon: "card-outline", label: "Payment Methods", badge: null },
        { icon: "notifications-outline", label: "Notification Preferences", badge: null },
      ],
    },
    {
      title: "App & Support",
      items: [
        { icon: "help-circle-outline", label: "Help Center & FAQs", badge: null },
        { icon: "shield-checkmark-outline", label: "Privacy Policy", badge: null },
        { icon: "log-out-outline", label: "Log Out", badge: null, color: "#f43f5e" },
      ],
    },
  ];

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Account" />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: theme.bg[1] }]}>
            <Text style={styles.avatarText}>RK</Text>
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.userName}>Rehan Raza Khan</Text>
            <Text style={styles.userEmail}>rehan@example.com</Text>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => flashToast("Edit Profile clicked")}
          >
            <Ionicons name="pencil" size={14} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats Banner */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{cartCount}</Text>
            <Text style={styles.statLabel}>Cart Items</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{wishlistItems.length}</Text>
            <Text style={styles.statLabel}>Saved Items</Text>
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sIdx) => (
          <View key={sIdx} style={styles.section}>
            <Text style={styles.sectionHeader}>{section.title}</Text>
            <View style={styles.menuGroup}>
              {section.items.map((item, iIdx) => (
                <TouchableOpacity
                  key={iIdx}
                  style={[
                    styles.menuItem,
                    iIdx < section.items.length - 1 && styles.menuBorder,
                  ]}
                  onPress={() => flashToast(`${item.label} pressed`)}
                >
                  <View style={styles.menuLeft}>
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={item.color || "#475569"}
                    />
                    <Text style={[styles.menuLabel, item.color && { color: item.color }]}>
                      {item.label}
                    </Text>
                  </View>

                  <View style={styles.menuRight}>
                    {item.badge && (
                      <View style={[styles.badge, { backgroundColor: theme.bg[1] }]}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f8fafc" },
  container: { padding: 16, gap: 16 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  profileMeta: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  userEmail: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    justify: "center",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  statBox: { flex: 1, alignItems: "center" },
  statNumber: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  statLabel: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  statDivider: { width: 1, height: "60%", backgroundColor: "#e2e8f0", alignSelf: "center" },
  section: { gap: 8 },
  sectionHeader: { fontSize: 11, fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", paddingLeft: 4 },
  menuGroup: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuLabel: { fontSize: 13, fontWeight: "600", color: "#334155" },
  menuRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
});