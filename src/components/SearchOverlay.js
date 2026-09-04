import React, { useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useShop } from "../context/ShopContext";
import { inr } from "../utils/format";
import { titleCase } from "../theme/categoryThemes";

const QUICK_SUGGESTIONS = [
  "Sneakers",
  "Headphones",
  "Watch",
  "T-Shirt",
  "Jacket",
  "Backpack",
];

const PAGE_SIZE = 8;

function normalizeText(str) {
  if (!str) return "";

  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getLevenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array.from(
    { length: b.length + 1 },
    (_, i) => [i]
  );

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b.charAt(i - 1) === a.charAt(j - 1)
          ? matrix[i - 1][j - 1]
          : Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
    }
  }

  return matrix[b.length][a.length];
}

function getMaxAllowedDistance(wordLength) {
  if (wordLength <= 3) return 0;
  if (wordLength <= 5) return 1;
  if (wordLength <= 8) return 2;
  return 3;
}

function getFieldTokenScore(token, targetRawValue, fieldWeight) {
  if (!targetRawValue) return 0;

  const raw = String(targetRawValue).trim();
  const norm = normalizeText(raw);

  if (!norm) return 0;

  if (raw === token) return 100 * fieldWeight;
  if (raw.toLowerCase() === token) return 90 * fieldWeight;
  if (norm === token) return 80 * fieldWeight;

  if (norm.includes(token)) {
    const words = norm.split(" ");
    const isWordStart = words.some((w) => w.startsWith(token));

    return (isWordStart ? 65 : 50) * fieldWeight;
  }

  const targetWords = norm.split(" ").filter(Boolean);

  let bestFuzzyScore = 0;

  for (const word of targetWords) {
    if (word.includes(token) || token.includes(word)) {
      bestFuzzyScore = Math.max(
        bestFuzzyScore,
        40 * fieldWeight
      );
      continue;
    }

    const dist = getLevenshteinDistance(token, word);
    const maxDist = getMaxAllowedDistance(token.length);

    if (dist <= maxDist) {
      bestFuzzyScore = Math.max(
        bestFuzzyScore,
        (35 - dist * 8) * fieldWeight
      );
    }
  }

  return bestFuzzyScore;
}

function calculateProductScore(item, queryStr) {
  const normQuery = normalizeText(queryStr);

  if (!normQuery) return 0;

  const queryTokens = normQuery.split(" ").filter(Boolean);

  const fields = [
    {
      value: item.name || item.title || item.label,
      weight: 1.0,
    },
    {
      value: item.brand || item.vendor,
      weight: 0.8,
    },
    {
      value: item.category || item.cat || item.type,
      weight: 0.6,
    },
    {
      value: item.description || item.desc,
      weight: 0.3,
    },
  ];

  let totalProductScore = 0;

  for (const token of queryTokens) {
    let bestScoreForToken = 0;

    for (const { value, weight } of fields) {
      if (!value) continue;

      bestScoreForToken = Math.max(
        bestScoreForToken,
        getFieldTokenScore(token, value, weight)
      );
    }

    if (bestScoreForToken < 10) return 0;

    totalProductScore += bestScoreForToken;
  }

  return totalProductScore;
}

