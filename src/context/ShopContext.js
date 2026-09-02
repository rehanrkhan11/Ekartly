import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { fetchAllProducts, fetchCategories, fetchProducts, fetchProductsByCategory, searchProducts } from "../api/api";
import { reverseGeocode } from "../api/locationApi";
import { themeForCategory, THEMES } from "../theme/categoryThemes";
import { buildSearchIndex, hasSearchIndex, searchLocal } from "../utils/search";

const MAX_RECENT_SEARCHES = 8;

const DEFAULT_ADDRESS = {
  id: "default-connaught",
  label: "Home",
  address: "Connaught Place",
  city: "New Delhi",
  pincode: "110001",
  latitude: 28.6315,
  longitude: 77.2167,
};

const DEFAULT_SAVED_ADDRESSES = [
  DEFAULT_ADDRESS,
  {
    id: "default-noida",
    label: "Work",
    address: "Sector 62",
    city: "Noida",
    pincode: "201309",
    latitude: 28.628,
    longitude: 77.3649,
  },
];

const FALLBACK_PRODUCTS = [
  {
    id: 101,
    title: "Wireless Noise Cancelling Headphones",
    price: 1999,
    rating: 4.5,
    thumbnail: "https://dummyjson.com/image/400x400/008080/ffffff?text=Headphones",
  },
  {
    id: 102,
    title: "Smart Fitness Watch Series 5",
    price: 2499,
    rating: 4.8,
    thumbnail: "https://dummyjson.com/image/400x400/0f172a/ffffff?text=Smartwatch",
  },
  {
    id: 103,
    title: "Ergonomic Wireless Mouse",
    price: 799,
    rating: 4.2,
    thumbnail: "https://dummyjson.com/image/400x400/334155/ffffff?text=Mouse",
  },
  {
    id: 104,
    title: "Mechanical Gaming Keyboard",
    price: 3299,
    rating: 4.7,
    thumbnail: "https://dummyjson.com/image/400x400/1e293b/ffffff?text=Keyboard",
  },
];

const STORAGE_KEYS = {
  CART: "@app_cart",
  WISHLIST: "@app_wishlist",
  RECENT_SEARCHES: "@app_recent_searches",
  SELECTED_ADDRESS: "@app_selected_address",
  SAVED_ADDRESSES: "@app_saved_addresses",
};

const ShopContext = createContext(null);

