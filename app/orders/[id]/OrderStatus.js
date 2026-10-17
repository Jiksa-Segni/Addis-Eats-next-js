"use client";

/**
 * OrderStatus — Live animated order tracking component.
 *
 * Delivery flow:
 *   received → preparing → ready → on_the_way → delivered → completed
 *
 * Auto-advance timers (client-driven, committed via server action):
 *   • preparing  → on_the_way : 3 seconds
 *   • on_the_way → delivered  : 4 seconds
 *
 * Map animation:
 *   • When status becomes on_the_way: SVG courier marker animates from
 *     restaurant to destination over 5 seconds (ease-in-out cubic).
 *   • When status becomes delivered: marker snaps to destination pin,
 *     "Delivered" banner appears — synchronized with the 4-second timer
 *     above so the marker arrives exactly when the status flips.
 *
 * Timing summary (all synchronized):
 *   t=0s   preparing detected  → step tracker shows "Being prepared", timer starts
 *   t=3s   on_the_way fires    → step tracker advances, map animation starts (5 s)
 *   t=7s   delivered fires     → step tracker shows "Delivered", banner appears,
 *                                 marker has been moving for 4 s (still animating)
 *   t=8s   map animation ends  → marker rests on destination pin
 *
 * Polling:
 *   • Polls every 3 s during preparing, 2 s during on_the_way, 5 s otherwise.
 *   • Stops on terminal statuses.
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { advanceDeliveryStatus } from "@/app/actions";

// ─── Status definitions ────────────────────────────────────────────────────

// ─── Timing constants (all in milliseconds) ───────────────────────────────
// These must match the values in TrackPage.jsx (used on /track/[id]).
const PREPARING_TO_ON_THE_WAY_MS = 3000;  // 3 s
const ON_THE_WAY_TO_DELIVERED_MS = 4000;  // 4 s
const MAP_ANIMATION_MS           = 5000;  // 5 s — courier travels restaurant → destination
const TERMINAL = new Set(["delivered", "completed", "cancelled"]);
const DELIVERY_ACTIVE = new Set(["on_the_way"]);

const STEPS = [
  { key: "received",   label: "Order received",  icon: "📋" },
  { key: "preparing",  label: "Being prepared",   icon: "👨‍🍳" },
  { key: "ready",      label: "Ready",            icon: "✅" },
  { key: "on_the_way", label: "On the way",       icon: "🛵" },
  { key: "delivered",  label: "Delivered",        icon: "🎉" },
];

// Maps status key → step index (0-based)
const STEP_INDEX = Object.fromEntries(STEPS.map((s, i) => [s.key, i]));
// completed and cancelled are off the main track
STEP_INDEX["completed"] = 5;
STEP_INDEX["cancelled"] = -1;

const STATUS_COLORS = {
  received:   "border-blue-400 bg-blue-50 text-blue-900",
  preparing:  "border-amber-400 bg-amber-50 text-amber-900",
  ready:      "border-green-400 bg-green-50 text-green-900",
  on_the_way: "border-purple-400 bg-purple-50 text-purple-900",
  delivered:  "border-teal-400 bg-teal-50 text-teal-900",
  completed:  "border-stone-300 bg-stone-50 text-stone-700",
  cancelled:  "border-red-300 bg-red-50 text-red-800",
};

// ─── Neighbourhood coordinates on the SVG map (restaurant + 8 areas) ──────
// The SVG viewBox is 0 0 400 300. Restaurant is at centre-top.
const RESTAURANT = { x: 200, y: 60, label: "Addis Eats" };

const NEIGHBOURHOOD_COORDS = {
  "Bole Michael":  { x: 270, y: 120 },
  "Bole Road":     { x: 300, y: 145 },
  "Kazanchis":     { x: 140, y: 110 },
  "Megenagna":     { x: 310, y: 80  },
  "Piazza":        { x: 110, y: 165 },
  "Ayer Tena":     { x: 220, y: 240 },
  "Saris":         { x: 160, y: 220 },
  "CMC":           { x: 340, y: 100 },
};

function getDestCoords(address) {
  if (!address) return { x: 200, y: 200 };
  const neighbourhood = address.split(",")[0].trim();
  return NEIGHBOURHOOD_COORDS[neighbourhood] ?? { x: 200, y: 200 };
}

// ─── Lerp helper ──────────────────────────────────────────────────────────
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// ─── Map component ────────────────────────────────────────────────────────
function DeliveryMap({ status, address }) {
  const dest = getDestCoords(address);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);
  const ANIM_DURATION = MAP_ANIMATION_MS; // 5 seconds — synchronized with timer chain

  const [markerPos, setMarkerPos] = useState({ x: RESTAURANT.x, y: RESTAURANT.y });
  const [arrived, setArrived] = useState(false);
  const prevStatusRef = useRef(status);

  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;

    // Cancel any ongoing animation when status changes
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (status === "on_the_way") {
      // Animate from restaurant → destination over 5 seconds
      setArrived(false);
      startTimeRef.current = null;
      const fromX = RESTAURANT.x;
      const fromY = RESTAURANT.y;

      function animate(timestamp) {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const elapsed = timestamp - startTimeRef.current;
        const t = Math.min(elapsed / ANIM_DURATION, 1);
        // Ease-in-out cubic
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        setMarkerPos({
          x: lerp(fromX, dest.x, ease),
          y: lerp(fromY, dest.y, ease),
        });
        if (t < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          setMarkerPos({ x: dest.x, y: dest.y });
          rafRef.current = null;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    } else if (status === "delivered" || status === "completed") {
      // Snap to destination and mark as arrived
      setMarkerPos({ x: dest.x, y: dest.y });
      setArrived(true);
    } else if (status === "received" || status === "preparing" || status === "ready") {
      // Reset to restaurant
      setMarkerPos({ x: RESTAURANT.x, y: RESTAURANT.y });
      setArrived(false);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [status, dest.x, dest.y]);

  const isDelivering = status === "on_the_way" || status === "delivered" || status === "completed";

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-100 via-emerald-50 to-stone-200 ring-1 ring-stone-200 shadow-sm">
      {/* Map header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          Live delivery map · Addis Ababa
        </span>
        {arrived && (
          <span className="rounded-full bg-teal-500 px-3 py-1 text-xs font-bold text-white animate-pulse">
            ✓ Delivered
          </span>
        )}
      </div>

      <svg
        viewBox="0 0 400 300"
        className="w-full"
        style={{ height: 260 }}
        aria-label={`Delivery map showing order en route to ${address ?? "your address"}`}
        role="img"
      >
        {/* Background roads (decorative) */}
        <line x1="200" y1="0" x2="200" y2="300" stroke="#d6d3d1" strokeWidth="6" />
        <line x1="0" y1="150" x2="400" y2="150" stroke="#d6d3d1" strokeWidth="6" />
        <line x1="0" y1="60" x2="400" y2="220" stroke="#e7e5e4" strokeWidth="3" />
        <line x1="400" y1="60" x2="0" y2="220" stroke="#e7e5e4" strokeWidth="3" />

        {/* Neighbourhood dots */}
        {Object.entries(NEIGHBOURHOOD_COORDS).map(([name, pos]) => (
          <g key={name}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={5}
              fill="#a8a29e"
              opacity={0.5}
            />
            <text
              x={pos.x + 7}
              y={pos.y + 4}
              fontSize="8"
              fill="#78716c"
              fontFamily="sans-serif"
            >
              {name}
            </text>
          </g>
        ))}

        {/* Destination pin — highlighted when delivering */}
        {isDelivering && (
          <g>
            <circle
              cx={dest.x}
              cy={dest.y}
              r={12}
              fill="#0d9488"
              opacity={0.2}
            />
            <circle cx={dest.x} cy={dest.y} r={6} fill="#0d9488" />
            <text
              x={dest.x}
              y={dest.y - 16}
              fontSize="9"
              fill="#0d9488"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              📍 {address?.split(",")[0] ?? "Destination"}
            </text>
          </g>
        )}

        {/* Route line from restaurant to destination */}
        {isDelivering && (
          <line
            x1={RESTAURANT.x}
            y1={RESTAURANT.y}
            x2={dest.x}
            y2={dest.y}
            stroke="#d97706"
            strokeWidth="2"
            strokeDasharray="6 4"
            opacity={0.6}
          />
        )}

        {/* Restaurant pin */}
        <g>
          <circle cx={RESTAURANT.x} cy={RESTAURANT.y} r={14} fill="#d97706" opacity={0.2} />
          <circle cx={RESTAURANT.x} cy={RESTAURANT.y} r={7} fill="#d97706" />
          <text
            x={RESTAURANT.x}
            y={RESTAURANT.y - 18}
            fontSize="9"
            fill="#d97706"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            🍽 Addis Eats
          </text>
        </g>

        {/* Delivery rider marker */}
        <g
          transform={`translate(${markerPos.x}, ${markerPos.y})`}
          style={{ transition: "none" }}
        >
          {/* Glow ring */}
          <circle r={16} fill="#7c3aed" opacity={0.15} />
          {/* Rider circle */}
          <circle r={10} fill="#7c3aed" />
          {/* Rider emoji-style */}
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="11"
            fontFamily="sans-serif"
          >
            🛵
          </text>
        </g>
      </svg>

      {/* Status bar below map */}
      <div className="border-t border-stone-200 px-4 py-2 text-center">
        {status === "on_the_way" && (
          <p className="text-sm font-semibold text-purple-700 animate-pulse">
            Your order is on its way — arriving soon!
          </p>
        )}
        {(status === "delivered" || status === "completed") && (
          <p className="text-sm font-bold text-teal-700">
            🎉 Your order has been delivered to {address?.split(",")[0] ?? "your address"}!
          </p>
        )}
        {!isDelivering && (
          <p className="text-sm text-stone-500">
            Map will activate when your order is out for delivery.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Step tracker component ───────────────────────────────────────────────
function StepTracker({ status }) {
  const currentIndex = STEP_INDEX[status] ?? 0;
  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <div className="rounded-2xl bg-red-50 px-5 py-4 ring-1 ring-red-200 text-center">
        <p className="text-2xl">❌</p>
        <p className="mt-2 font-bold text-red-800">Order cancelled</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Connecting line */}
      <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-stone-200 -translate-x-1/2" aria-hidden="true" />

      <ol className="relative space-y-4">
        {STEPS.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          const upcoming = index > currentIndex;

          return (
            <li key={step.key} className="flex items-center gap-4">
              {/* Circle */}
              <div
                className={`relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 text-xl transition-all duration-500 ${
                  done
                    ? "border-amber-500 bg-amber-500 text-white"
                    : active
                    ? "border-amber-600 bg-white shadow-md shadow-amber-100 scale-110"
                    : "border-stone-300 bg-white text-stone-400"
                }`}
                aria-hidden="true"
              >
                {done ? "✓" : step.icon}
              </div>

              {/* Label */}
              <div>
                <p
                  className={`font-semibold transition-colors duration-300 ${
                    active
                      ? "text-amber-900 text-base"
                      : done
                      ? "text-stone-600"
                      : "text-stone-400 text-sm"
                  }`}
                >
                  {step.label}
                </p>
                {active && (
                  <p className="text-xs text-stone-500 mt-0.5">
                    {step.key === "preparing" && "Your food is being prepared…"}
                    {step.key === "on_the_way" && "Your rider is on the way!"}
                    {step.key === "delivered" && "Enjoy your meal!"}
                    {step.key === "ready" && "Waiting to be picked up by rider…"}
                    {step.key === "received" && "We received your order."}
                  </p>
                )}
              </div>

              {/* Active pulse indicator */}
              {active && (
                <span className="ml-auto flex h-3 w-3 flex-shrink-0">
                  <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ─── Main OrderStatus component ────────────────────────────────────────────
export default function OrderStatus({ id, initial }) {
  const prevStatusRef = useRef(initial?.status);
  const timerRef = useRef(null);
  const [localStatus, setLocalStatus] = useState(initial?.status);

  const isTerminal = TERMINAL.has(localStatus);
  const isActiveDelivery = DELIVERY_ACTIVE.has(localStatus);

  const { data, error } = useSWR(
    `/api/orders/${id}`,
    fetcher,
    {
      fallbackData: initial,
      // Poll every 3 s while preparing (matches the 3 s advance timer),
      // every 2 s during on_the_way, stop when terminal.
      refreshInterval: (latest) => {
        if (TERMINAL.has(latest?.status)) return 0;
        if (latest?.status === "preparing") return 3000;
        if (DELIVERY_ACTIVE.has(latest?.status)) return 2000;
        return 5000;
      },
      revalidateOnFocus: !isTerminal,
    }
  );

  const status = data?.status ?? localStatus;
  const address = data?.address ?? initial?.address;
  const updatedAt = data?.updatedAt ?? initial?.updatedAt;

  // ── Auto-advance delivery timers ────────────────────────────────────────
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;

    // Clear any existing timer when status changes
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // preparing → on_the_way: auto-advance after 3 seconds
    if (status === "preparing" && prev !== "preparing") {
      timerRef.current = setTimeout(async () => {
        setLocalStatus("on_the_way");
        try {
          await advanceDeliveryStatus(id, "on_the_way");
        } catch {
          // Server already advanced or race condition — next poll will correct state
        }
      }, PREPARING_TO_ON_THE_WAY_MS);
    }

    // on_the_way → delivered: auto-advance after 4 seconds
    // The map animation (5 s) starts when on_the_way is detected, so it
    // finishes 1 second after the delivered status appears — fully synchronized.
    if (status === "on_the_way" && prev !== "on_the_way") {
      timerRef.current = setTimeout(async () => {
        setLocalStatus("delivered");
        try {
          await advanceDeliveryStatus(id, "delivered");
        } catch {
          // Server already advanced
        }
      }, ON_THE_WAY_TO_DELIVERED_MS);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [status, id]);

  // Sync localStatus when SWR returns a newer status
  useEffect(() => {
    if (data?.status && data.status !== localStatus) {
      setLocalStatus(data.status);
    }
  }, [data?.status]);

  const displayStatus = localStatus ?? status;
  const stepIndex = STEP_INDEX[displayStatus] ?? 0;

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">

        {/* ── Left column: step tracker + status info ── */}
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
            Order tracking
          </p>
          <h1 className="mt-2 text-3xl font-black text-stone-900">Track your order</h1>

          <div className="mt-1 font-mono text-xs text-stone-400">
            #{id.slice(0, 8).toUpperCase()}
          </div>

          {error ? (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">
              Could not refresh status. {error.message}
            </p>
          ) : null}

          {/* Current status badge */}
          <div
            aria-live="polite"
            aria-atomic="true"
            className={`mt-5 rounded-2xl border-2 p-4 ${STATUS_COLORS[displayStatus] ?? STATUS_COLORS.received}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.15em] opacity-70">
              Current status
            </p>
            <p className="mt-1 text-2xl font-black capitalize">
              {displayStatus.replace("_", " ")}
            </p>
            {updatedAt ? (
              <p className="mt-1 text-xs opacity-60">
                Updated{" "}
                <time dateTime={updatedAt}>
                  {new Date(updatedAt).toLocaleTimeString()}
                </time>
              </p>
            ) : null}
          </div>

          {/* Step tracker */}
          <div className="mt-6">
            <StepTracker status={displayStatus} />
          </div>

          {/* Auto-advance countdown hint */}
          {(displayStatus === "preparing" || displayStatus === "on_the_way") && (
            <p className="mt-4 rounded-xl bg-stone-50 px-4 py-2 text-xs text-stone-500 ring-1 ring-stone-100">
              {displayStatus === "preparing"
                ? "⏱ Delivery rider picking up in 3 s…"
                : "⏱ On the way — arriving in 4 s…"}
            </p>
          )}

          {/* Polling hint */}
          {!TERMINAL.has(displayStatus) && (
            <p className="mt-3 text-xs text-stone-400">
              Status updates automatically every{" "}
              {displayStatus === "preparing" ? "3" : isActiveDelivery ? "2" : "5"} seconds.
            </p>
          )}

          {/* Navigation */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/track/${id}`}
              className="rounded-full bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-800"
            >
              🗺 Live map tracking
            </Link>
            <Link
              href="/orders"
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 transition hover:border-stone-500"
            >
              Order history
            </Link>
            <Link
              href="/menu"
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 transition hover:border-stone-500"
            >
              Back to menu
            </Link>
          </div>
        </div>

        {/* ── Right column: delivery map ── */}
        <div className="flex flex-col gap-4">
          <DeliveryMap status={displayStatus} address={address} />

          {/* Order destination info */}
          {address && (
            <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-stone-200">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Delivery destination
              </p>
              <p className="mt-1 font-bold text-stone-900">{address}</p>
            </div>
          )}

          {/* Delivered confirmation banner */}
          {(displayStatus === "delivered" || displayStatus === "completed") && (
            <div className="rounded-2xl bg-teal-600 px-5 py-5 text-center text-white shadow-lg">
              <p className="text-3xl">🎉</p>
              <p className="mt-2 text-xl font-black">Order Delivered!</p>
              <p className="mt-1 text-sm text-teal-100">
                Your meal has arrived at {address?.split(",")[0] ?? "your address"}.
              </p>
              <p className="mt-1 text-sm text-teal-100">Enjoy your Ethiopian food!</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
