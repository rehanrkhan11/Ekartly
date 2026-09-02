// Modular API wrapper using free OpenStreetMap Nominatim API

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

/**
 * Reverse geocode coordinates to get address details
 */
export async function reverseGeocode(latitude, longitude) {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
      {
        headers: {
          "User-Agent": "EkartlyApp/1.0",
        },
      }
    );
    const data = await response.json();
    if (data && data.address) {
      const addr = data.address;
      const pincode = addr.postcode || "000000";
      const city = addr.city || addr.town || addr.village || addr.state_district || "Unknown City";
      const mainName = addr.suburb || addr.neighbourhood || addr.road || addr.residential || city;

      return {
        id: `loc-${Date.now()}`,
        label: "Current Location",
        address: mainName,
        city: city,
        pincode: pincode,
        latitude,
        longitude,
      };
    }
    throw new Error("Unable to parse location response");
  } catch (error) {
    console.warn("Reverse geocode failed:", error);
    return null;
  }
}

/**
 * Search locations by query string
 */
export async function searchLocations(query) {
  if (!query || query.trim().length < 3) return [];
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(
        query
      )}&addressdetails=1&limit=5`,
      {
        headers: {
          "User-Agent": "EkartlyApp/1.0",
        },
      }
    );
    const data = await response.json();
    return data.map((item, index) => {
      const addr = item.address || {};
      const pincode = addr.postcode || "";
      const city = addr.city || addr.town || addr.village || addr.state || "";
      return {
        id: `search-${index}-${Date.now()}`,
        label: item.display_name.split(",")[0],
        address: item.display_name,
        city: city,
        pincode: pincode,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      };
    });
  } catch (error) {
    console.warn("Location search failed:", error);
    return [];
  }
}