export function ShopProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [wishlist, setWishlist] = useState({});
  const [cart, setCart] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toast, setToast] = useState("");

  // Location State
  const [selectedAddress, setSelectedAddressState] = useState(DEFAULT_ADDRESS);
  const [savedAddresses, setSavedAddresses] = useState(DEFAULT_SAVED_ADDRESSES);
  const [locationLoading, setLocationLoading] = useState(false);

  const toastTimer = useRef(null);
  const searchTimer = useRef(null);

  const theme = activeCategory ? themeForCategory(activeCategory) : THEMES.snow;

  const flashToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1600);
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(toastTimer.current);
      clearTimeout(searchTimer.current);
    };
  }, []);

  // Hydrate stored data
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const [storedCart, storedWishlist, storedRecent, storedAddress, storedSavedAddresses] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.CART),
            AsyncStorage.getItem(STORAGE_KEYS.WISHLIST),
            AsyncStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES),
            AsyncStorage.getItem(STORAGE_KEYS.SELECTED_ADDRESS),
            AsyncStorage.getItem(STORAGE_KEYS.SAVED_ADDRESSES),
          ]);

        if (storedCart) setCart(JSON.parse(storedCart));
        if (storedWishlist) setWishlist(JSON.parse(storedWishlist));
        if (storedRecent) setRecentSearches(JSON.parse(storedRecent));
        if (storedAddress) setSelectedAddressState(JSON.parse(storedAddress));
        if (storedSavedAddresses) setSavedAddresses(JSON.parse(storedSavedAddresses));
      } catch (e) {
        console.warn("Failed to load local storage data", e);
      }
    };

    loadStoredData();
  }, []);

  // Save Cart
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart)).catch((e) =>
      console.warn("Failed to save cart", e)
    );
  }, [cart]);

  // Save Wishlist
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlist)).catch((e) =>
      console.warn("Failed to save wishlist", e)
    );
  }, [wishlist]);

  // Save Recent Searches
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(recentSearches)).catch(
      (e) => console.warn("Failed to save recent searches", e)
    );
  }, [recentSearches]);

  // Save Selected Address
  useEffect(() => {
    if (selectedAddress) {
      AsyncStorage.setItem(STORAGE_KEYS.SELECTED_ADDRESS, JSON.stringify(selectedAddress)).catch(
        (e) => console.warn("Failed to save selected address", e)
      );
    }
  }, [selectedAddress]);

  // Save Saved Addresses
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.SAVED_ADDRESSES, JSON.stringify(savedAddresses)).catch((e) =>
      console.warn("Failed to save saved addresses", e)
    );
  }, [savedAddresses]);

  // Location Handlers
  const setSelectedAddress = useCallback((addr) => {
    setSelectedAddressState(addr);
    flashToast(`Delivering to ${addr.pincode || addr.city || "new location"}`);
  }, [flashToast]);

  const addAddress = useCallback((newAddr) => {
    const formatted = {
      ...newAddr,
      id: newAddr.id || `addr-${Date.now()}`,
    };
    setSavedAddresses((prev) => [formatted, ...prev]);
    setSelectedAddressState(formatted);
    flashToast("Address saved!");
  }, [flashToast]);

  const deleteAddress = useCallback((id) => {
    setSavedAddresses((prev) => {
      const filtered = prev.filter((a) => a.id !== id);
      return filtered;
    });
    flashToast("Address removed");
  }, [flashToast]);

  const useDeviceLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        flashToast("Location permission denied");
        setLocationLoading(false);
        return false;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;

      const reverseAddr = await reverseGeocode(latitude, longitude);
      if (reverseAddr) {
        setSelectedAddressState(reverseAddr);
        flashToast(`Location updated: ${reverseAddr.pincode}`);
        setLocationLoading(false);
        return reverseAddr;
      } else {
        const fallback = {
          id: `gps-${Date.now()}`,
          label: "Current Location",
          address: "GPS Location",
          city: "Near You",
          pincode: "Detecting",
          latitude,
          longitude,
        };
        setSelectedAddressState(fallback);
        flashToast("Location updated from GPS");
        setLocationLoading(false);
        return fallback;
      }
    } catch (err) {
      console.warn("Location error:", err);
      flashToast("Failed to retrieve current location");
      setLocationLoading(false);
      return false;
    }
  }, [flashToast]);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, prods] = await Promise.all([fetchCategories(), fetchProducts(20)]);
      setCategories(Array.isArray(cats) ? cats.slice(0, 14) : []);
      setProducts(Array.isArray(prods) && prods.length > 0 ? prods : FALLBACK_PRODUCTS);
    } catch (e) {
      console.warn("bootstrap failed, using fallback data", e);
      setProducts(FALLBACK_PRODUCTS);
    } finally {
      setLoading(false);
    }

    try {
      const everything = await fetchAllProducts();
      if (Array.isArray(everything) && everything.length > 0) {
        setAllProducts(everything);
        buildSearchIndex(everything);
      } else {
        setAllProducts(FALLBACK_PRODUCTS);
      }
    } catch (e) {
      console.warn("search index build failed", e);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const selectCategory = useCallback(async (slug) => {
    setActiveCategory(slug);
    setQuery("");
    setSearchActive(false);
    setLoading(true);
    try {
      const prods = slug ? await fetchProductsByCategory(slug, 20) : await fetchProducts(20);
      setProducts(Array.isArray(prods) && prods.length > 0 ? prods : FALLBACK_PRODUCTS);
    } catch (e) {
      console.warn("category fetch failed", e);
      setProducts(FALLBACK_PRODUCTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setSearching(false);
      return undefined;
    }
    setSearching(true);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      try {
        if (hasSearchIndex()) {
          setProducts(searchLocal(query, 100));
        } else {
          const results = await searchProducts(query);
          setProducts(Array.isArray(results) ? results : []);
        }
      } catch (e) {
        console.warn("search failed", e);
      } finally {
        setSearching(false);
      }
    }, 120);
    return () => clearTimeout(searchTimer.current);
  }, [query]);

  const openSearch = useCallback(() => setSearchActive(true), []);

  const closeSearch = useCallback(() => {
    setSearchActive(false);
    setQuery("");
  }, []);

  const submitSearch = useCallback((term) => {
    const clean = (term || "").trim();
    if (!clean) return;
    setQuery(clean);
    setRecentSearches((prev) => {
      const deduped = prev.filter((s) => s.toLowerCase() !== clean.toLowerCase());
      return [clean, ...deduped].slice(0, MAX_RECENT_SEARCHES);
    });
  }, []);

  const removeRecentSearch = useCallback((term) => {
    setRecentSearches((prev) => prev.filter((s) => s !== term));
  }, []);

  const clearRecentSearches = useCallback(() => setRecentSearches([]), []);

  const trendingSearches = allProducts
    .filter((p) => (p.rating || 0) >= 4.5)
    .slice(0, 8)
    .map((p) => p.title);

  const toggleWishlist = useCallback(
    (product) => {
      setWishlist((w) => {
        const next = { ...w };
        if (next[product.id]) {
          delete next[product.id];
          flashToast("Removed from wishlist");
        } else {
          next[product.id] = product;
          flashToast("Added to wishlist");
        }
        return next;
      });
    },
    [flashToast]
  );

  const addToCart = useCallback(
    (product, qty = 1) => {
      setCart((c) => {
        const existing = c[product.id];
        const newQty = (existing?.qty || 0) + qty;
        return { ...c, [product.id]: { product, qty: newQty } };
      });
      flashToast(`${qty} item${qty > 1 ? "s" : ""} added to cart`);
    },
    [flashToast]
  );

  const changeQty = useCallback((id, delta) => {
    setCart((c) => {
      const item = c[id];
      if (!item) return c;
      const qty = item.qty + delta;
      const next = { ...c };
      if (qty <= 0) delete next[id];
      else next[id] = { ...item, qty };
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart({});
  }, []);

  const cartItems = Object.values(cart);
  const wishlistItems = Object.values(wishlist);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cartItems.reduce((s, i) => s + i.qty * i.product.price, 0);

  const value = {
    categories,
    activeCategory,
    products,
    loading,
    query,
    setQuery,
    searching,
    theme,
    bootstrap,
    selectCategory,
    searchActive,
    openSearch,
    closeSearch,
    submitSearch,
    recentSearches,
    removeRecentSearch,
    clearRecentSearches,
    trendingSearches,
    wishlist,
    wishlistItems,
    toggleWishlist,
    cart,
    cartItems,
    cartCount,
    cartTotal,
    addToCart,
    changeQty,
    clearCart,
    selectedProduct,
    setSelectedProduct,
    toast,
    flashToast,
    // Location exports
    selectedAddress,
    savedAddresses,
    setSelectedAddress,
    addAddress,
    deleteAddress,
    useDeviceLocation,
    locationLoading,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export const useShop = () => {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within a ShopProvider");
  return ctx;
};