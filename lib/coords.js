/**
 * lib/coords.js — Real WGS-84 coordinates for Addis Ababa delivery areas.
 *
 * Used by DeliveryMap.jsx (Leaflet) and any server-side code that needs
 * coordinates (e.g. for structured data or distance calculations).
 *
 * The restaurant is on Bole Road, near the centre of the delivery radius.
 * Neighbourhood pins are approximate centres — accurate enough for a
 * delivery-tracking map but not for turn-by-turn navigation.
 */

/** Addis Eats restaurant pin (Bole Road, Addis Ababa). */
export const RESTAURANT = {
  lat: 8.9946,
  lng: 38.7875,
  label: "Addis Eats",
};

/**
 * Delivery neighbourhood centres.
 * Keys match exactly the neighbourhood segment of the checkout address strings,
 * e.g. "Bole Michael, Addis Ababa".split(",")[0].trim() === "Bole Michael".
 */
export const NEIGHBOURHOODS = {
  "Bole Michael": { lat: 8.9944, lng: 38.8024 },
  "Bole Road":    { lat: 8.9937, lng: 38.7893 },
  "Kazanchis":    { lat: 9.0068, lng: 38.7615 },
  "Megenagna":    { lat: 9.0235, lng: 38.8068 },
  "Piazza":       { lat: 9.0320, lng: 38.7497 },
  "Ayer Tena":    { lat: 8.9484, lng: 38.7762 },
  "Saris":        { lat: 8.9603, lng: 38.7440 },
  "CMC":          { lat: 9.0389, lng: 38.8156 },
};

/**
 * Return the [lat, lng] pair for an order address string.
 * Falls back to the restaurant if the neighbourhood is unknown.
 *
 * @param {string|null} address  e.g. "Bole Michael, Addis Ababa"
 * @returns {{ lat: number, lng: number }}
 */
export function coordsForAddress(address) {
  if (!address) return RESTAURANT;
  const neighbourhood = address.split(",")[0].trim();
  return NEIGHBOURHOODS[neighbourhood] ?? RESTAURANT;
}