export default function SearchOverlay({
  visible,
  onClose,
  navigation,
}) {
  const shopContext = useShop();

  const rawProducts = useMemo(() => {
    if (
      Array.isArray(shopContext?.allProducts) &&
      shopContext.allProducts.length > 0
    ) {
      return shopContext.allProducts;
    }

    return shopContext?.products || [];
  }, [shopContext]);

  const theme = shopContext?.theme;
  const setSelectedProduct = shopContext?.setSelectedProduct;
  const addToCart = shopContext?.addToCart;
  const wishlist = shopContext?.wishlist || {};
  const toggleWishlist = shopContext?.toggleWishlist;
  const recentSearches = shopContext?.recentSearches || [];
  const submitSearch = shopContext?.submitSearch;
  const clearRecentSearches = shopContext?.clearRecentSearches;

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("relevance");
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const primaryColor =
    theme?.bg?.[1] || "#1d4ed8";

  const categories = useMemo(() => {
    if (!rawProducts.length) return ["All"];

    const cats = Array.from(
      new Set(
        rawProducts
          .map(
            (p) =>
              p?.category ||
              p?.cat ||
              p?.type
          )
          .filter(Boolean)
      )
    );

    return ["All", ...cats];
  }, [rawProducts]);

  const filteredProducts = useMemo(() => {
    if (!rawProducts.length) return [];

    if (
      !query.trim() &&
      selectedCategory === "All"
    ) {
      return [];
    }

    const categoryFiltered =
      rawProducts.filter((item) => {
        if (selectedCategory === "All") {
          return true;
        }

        return (
          normalizeText(
            item?.category ||
              item?.cat ||
              item?.type ||
              ""
          ) ===
          normalizeText(selectedCategory)
        );
      });

    if (!query.trim()) {
      return categoryFiltered;
    }

    const scored = categoryFiltered
      .map((item) => ({
        item,
        score: calculateProductScore(
          item,
          query
        ),
      }))
      .filter(
        (entry) => entry.score > 0
      );

    if (sortBy === "priceLow") {
      return scored
        .map((x) => x.item)
        .sort(
          (a, b) =>
            (a.price || 0) -
            (b.price || 0)
        );
    }

    if (sortBy === "priceHigh") {
      return scored
        .map((x) => x.item)
        .sort(
          (a, b) =>
            (b.price || 0) -
            (a.price || 0)
        );
    }

    if (sortBy === "rating") {
      return scored
        .map((x) => x.item)
        .sort(
          (a, b) =>
            (b.rating || 0) -
            (a.rating || 0)
        );
    }

    return scored
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item);
  }, [
    query,
    selectedCategory,
    rawProducts,
    sortBy,
  ]);

  const displayedProducts = useMemo(
    () =>
      filteredProducts.slice(
        0,
        visibleCount
      ),
    [filteredProducts, visibleCount]
  );

  const trendingSearches = useMemo(() => {
    const dynamic = rawProducts
      .filter(
        (p) => (p.rating || 0) >= 4.5
      )
      .slice(0, 6)
      .map((p) => p.title)
      .filter(Boolean);

    return Array.from(
      new Set([
        ...dynamic,
        ...QUICK_SUGGESTIONS,
      ])
    ).slice(0, 8);
  }, [rawProducts]);

  const typoSuggestion = useMemo(() => {
    if (
      !query.trim() ||
      filteredProducts.length > 0
    ) {
      return null;
    }

    const queryWord = normalizeText(
      query
    ).split(" ")[0];

    if (
      !queryWord ||
      queryWord.length < 4
    ) {
      return null;
    }

    let best = null;

    const candidates = Array.from(
      new Set(
        rawProducts
          .map((p) => p?.title)
          .filter(Boolean)
      )
    );

    candidates.forEach((candidate) => {
      const word = normalizeText(
        candidate
      ).split(" ")[0];

      if (!word) return;

      const distance =
        getLevenshteinDistance(
          queryWord,
          word
        );

      if (
        distance <=
        getMaxAllowedDistance(
          queryWord.length
        )
      ) {
        if (
          !best ||
          distance < best.distance
        ) {
          best = {
            text: candidate,
            distance,
          };
        }
      }
    });

    return best?.text || null;
  }, [
    query,
    filteredProducts.length,
    rawProducts,
  ]);

  const handleQueryChange = (text) => {
    setQuery(text);
    setVisibleCount(PAGE_SIZE);
    setLoading(Boolean(text));
  };

  const handleSearchSubmit = () => {
    const clean = query.trim();

    if (!clean) return;

    submitSearch?.(clean);
    Keyboard.dismiss();
    setLoading(false);
  };

  const runQuickSearch = (term) => {
    setQuery(term);
    setSelectedCategory("All");
    setSortBy("relevance");
    setVisibleCount(PAGE_SIZE);

    submitSearch?.(term);

    setLoading(false);
  };

  const handleCategorySelect = (
    category
  ) => {
    setSelectedCategory(category);
    setVisibleCount(PAGE_SIZE);
    setLoading(false);
  };

  const handleClear = () => {
    setQuery("");
    setSelectedCategory("All");
    setSortBy("relevance");
    setVisibleCount(PAGE_SIZE);

    Keyboard.dismiss();
  };

  const handleSelectProduct = (
    product
  ) => {
    Keyboard.dismiss();
    onClose();

    setSelectedProduct?.(product);
  };

  const hasMore =
    visibleCount <
    filteredProducts.length;

  const showHomeState =
    !query.trim() &&
    selectedCategory === "All";

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#f8fafc"
      />

      <SafeAreaView
        style={styles.container}
      >
        <View
          style={
            styles.headerContainer
          }
        >
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.backBtn}
              hitSlop={8}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color="#1e293b"
              />
            </TouchableOpacity>

            <View
              style={[
                styles.searchBar,
                loading && {
                  borderColor:
                    primaryColor,
                },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={19}
                color="#64748b"
              />

              <TextInput
                style={styles.input}
                placeholder="Search products, brands & more"
                placeholderTextColor="#94a3b8"
                value={query}
                onChangeText={
                  handleQueryChange
                }
                onSubmitEditing={
                  handleSearchSubmit
                }
                autoFocus
                returnKeyType="search"
              />

              {query.length > 0 && (
                <TouchableOpacity
                  onPress={handleClear}
                  hitSlop={8}
                >
                  <Ionicons
                    name="close-circle"
                    size={19}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {categories.length > 1 && (
            <FlatList
              horizontal
              data={categories}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.categoryList
              }
              renderItem={({ item }) => {
                const active =
                  selectedCategory === item;

                return (
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      active && {
                        backgroundColor:
                          primaryColor,
                        borderColor:
                          primaryColor,
                      },
                    ]}
                    onPress={() =>
                      handleCategorySelect(
                        item
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        active &&
                          styles.chipTextActive,
                      ]}
                    >
                      {item === "All"
                        ? "All"
                        : titleCase(item)}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>

        <View style={styles.body}>
          {showHomeState ? (
            <FlatList
              data={[]}
              renderItem={null}
              showsVerticalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.homeContent
              }
              ListHeaderComponent={
                <>
                  <View
                    style={styles.welcomeRow}
                  >
                    <View>
                      <Text
                        style={
                          styles.eyebrow
                        }
                      >
                        DISCOVER SOMETHING NEW
                      </Text>

                      <Text
                        style={
                          styles.heading
                        }
                      >
                        What are you
                        looking for?
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.searchIconBubble,
                        {
                          backgroundColor: `${primaryColor}14`,
                        },
                      ]}
                    >
                      <Ionicons
                        name="sparkles-outline"
                        size={22}
                        color={
                          primaryColor
                        }
                      />
                    </View>
                  </View>

                  {recentSearches.length >
                    0 && (
                    <View
                      style={styles.section}
                    >
                      <View
                        style={
                          styles.sectionHeader
                        }
                      >
                        <View
                          style={
                            styles.sectionTitleRow
                          }
                        >
                          <Ionicons
                            name="time-outline"
                            size={18}
                            color="#475569"
                          />

                          <Text
                            style={
                              styles.sectionTitle
                            }
                          >
                            Recent searches
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() =>
                            clearRecentSearches?.()
                          }
                        >
                          <Text
                            style={
                              styles.clearText
                            }
                          >
                            Clear all
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View
                        style={
                          styles.tagWrap
                        }
                      >
                        {recentSearches
                          .slice(0, 6)
                          .map((item) => (
                            <TouchableOpacity
                              key={item}
                              style={
                                styles.recentTag
                              }
                              onPress={() =>
                                runQuickSearch(
                                  item
                                )
                              }
                            >
                              <Ionicons
                                name="reload-outline"
                                size={14}
                                color="#64748b"
                              />

                              <Text
                                style={
                                  styles.tagText
                                }
                                numberOfLines={
                                  1
                                }
                              >
                                {item}
                              </Text>
                            </TouchableOpacity>
                          ))}
                      </View>
                    </View>
                  )}

                  <View
                    style={styles.section}
                  >
                    <View
                      style={
                        styles.sectionHeader
                      }
                    >
                      <View
                        style={
                          styles.sectionTitleRow
                        }
                      >
                        <Ionicons
                          name="trending-up"
                          size={18}
                          color={
                            primaryColor
                          }
                        />

                        <Text
                          style={
                            styles.sectionTitle
                          }
                        >
                          Popular searches
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.sectionHint
                        }
                      >
                        Trending now
                      </Text>
                    </View>

                    <View
                      style={
                        styles.tagWrap
                      }
                    >
                      {trendingSearches.map(
                        (item) => (
                          <TouchableOpacity
                            key={item}
                            style={
                              styles.suggestionTag
                            }
                            onPress={() =>
                              runQuickSearch(
                                item
                              )
                            }
                          >
                            <Ionicons
                              name="search-outline"
                              size={14}
                              color={
                                primaryColor
                              }
                            />

                            <Text
                              style={
                                styles.tagText
                              }
                              numberOfLines={
                                1
                              }
                            >
                              {item}
                            </Text>
                          </TouchableOpacity>
                        )
                      )}
                    </View>
                  </View>
                </>
              }
            />
          ) : (
            <FlatList
              data={displayedProducts}
              keyExtractor={(
                item,
                index
              ) =>
                item.id
                  ?.toString() ||
                item._id
                  ?.toString() ||
                index.toString()
              }
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={
                styles.resultsList
              }
              showsVerticalScrollIndicator={
                false
              }
              ListHeaderComponent={
                <>
                  <View
                    style={
                      styles.resultHeader
                    }
                  >
                    <View>
                      <Text
                        style={
                          styles.resultCount
                        }
                      >
                        {filteredProducts.length}{" "}
                        {filteredProducts.length ===
                        1
                          ? "result"
                          : "results"}
                      </Text>

                      <Text
                        style={
                          styles.resultQuery
                        }
                        numberOfLines={1}
                      >
                        {query.trim()
                          ? `for “${query.trim()}”`
                          : `in ${titleCase(
                              selectedCategory
                            )}`}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.sortWrap
                      }
                    >
                      {[
                        "relevance",
                        "priceLow",
                        "rating",
                      ].map((option) => {
                        const active =
                          sortBy === option;

                        const label =
                          option ===
                          "relevance"
                            ? "Best"
                            : option ===
                              "priceLow"
                            ? "Price"
                            : "Rating";

                        return (
                          <TouchableOpacity
                            key={option}
                            onPress={() => {
                              setSortBy(
                                option
                              );
                              setVisibleCount(
                                PAGE_SIZE
                              );
                            }}
                            style={[
                              styles.sortChip,
                              active && {
                                backgroundColor: `${primaryColor}12`,
                                borderColor: `${primaryColor}40`,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.sortText,
                                active && {
                                  color:
                                    primaryColor,
                                },
                              ]}
                            >
                              {label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {typoSuggestion && (
                    <TouchableOpacity
                      style={
                        styles.didYouMean
                      }
                      onPress={() =>
                        runQuickSearch(
                          typoSuggestion
                        )
                      }
                    >
                      <Ionicons
                        name="bulb-outline"
                        size={18}
                        color={
                          primaryColor
                        }
                      />

                      <Text
                        style={
                          styles.didYouMeanText
                        }
                      >
                        Did you mean{" "}
                        <Text
                          style={{
                            fontWeight:
                              "800",
                          }}
                        >
                          {typoSuggestion}
                        </Text>
                        ?
                      </Text>

                      <Ionicons
                        name="arrow-forward"
                        size={16}
                        color={
                          primaryColor
                        }
                      />
                    </TouchableOpacity>
                  )}
                </>
              }
              renderItem={({ item }) => {
                const itemName =
                  item.name ||
                  item.title ||
                  item.label ||
                  "Unnamed Product";

                const itemCat =
                  item.category ||
                  item.cat ||
                  item.type ||
                  "General";

                const itemPrice =
                  item.price ||
                  item.cost ||
                  0;

                const itemImage =
                  item.image ||
                  item.img ||
                  item.thumbnail;

                const inWishlist =
                  !!wishlist[item.id];

                return (
                  <TouchableOpacity
                    style={
                      styles.productCard
                    }
                    activeOpacity={0.86}
                    onPress={() =>
                      handleSelectProduct(
                        item
                      )
                    }
                  >
                    <View
                      style={
                        styles.productImageWrap
                      }
                    >
                      {itemImage ? (
                        <Image
                          source={{
                            uri: itemImage,
                          }}
                          style={
                            styles.productImg
                          }
                          resizeMode="contain"
                        />
                      ) : (
                        <Ionicons
                          name="image-outline"
                          size={28}
                          color="#cbd5e1"
                        />
                      )}
                    </View>

                    <View
                      style={
                        styles.productInfo
                      }
                    >
                      <Text
                        style={
                          styles.productCategory
                        }
                      >
                        {titleCase(itemCat)}
                      </Text>

                      <Text
                        style={
                          styles.productName
                        }
                        numberOfLines={2}
                      >
                        {itemName}
                      </Text>

                      <View
                        style={
                          styles.metaRow
                        }
                      >
                        <View
                          style={
                            styles.ratingPill
                          }
                        >
                          <Ionicons
                            name="star"
                            size={9}
                            color="#fff"
                          />

                          <Text
                            style={
                              styles.ratingText
                            }
                          >
                            {item.rating?.toFixed?.(
                              1
                            ) || "0.0"}
                          </Text>
                        </View>

                        <Text
                          style={
                            styles.stockText
                          }
                        >
                          {item.stock ?? 0}{" "}
                          left
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.productPrice
                        }
                      >
                        {inr(itemPrice)}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.productActions
                      }
                    >
                      <TouchableOpacity
                        style={
                          styles.heartBtn
                        }
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleWishlist?.(
                            item
                          );
                        }}
                      >
                        <Ionicons
                          name={
                            inWishlist
                              ? "heart"
                              : "heart-outline"
                          }
                          size={17}
                          color={
                            inWishlist
                              ? primaryColor
                              : "#64748b"
                          }
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.miniCartBtn,
                          {
                            backgroundColor:
                              primaryColor,
                          },
                        ]}
                        onPress={(e) => {
                          e.stopPropagation();
                          addToCart?.(
                            item
                          );
                        }}
                      >
                        <Ionicons
                          name="add"
                          size={18}
                          color="#fff"
                        />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListFooterComponent={
                hasMore ? (
                  <View
                    style={
                      styles.paginationFooter
                    }
                  >
                    <Text
                      style={
                        styles.counterText
                      }
                    >
                      Showing{" "}
                      {
                        displayedProducts.length
                      }{" "}
                      of{" "}
                      {
                        filteredProducts.length
                      }
                    </Text>

                    <TouchableOpacity
                      style={[
                        styles.showMoreBtn,
                        {
                          backgroundColor:
                            primaryColor,
                        },
                      ]}
                      onPress={() =>
                        setVisibleCount(
                          (v) =>
                            v + PAGE_SIZE
                        )
                      }
                    >
                      <Text
                        style={
                          styles.showMoreBtnText
                        }
                      >
                        Show more
                      </Text>

                      <Ionicons
                        name="chevron-down"
                        size={15}
                        color="#fff"
                      />
                    </TouchableOpacity>
                  </View>
                ) : displayedProducts.length >
                  0 ? (
                  <View
                    style={styles.endState}
                  >
                    <View
                      style={
                        styles.endLine
                      }
                    />

                    <Text
                      style={
                        styles.endText
                      }
                    >
                      You’ve reached the
                      end
                    </Text>

                    <View
                      style={
                        styles.endLine
                      }
                    />
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <View
                  style={
                    styles.emptyContainer
                  }
                >
                  {loading ? (
                    <ActivityIndicator
                      size="large"
                      color={
                        primaryColor
                      }
                    />
                  ) : (
                    <Ionicons
                      name="search-outline"
                      size={48}
                      color="#cbd5e1"
                    />
                  )}

                  <Text
                    style={
                      styles.emptyTitle
                    }
                  >
                    {loading
                      ? "Searching the store…"
                      : "No products found"}
                  </Text>

                  <Text
                    style={
                      styles.emptySub
                    }
                  >
                    {rawProducts.length ===
                    0
                      ? "Loading products inventory…"
                      : `Nothing matched “${query}”. Try another spelling or category.`}
                  </Text>

                  {query.trim() && (
                    <TouchableOpacity
                      style={[
                        styles.clearSearchBtn,
                        {
                          borderColor: `${primaryColor}50`,
                        },
                      ]}
                      onPress={
                        handleClear
                      }
                    >
                      <Text
                        style={[
                          styles.clearSearchText,
                          {
                            color:
                              primaryColor,
                          },
                        ]}
                      >
                        Clear search
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              }
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  headerContainer: {
    backgroundColor: "#fff",
    paddingTop: 6,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 3,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 8,
  },

  backBtn: {
    width: 38,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
  },

  searchBar: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
    paddingHorizontal: 13,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
  },

  input: {
    flex: 1,
    color: "#0f172a",
    fontSize: 14,
    paddingVertical: 7,
  },

  categoryList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  chipText: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
  },

  chipTextActive: {
    color: "#fff",
  },

  body: {
    flex: 1,
  },

  homeContent: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 40,
  },

  welcomeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 26,
  },

  eyebrow: {
    fontSize: 9,
    letterSpacing: 1.1,
    fontWeight: "800",
    color: "#94a3b8",
    marginBottom: 5,
  },

  heading: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: "#0f172a",
    maxWidth: 285,
  },

  searchIconBubble: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  section: {
    marginBottom: 28,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#172033",
  },

  sectionHint: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "600",
  },

  clearText: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "700",
  },

  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  recentTag: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  suggestionTag: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#fff",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 13,
    paddingVertical: 10,
    shadowColor: "#0f172a",
    shadowOpacity: 0.03,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 1,
  },

  tagText: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "600",
  },

  resultsList: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 36,
  },

  resultHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 13,
  },

  resultCount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },

  resultQuery: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 3,
    maxWidth: 180,
  },

  sortWrap: {
    flexDirection: "row",
    gap: 5,
    marginLeft: 8,
  },

  sortChip: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  sortText: {
    fontSize: 9,
    color: "#64748b",
    fontWeight: "800",
  },

  didYouMean: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },

  didYouMeanText: {
    flex: 1,
    color: "#475569",
    fontSize: 11,
  },

  productCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eef2f7",
    shadowColor: "#0f172a",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 1,
  },

  productImageWrap: {
    width: 76,
    height: 76,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },

  productImg: {
    width: "88%",
    height: "88%",
  },

  productInfo: {
    flex: 1,
    marginLeft: 11,
    marginRight: 7,
  },

  productCategory: {
    fontSize: 8,
    color: "#94a3b8",
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 2,
  },

  productName: {
    fontSize: 13,
    color: "#172033",
    fontWeight: "700",
    lineHeight: 18,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 5,
  },

  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#059669",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },

  ratingText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "800",
  },

  stockText: {
    color: "#94a3b8",
    fontSize: 9,
  },

  productPrice: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },

  productActions: {
    alignItems: "center",
    justifyContent: "space-between",
    height: 76,
  },

  heartBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },

  miniCartBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  paginationFooter: {
    alignItems: "center",
    gap: 10,
    marginTop: 5,
    marginBottom: 16,
  },

  counterText: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "600",
  },

  showMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 18,
    paddingHorizontal: 19,
    paddingVertical: 10,
  },

  showMoreBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },

  endState: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingVertical: 14,
  },

  endLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e2e8f0",
  },

  endText: {
    fontSize: 9,
    color: "#94a3b8",
    fontWeight: "700",
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 70,
    paddingHorizontal: 25,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 14,
  },

  emptySub: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
    marginTop: 7,
    lineHeight: 17,
  },

  clearSearchBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },

  clearSearchText: {
    fontSize: 11,
    fontWeight: "800",
  },
});