import Fuse from "fuse.js";

/**
 * Advanced client-side search.
 * - Case-insensitive by default (Fuse normalizes case internally).
 * - Typo tolerant: threshold controls how "fuzzy" a match can be.
 */
const FUSE_OPTIONS = {
  keys: [
    { name: "title", weight: 0.5 },
    { name: "brand", weight: 0.25 },
    { name: "category", weight: 0.15 },
    { name: "description", weight: 0.1 },
  ],
  threshold: 0.4,
  distance: 100,
  ignoreLocation: true,
  includeScore: true,
  minMatchCharLength: 1,
};

let fuseInstance = null;
let indexedProducts = [];

/** Build (or rebuild) the searchable index from a product list. */
export function buildSearchIndex(products = []) {
  indexedProducts = Array.isArray(products) ? products : [];
  fuseInstance = new Fuse(indexedProducts, FUSE_OPTIONS);
}

export function hasSearchIndex() {
  return !!fuseInstance && indexedProducts.length > 0;
}

export function getIndexedProducts() {
  return indexedProducts;
}

/**
 * Run a fuzzy search against the current index.
 * Returns plain product objects (best match first).
 */
export function searchLocal(query, limit = 20) {
  const q = (query || "").trim();
  if (!fuseInstance || !q) return [];
  return fuseInstance
    .search(q)
    .slice(0, limit)
    .map((r) => r.item);
}