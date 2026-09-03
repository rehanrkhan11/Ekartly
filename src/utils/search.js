import Fuse from "fuse.js";

/**
 * Normalizes input text:
 * - Strips diacritics/accents (café -> cafe)
 * - Lowercases
 * - Replaces hyphens/punctuation with space or empty strings
 * - Collapses whitespace
 */
export function normalizeText(str) {
  if (!str) return "";
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents/diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")     // Replace punctuation (e.g. i-phone -> i phone)
    .replace(/\s+/g, " ")             // Collapse multiple spaces
    .trim();
}

/**
 * Pre-processes items before indexing so Fuse can match 
 * against normalized title, brand, category, and description.
 */
function prepareItemForIndex(item) {
  if (!item) return item;

  const rawTitle = item.title || item.name || item.label || "";
  const rawBrand = item.brand || item.vendor || "";
  const rawCategory = item.category || item.cat || item.type || "";
  const rawDesc = item.description || item.desc || "";

  return {
    ...item,
    // Original fields kept intact for UI rendering
    title: rawTitle,
    brand: rawBrand,
    category: rawCategory,
    description: rawDesc,
    // Normalized mirror fields for high-accuracy Fuse search
    _normTitle: normalizeText(rawTitle),
    _normBrand: normalizeText(rawBrand),
    _normCategory: normalizeText(rawCategory),
    _normDesc: normalizeText(rawDesc),
  };
}

const FUSE_OPTIONS = {
  keys: [
    { name: "_normTitle", weight: 0.5 },
    { name: "_normBrand", weight: 0.25 },
    { name: "_normCategory", weight: 0.15 },
    { name: "_normDesc", weight: 0.1 },
  ],
  threshold: 0.35, // Balanced threshold for fuzziness without false positives
  distance: 100,
  ignoreLocation: true, // Searches full string regardless of match position
  includeScore: true,   // Enables ranking by match quality (0 = exact, 1 = worst)
  minMatchCharLength: 1,
  useExtendedSearch: false,
};

let fuseInstance = null;
let indexedProducts = [];

/** Build (or rebuild) the searchable index from a product list. */
export function buildSearchIndex(products = []) {
  const rawArr = Array.isArray(products) ? products : [];
  indexedProducts = rawArr.map(prepareItemForIndex);
  fuseInstance = new Fuse(indexedProducts, FUSE_OPTIONS);
}

export function hasSearchIndex() {
  return !!fuseInstance && indexedProducts.length > 0;
}

export function getIndexedProducts() {
  return indexedProducts;
}

/**
 * Run fuzzy, case-insensitive, accent-tolerant search against indexed items.
 * Exact matches rank highest due to Fuse's internal score sorting.
 */
export function searchLocal(query, limit = 50, selectedCategory = "All") {
  const cleanQuery = normalizeText(query);

  if (!indexedProducts || indexedProducts.length === 0) return [];

  // Filter by category first if specified
  let targetProducts = indexedProducts;
  if (selectedCategory && selectedCategory !== "All") {
    const cleanCategory = normalizeText(selectedCategory);
    targetProducts = indexedProducts.filter(
      (item) => item._normCategory === cleanCategory
    );
  }

  // If query is empty, return category items or empty list
  if (!cleanQuery) {
    return selectedCategory === "All" ? [] : targetProducts;
  }

  // Re-instantiate query scoped index if category filtered, otherwise use global instance
  const activeFuse =
    selectedCategory !== "All"
      ? new Fuse(targetProducts, FUSE_OPTIONS)
      : fuseInstance;

  if (!activeFuse) return [];

  const results = activeFuse.search(cleanQuery);

  return results
    .slice(0, limit)
    .map((result) => result.item);
}