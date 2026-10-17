"use client";

/**
 * DeliveryMap.jsx — Leaflet delivery map loaded with ssr:false.
 *
 * Leaflet accesses window/document at import time and must never run on the
 * server. This file is always loaded via:
 *   const DeliveryMap = dynamic(() => import("./DeliveryMap"), { ssr: false })
 *
 * TIMING (synchronized with TrackPage.jsx and OrderStatus.js):
 *   t=0 s   on_the_way detected  → courier starts 5-second animated journey
 *   t=4 s   delivered fires      → courier is 80 % of the way there (still animating)
 *   t=5 s   animation completes  → courier snaps exactly on destination pin
 *
 *   The 5-second animation runs *through* the delivered event on purpose —
 *   the rider visibly arrives on the pin 1 second after the status changes,
 *   which feels more natural than the pin jumping instantly.
 *
 * COURIER ANIMATION
 *   Leaflet's setLatLng() is instant. We drive the movement ourselves with
 *   requestAnimationFrame, lerping lat/lng with an ease-in-out cubic curve
 *   over MAP_ANIMATION_MS milliseconds.
 *
 * MAP BEHAVIOUR
 *   • 🍽  Restaurant marker — always visible at Addis Eats.
 *   • 📍  Destination marker — fixed at the delivery address.
 *   • 🛵  Courier marker — starts at restaurant, moves to destination.
 *   • fitBounds on mount ensures both markers are in view.
 *   • flyToBounds during transit, flyTo (zoomed in) on arrival.
 *
 * ACCESSIBILITY
 *   The map has aria-label and role="img". All information is also shown in
 *   the text panel rendered by TrackPage.jsx beside the map.
 */

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import L from "leaflet";
import { RESTAURANT, coordsForAddress } from "@/lib/coords";

// ── Timing constant — must match TrackPage.jsx ────────────────────────────
const MAP_ANIMATION_MS = 5000; // 5 seconds

// ── Fix Leaflet's bundler-broken default icon paths ───────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Custom icons (inline HTML, no external image fetch) ───────────────────
const COURIER_ICON = L.divIcon({
  html: `<div style="
    width:42px;height:42px;border-radius:50%;
    background:#7c3aed;border:3px solid #fff;
    box-shadow:0 2px 10px rgba(124,58,237,0.45);
    display:flex;align-items:center;justify-content:center;
    font-size:22px;line-height:1;
    transition:box-shadow 0.3s;
  ">🛵</div>`,
  className: "",
  iconSize: [42, 42],
  iconAnchor: [21, 21],
  popupAnchor: [0, -24],
});

const DEST_ICON = L.divIcon({
  html: `<div style="
    width:38px;height:38px;border-radius:50%;
    background:#0d9488;border:3px solid #fff;
    box-shadow:0 2px 8px rgba(13,148,136,0.4);
    display:flex;align-items:center;justify-content:center;
    font-size:20px;line-height:1;
  ">📍</div>`,
  className: "",
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -22],
});

const REST_ICON = L.divIcon({
  html: `<div style="
    width:38px;height:38px;border-radius:50%;
    background:#d97706;border:3px solid #fff;
    box-shadow:0 2px 8px rgba(217,119,6,0.4);
    display:flex;align-items:center;justify-content:center;
    font-size:20px;line-height:1;
  ">🍽</div>`,
  className: "",
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -22],
});

// ── Ease-in-out cubic ─────────────────────────────────────────────────────
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

const TILE_URL  = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const TERMINAL = new Set(["delivered", "completed", "cancelled"]);

