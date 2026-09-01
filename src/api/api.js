const BASE = "https://dummyjson.com";

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export const fetchCategories = () => getJSON(`${BASE}/products/categories`);

export const fetchProducts = (limit = 20) =>
  getJSON(`${BASE}/products?limit=${limit}`).then((d) => d.products || []);

/** Fetch the full catalog (limit=0 returns everything) for building a
 * local, instant, typo-tolerant search index. */
export const fetchAllProducts = () =>
  getJSON(`${BASE}/products?limit=0`).then((d) => d.products || []);

export const fetchProductsByCategory = (slug, limit = 20) =>
  getJSON(`${BASE}/products/category/${slug}?limit=${limit}`).then((d) => d.products || []);

export const searchProducts = (q) =>
  getJSON(`${BASE}/products/search?q=${encodeURIComponent(q)}`).then((d) => d.products || []);
