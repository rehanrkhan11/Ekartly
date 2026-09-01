// Each theme drives the header gradient, particle field color, and accent tint.
export const THEMES = {
  snow: { name: "Snow", bg: ["#0f2f66", "#1c4fa3"], accent: "#eaf3ff", glow: "#bfe0ff", symbol: "❄" },
  sparkle: { name: "Sparkle", bg: ["#3a0f4d", "#7a1f6b"], accent: "#ffe9fb", glow: "#ffb8f0", symbol: "✦" },
  leaf: { name: "Fresh", bg: ["#0d3d2a", "#1f7a4d"], accent: "#eafff1", glow: "#9dffc4", symbol: "🍃" },
  ember: { name: "Ember", bg: ["#4a1006", "#a3320f"], accent: "#fff2ea", glow: "#ffb27a", symbol: "✷" },
  glow: { name: "Glow", bg: ["#241b40", "#4a3a86"], accent: "#f2efff", glow: "#c9baff", symbol: "●" },
  petal: { name: "Petal", bg: ["#4d1030", "#a3316b"], accent: "#fff0f6", glow: "#ffb3d6", symbol: "❀" },
};

const RULES = [
  [/beauty|skin|fragr|perfum/i, "snow"],
  [/phone|laptop|tablet|mobile|access/i, "glow"],
  [/grocer/i, "leaf"],
  [/furnitur|home-decor|kitchen/i, "petal"],
  [/men|women|shirt|dress|shoe|watch|bag|jewel|sunglass|top/i, "sparkle"],
  [/automot|motorcycle|vehicle/i, "ember"],
  [/light/i, "glow"],
];

export function themeForCategory(slug) {
  if (!slug) return THEMES.snow;
  const hit = RULES.find(([re]) => re.test(slug));
  return THEMES[hit ? hit[1] : "snow"];
}

const EMOJI = {
  beauty: "✨", fragrances: "🌸", furniture: "🛋️", groceries: "🛒",
  "home-decoration": "🏺", "kitchen-accessories": "🍳", laptops: "💻",
  "mens-shirts": "👔", "mens-shoes": "👞", "mens-watches": "⌚",
  "mobile-accessories": "🎧", motorcycle: "🏍️", "skin-care": "🧴",
  smartphones: "📱", "sports-accessories": "🏀", sunglasses: "🕶️",
  tablets: "📱", tops: "👚", vehicle: "🚗", "womens-bags": "👜",
  "womens-dresses": "👗", "womens-jewellery": "💍", "womens-shoes": "👠",
  "womens-watches": "⌚", automotive: "🚗", lighting: "💡",
};
export const emojiFor = (slug) => EMOJI[slug] || "🛍️";

export const titleCase = (s = "") =>
  s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