// ── Component ─────────────────────────────────────────────────────────────
export default function DeliveryMap({ status, address }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const courierRef   = useRef(null);
  const destRef      = useRef(null);
  const rafRef       = useRef(null);          // requestAnimationFrame handle
  const animStart    = useRef(null);          // animation start timestamp
  const fromLatLng   = useRef(null);          // lerp start position
  const prevStatus   = useRef(status);

  const dest = coordsForAddress(address);

  // ── Initialise map once on mount ─────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center:           [RESTAURANT.lat, RESTAURANT.lng],
      zoom:             13,
      zoomControl:      true,
      scrollWheelZoom:  false,
    });

    L.tileLayer(TILE_URL, { attribution: TILE_ATTR }).addTo(map);

    // Restaurant (always shown)
    L.marker([RESTAURANT.lat, RESTAURANT.lng], { icon: REST_ICON })
      .addTo(map)
      .bindPopup("<b>Addis Eats</b><br>Your order starts here");

    // Destination (fixed)
    const destMarker = L.marker([dest.lat, dest.lng], { icon: DEST_ICON })
      .addTo(map)
      .bindPopup(`<b>Delivery address</b><br>${address ?? "Your address"}`);

    // Courier — starts at restaurant
    const courierMarker = L.marker([RESTAURANT.lat, RESTAURANT.lng], { icon: COURIER_ICON })
      .addTo(map)
      .bindPopup("🛵 Your delivery rider");

    mapRef.current    = map;
    courierRef.current = courierMarker;
    destRef.current   = destMarker;

    // Fit both markers in view
    map.fitBounds(
      L.latLngBounds(
        [RESTAURANT.lat, RESTAURANT.lng],
        [dest.lat, dest.lng]
      ),
      { padding: [52, 52] }
    );

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      map.remove();
      mapRef.current    = null;
      courierRef.current = null;
      destRef.current   = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Animate courier when status changes ──────────────────────────────
  useEffect(() => {
    const map     = mapRef.current;
    const courier = courierRef.current;
    if (!map || !courier) return;

    const prev = prevStatus.current;
    prevStatus.current = status;

    // Cancel any in-flight animation
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      animStart.current = null;
    }

    if (status === "on_the_way" && prev !== "on_the_way") {
      // ── Animated journey: restaurant → destination over 5 seconds ──────
      const startLat = RESTAURANT.lat;
      const startLng = RESTAURANT.lng;
      fromLatLng.current = { lat: startLat, lng: startLng };

      // Pan to show both markers during transit
      map.flyToBounds(
        L.latLngBounds(
          [RESTAURANT.lat, RESTAURANT.lng],
          [dest.lat, dest.lng]
        ),
        { padding: [52, 52], duration: 1.2 }
      );

      function animateStep(timestamp) {
        if (!animStart.current) animStart.current = timestamp;
        const elapsed = timestamp - animStart.current;
        const t = Math.min(elapsed / MAP_ANIMATION_MS, 1);
        const ease = easeInOutCubic(t);

        courier.setLatLng([
          lerp(startLat, dest.lat, ease),
          lerp(startLng, dest.lng, ease),
        ]);

        if (t < 1) {
          rafRef.current = requestAnimationFrame(animateStep);
        } else {
          // Animation complete — snap to exact destination
          courier.setLatLng([dest.lat, dest.lng]);
          rafRef.current = null;
          animStart.current = null;
        }
      }

      rafRef.current = requestAnimationFrame(animateStep);

    } else if ((status === "delivered" || status === "completed") && prev === "on_the_way") {
      // ── Delivered while animation may still be running ────────────────
      // The animation was already started by on_the_way. Do NOT restart it
      // here — let it finish naturally (it ends 1 s after this event).
      // Just zoom in towards the destination so the arrival is visible.
      map.flyTo([dest.lat, dest.lng], 15, { duration: 1.0 });

    } else if (TERMINAL.has(status) && prev !== "on_the_way") {
      // Terminal reached without going through on_the_way animation
      courier.setLatLng([dest.lat, dest.lng]);
      map.flyTo([dest.lat, dest.lng], 15, { duration: 1.0 });

    } else if (!TERMINAL.has(status) && status !== "on_the_way") {
      // Reset courier to restaurant for non-delivery statuses
      courier.setLatLng([RESTAURANT.lat, RESTAURANT.lng]);
      map.flyTo([RESTAURANT.lat, RESTAURANT.lng], 13, { duration: 0.8 });
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [status, dest.lat, dest.lng]);

  const isDelivering = status === "on_the_way" || TERMINAL.has(status);
  const isArrived    = status === "delivered" || status === "completed";

  return (
    <figure className="overflow-hidden rounded-2xl shadow-md ring-1 ring-stone-200">
      {/* Status overlay badge */}
      <div className="flex items-center justify-between border-b border-stone-100 bg-white px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          Live delivery · Addis Ababa
        </span>
        {isArrived && (
          <span className="flex items-center gap-1.5 rounded-full bg-teal-500 px-3 py-1 text-xs font-bold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            Delivered
          </span>
        )}
        {status === "on_the_way" && (
          <span className="flex items-center gap-1.5 rounded-full bg-purple-600 px-3 py-1 text-xs font-bold text-white">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-white" />
            On the way
          </span>
        )}
      </div>

      {/* Map container — explicit height prevents CLS while Leaflet loads */}
      <div
        ref={containerRef}
        style={{ height: 380 }}
        className="w-full bg-stone-100"
        aria-label={`Delivery map. Courier route from Addis Eats restaurant to ${address ?? "your delivery address"}.`}
        role="img"
      />

      {/* Bottom caption / status */}
      <div className="border-t border-stone-100 bg-white px-4 py-2 text-center text-xs">
        {status === "on_the_way" && (
          <p className="font-semibold text-purple-700">
            🛵 Rider is on the way — watch the map!
          </p>
        )}
        {isArrived && (
          <p className="font-bold text-teal-700">
            🎉 Delivered to {address?.split(",")[0] ?? "your address"}
          </p>
        )}
        {!isDelivering && (
          <p className="text-stone-400">
            Map activates when the rider sets off
          </p>
        )}
        <p className="mt-0.5 text-stone-400">
          © OpenStreetMap contributors · Approximate route
        </p>
      </div>
    </figure>
  );
}
