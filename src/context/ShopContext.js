import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchAllProducts, fetchCategories, fetchProducts, fetchProductsByCategory, searchProducts } from "../api/api";
import { themeForCategory, THEMES } from "../theme/categoryThemes";
import { buildSearchIndex, hasSearchIndex, searchLocal } from "../utils/search";

const MAX_RECENT_SEARCHES = 8;

// Reliable fallback data if network request or API endpoint fails
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

// Storage Keys
const STORAGE_KEYS = {
  CART: "@app_cart",
  WISHLIST: "@app_wishlist",
  RECENT_SEARCHES: "@app_recent_searches",
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
  const toastTimer = useRef(null);
  const searchTimer = useRef(null);

  const theme = activeCategory ? themeForCategory(activeCategory) : THEMES.snow;

  const flashToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1600);
  }, []);

  // ----------------------------------------------------
  // Load Persisted Data on Initial Boot
  // ----------------------------------------------------
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const [storedCart, storedWishlist, storedRecent] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.CART),
          AsyncStorage.getItem(STORAGE_KEYS.WISHLIST),
          AsyncStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES),
        ]);

        if (storedCart) setCart(JSON.parse(storedCart));
        if (storedWishlist) setWishlist(JSON.parse(storedWishlist));
        if (storedRecent) setRecentSearches(JSON.parse(storedRecent));
      } catch (e) {
        console.warn("Failed to load local storage data", e);
      }
    };

    loadStoredData();
  }, []);

  // ----------------------------------------------------
  // Persist State Updates
  // ----------------------------------------------------
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart)).catch((e) =>
      console.warn("Failed to save cart", e)
    );
  }, [cart]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlist)).catch((e) =>
      console.warn("Failed to save wishlist", e)
    );
  }, [wishlist]);

  useEffect(() => {
    AsyncStorage.setItem(
      STORAGE_KEYS.RECENT_SEARCHES,
      JSON.stringify(recentSearches)
    ).catch((e) => console.warn("Failed to save recent searches", e));
  }, [recentSearches]);

  // ----------------------------------------------------
  // API Bootstrapping
  // ----------------------------------------------------
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

  // Run bootstrap on component mount
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

  // Live Search Effect
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
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export const useShop = () => {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within a ShopProvider");
  return ctx;
};