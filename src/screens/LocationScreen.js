import React, { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useShop } from "../context/ShopContext";
import { searchLocations } from "../api/locationApi";

export default function LocationScreen({ navigation }) {
  const {
    theme,
    selectedAddress,
    savedAddresses,
    setSelectedAddress,
    addAddress,
    deleteAddress,
    useDeviceLocation,
    locationLoading,
  } = useShop();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // New Address Form Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [label, setLabel] = useState("Home");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  const primaryColor = theme?.bg?.[1] || "#0f172a";

  // Perform Location Search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const res = await searchLocations(searchQuery);
      setSearchResults(res);
      setSearching(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectLocation = useCallback(
    (item) => {
      setSelectedAddress(item);
      navigation.goBack();
    },
    [setSelectedAddress, navigation]
  );

  const handleUseCurrentLocation = async () => {
    const loc = await useDeviceLocation();
    if (loc) {
      navigation.goBack();
    }
  };

  const handleSaveNewAddress = () => {
    if (!address.trim() || !city.trim() || !pincode.trim()) {
      return;
    }
    const newAddr = {
      id: `custom-${Date.now()}`,
      label,
      address,
      city,
      pincode,
      latitude: null,
      longitude: null,
    };
    addAddress(newAddr);
    setSelectedAddress(newAddr);
    setModalVisible(false);
    setAddress("");
    setCity("");
    setPincode("");
    navigation.goBack();
  };

  return (
    <View style={styles.flex}>
      <LinearGradient colors={theme?.bg || ["#1e3a8a", "#0f172a"]} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Select Delivery Location</Text>
            <View style={{ width: 32 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.body}>
        {/* Search Bar */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search area, street, or landmark..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#cbd5e1" />
            </TouchableOpacity>
          )}
        </View>

        {searchQuery.length >= 3 ? (
          <View style={styles.searchResultsContainer}>
            {searching ? (
              <ActivityIndicator size="small" color={primaryColor} style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.searchResultItem}
                    onPress={() => handleSelectLocation(item)}
                  >
                    <Ionicons name="location-outline" size={20} color={primaryColor} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.searchResultTitle}>{item.label}</Text>
                      <Text style={styles.searchResultSub} numberOfLines={1}>
                        {item.address}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No locations found for "{searchQuery}"</Text>
                }
              />
            )}
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Device GPS Button */}
            <TouchableOpacity
              style={styles.gpsBtn}
              onPress={handleUseCurrentLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color="#0284c7" />
              ) : (
                <Ionicons name="navigate-circle-outline" size={24} color="#0284c7" />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.gpsTitle}>Use Current Location</Text>
                <Text style={styles.gpsSub}>Using GPS for accurate delivery</Text>
              </View>
            </TouchableOpacity>

            {/* Saved Addresses Section */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Saved Addresses</Text>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Text style={[styles.addBtnText, { color: primaryColor }]}>+ Add New</Text>
              </TouchableOpacity>
            </View>

            {savedAddresses?.map((item) => {
              const isSelected = selectedAddress?.id === item.id;
              return (
                <View
                  key={item.id}
                  style={[styles.addressCard, isSelected && { borderColor: primaryColor }]}
                >
                  <TouchableOpacity
                    style={{ flex: 1, flexDirection: "row", gap: 12, alignItems: "center" }}
                    onPress={() => handleSelectLocation(item)}
                  >
                    <Ionicons
                      name={isSelected ? "radio-button-on" : "radio-button-off"}
                      size={20}
                      color={isSelected ? primaryColor : "#94a3b8"}
                    />
                    <View style={{ flex: 1 }}>
                      <View style={styles.badgeRow}>
                        <Text style={styles.cardLabel}>{item.label}</Text>
                        {isSelected && (
                          <View style={[styles.activeBadge, { backgroundColor: primaryColor }]}>
                            <Text style={styles.activeBadgeText}>SELECTED</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.cardAddress}>{item.address}</Text>
                      <Text style={styles.cardCity}>
                        {item.city} {item.pincode ? `- ${item.pincode}` : ""}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {savedAddresses.length > 1 && (
                    <TouchableOpacity
                      onPress={() => deleteAddress(item.id)}
                      hitSlop={8}
                      style={styles.deleteBtn}
                    >
                      <Ionicons name="trash-outline" size={16} color="#f43f5e" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Add New Address Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Delivery Address</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={20} color="#334155" />
              </TouchableOpacity>
            </View>

            {/* Label Chips */}
            <Text style={styles.inputLabel}>Label</Text>
            <View style={styles.chipRow}>
              {["Home", "Work", "Other"].map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[
                    styles.chip,
                    label === l && { backgroundColor: primaryColor, borderColor: primaryColor },
                  ]}
                  onPress={() => setLabel(l)}
                >
                  <Text style={[styles.chipText, label === l && { color: "#fff" }]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Full Address / Area</Text>
            <TextInput
              style={styles.modalInput}
              value={address}
              onChangeText={setAddress}
              placeholder="Flat, House no., Building, Street"
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.modalInput}
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. Greater Noida"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Pincode</Text>
                <TextInput
                  style={styles.modalInput}
                  value={pincode}
                  onChangeText={setPincode}
                  keyboardType="number-pad"
                  placeholder="e.g. 201310"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: primaryColor }]}
              onPress={handleSaveNewAddress}
            >
              <Text style={styles.saveBtnText}>Save & Select Address</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f8fafc" },
  header: { paddingBottom: 16 },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  iconBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#fff" },
  body: { flex: 1, padding: 16 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: { flex: 1, fontSize: 13, color: "#0f172a" },
  scrollContent: { paddingTop: 16, paddingBottom: 30 },
  gpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f0f9ff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#bae6fd",
    marginBottom: 20,
  },
  gpsTitle: { fontWeight: "800", fontSize: 13, color: "#0369a1" },
  gpsSub: { fontSize: 11, color: "#0284c7" },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: "#1e293b" },
  addBtnText: { fontSize: 12, fontWeight: "800" },
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
    elevation: 1,
  },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  cardLabel: { fontWeight: "800", fontSize: 13, color: "#0f172a" },
  activeBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  activeBadgeText: { fontSize: 8, fontWeight: "800", color: "#fff" },
  cardAddress: { fontSize: 12, color: "#334155" },
  cardCity: { fontSize: 11, color: "#94a3b8", marginTop: 1 },
  deleteBtn: { padding: 6 },
  searchResultsContainer: { flex: 1, marginTop: 10 },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  searchResultTitle: { fontSize: 13, fontWeight: "700", color: "#0f172a" },
  searchResultSub: { fontSize: 11, color: "#64748b" },
  emptyText: { textAlign: "center", color: "#94a3b8", marginTop: 20, fontSize: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  modalTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  inputLabel: { fontSize: 11, fontWeight: "700", color: "#64748b" },
  modalInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#0f172a",
  },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  chipText: { fontSize: 12, fontWeight: "700", color: "#334155" },
  saveBtn: { borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 10 },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
});