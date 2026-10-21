"use client";

/**
 * TrackPage.jsx — Live delivery tracking client component.
 *
 * STATUS SOURCE
 * ─────────────
 * Uses the browser's native EventSource API to connect to the SSE stream
 * at /api/orders/[id]/stream. This is more efficient than polling because:
 * - The server pushes updates only when status changes.
 * - A single long-lived HTTP connection replaces repeated round-trips.
 * - No SWR or fetch overhead on the client.
 *
 * The component is seeded from server-rendered `initial` data so the page
 * is meaningful before the stream connection opens.
 *
 * CONNECTION INDICATOR
 * ────────────────────
 * A coloured dot in the top-right corner shows stream state:
 *   🟢 green  — connected, receiving events
 *   🟡 amber  — connecting / reconnecting
 *   🔴 red    — error (EventSource.onerror)
 *
 * STREAM LIFECYCLE
 * ────────────────
 * - Opens on mount.
 * - Closes when the `done` event arrives (terminal status).
 * - Closes on component unmount (navigation away from page).
 *
 * TIMING (synchronized with OrderStatus.js):
 *   t=0s   preparing detected  → 3 s timer starts
 *   t=3s   on_the_way fires    → map animation starts (5 s), 4 s timer starts
 *   t=7s   delivered fires     → banner appears, map still animating (1 s left)
 *   t=8s   map animation ends  → rider arrives exactly on destination pin
 *
 * ACCESSIBILITY
 * ─────────────
 * The map is a visual aid only. Every piece of information shown on the map
 * is also presented in the text panel beside it.
 *
 * CSV EXPORT
 * ──────────
 * The "Download history" button calls downloadCsv from lib/csv.js directly
 * in the browser — no round-trip to the server.
 */

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { downloadCsv } from "@/lib/csv";
import { etb, when, relative } from "@/lib/format";
import { advanceDeliveryStatus } from "@/app/actions";

// Load Leaflet map only in the browser — ssr:false prevents the server from
// trying to import leaflet (which calls window/document and throws).
const DeliveryMap = dynamic(() => import("./DeliveryMap"), {
  ssr: false,
  // Sized placeholder shown while the Leaflet chunk downloads
  loading: () => (
    <div
      style={{ height: 380 }}
      className="w-full animate-pulse rounded-2xl bg-stone-200"
      aria-label="Map loading…"
      role="img"
    />
  ),
});

// ── Timing constants — must match OrderStatus.js exactly ─────────────────
// preparing  → on_the_way : 3 seconds
// on_the_way → delivered  : 4 seconds
// map animation runs for  : 5 seconds (in DeliveryMap.jsx)
const PREPARING_TO_ON_THE_WAY_MS = 3000;
const ON_THE_WAY_TO_DELIVERED_MS = 4000;

const STEPS = [
  { key: "received",   label: "Order received",  icon: "📋" },
  { key: "preparing",  label: "Being prepared",  icon: "👨‍🍳" },
  { key: "ready",      label: "Ready",           icon: "✅" },
  { key: "on_the_way", label: "On the way",      icon: "🛵" },
  { key: "delivered",  label: "Delivered",       icon: "🎉" },
];

const STEP_INDEX = Object.fromEntries(STEPS.map((s, i) => [s.key, i]));
STEP_INDEX["completed"] = 5;
STEP_INDEX["cancelled"] = -1;

const TERMINAL = new Set(["delivered", "completed", "cancelled"]);

const STATUS_COLORS = {
  received:   "border-blue-300 bg-blue-50 text-blue-900",
  preparing:  "border-amber-400 bg-amber-50 text-amber-900",
  ready:      "border-green-400 bg-green-50 text-green-900",
  on_the_way: "border-purple-400 bg-purple-50 text-purple-900",
  delivered:  "border-teal-400 bg-teal-50 text-teal-900",
  completed:  "border-stone-300 bg-stone-50 text-stone-700",
  cancelled:  "border-red-300 bg-red-50 text-red-800",
};

const CONN_STATES = {
  connecting: { dot: "bg-amber-400 animate-pulse", label: "Connecting…" },
  open:       { dot: "bg-green-500",               label: "Live"        },
  error:      { dot: "bg-red-500",                 label: "Reconnecting"},
  closed:     { dot: "bg-stone-400",               label: "Stream ended"},
};

// ── Component ─────────────────────────────────────────────────────────────

export default function TrackPage({ id, initial, historyRows }) {
  const [order, setOrder] = useState(initial);
  const [connState, setConnState] = useState("connecting");
  const esRef = useRef(null);
  // Auto-advance timer ref — same logic as OrderStatus.js
  const timerRef = useRef(null);
  const prevStatusRef = useRef(initial?.status);

  // ── EventSource lifecycle ─────────────────────────────────────────────
  useEffect(() => {
    function openStream() {
      const es = new EventSource(`/api/orders/${id}/stream`);
      esRef.current = es;
      setConnState("connecting");

      es.addEventListener("open", () => setConnState("open"));

      es.addEventListener("status", (e) => {
        try {
          const data = JSON.parse(e.data);
          setOrder((prev) => ({ ...prev, ...data }));
        } catch {
          // Malformed frame — ignore
        }
      });

      es.addEventListener("done", (e) => {
        try {
          const data = JSON.parse(e.data);
          setOrder((prev) => ({ ...prev, ...data }));
        } catch {}
        setConnState("closed");
        es.close();
      });

      es.addEventListener("error", () => {
        setConnState("error");
        // EventSource retries automatically — we just update the indicator
      });
    }

    // Don't open if already in a terminal state from server
    if (!TERMINAL.has(initial?.status)) {
      openStream();
    } else {
      setConnState("closed");
    }

    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [id, initial?.status]);

  // ── Auto-advance delivery timers ──────────────────────────────────────
  // Mirrors OrderStatus.js exactly — keeps /track/[id] in sync with
  // /orders/[id] regardless of which page the customer has open.
  // Both pages call advanceDeliveryStatus so the server + kitchen stay in sync.
  const status = order?.status ?? "received";

  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // preparing → on_the_way after 3 s
    if (status === "preparing" && prev !== "preparing") {
      timerRef.current = setTimeout(async () => {
        setOrder((prev) => ({
          ...prev,
          status: "on_the_way",
          updatedAt: new Date().toISOString(),
        }));
        try {
          await advanceDeliveryStatus(id, "on_the_way");
        } catch {
          // Server already advanced or race condition — SSE will correct state
        }
      }, PREPARING_TO_ON_THE_WAY_MS);
    }

    // on_the_way → delivered after 4 s
    // Map animation (5 s) starts simultaneously in DeliveryMap.jsx —
    // finishes 1 s after the delivered banner appears so the rider
    // visibly arrives on the pin.
    if (status === "on_the_way" && prev !== "on_the_way") {
      timerRef.current = setTimeout(async () => {
        setOrder((prev) => ({
          ...prev,
          status: "delivered",
          updatedAt: new Date().toISOString(),
        }));
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
  const address = order?.address ?? initial?.address;
  const stepIndex = STEP_INDEX[status] ?? 0;
  const isCancelled = status === "cancelled";
  const isTerminal = TERMINAL.has(status);
  const conn = CONN_STATES[connState] ?? CONN_STATES.connecting;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
            Addis Eats · Delivery tracking
          </p>
          <h1 className="mt-1 text-3xl font-black text-stone-900">Track your order</h1>
          <p className="mt-1 font-mono text-xs text-stone-400">
            #{id.slice(0, 8).toUpperCase()}
          </p>
        </div>

        {/* Connection indicator */}
        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-stone-200">
          <span className={`h-2.5 w-2.5 rounded-full ${conn.dot}`} aria-hidden="true" />
          <span className="text-xs font-semibold text-stone-700">{conn.label}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">

        {/* ── Left: info panel ── */}
        <div className="space-y-5">

          {/* Current status badge (aria-live so screen readers announce changes) */}
          <div
            aria-live="polite"
            aria-atomic="true"
            className={`rounded-2xl border-2 p-5 ${STATUS_COLORS[status] ?? STATUS_COLORS.received}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.15em] opacity-60">
              Current status
            </p>
            <p className="mt-1 text-2xl font-black capitalize">
              {status.replace(/_/g, " ")}
            </p>
            <p className="mt-2 text-sm opacity-70">
              Updated {relative(order?.updatedAt)}
              {" · "}
              <time dateTime={order?.updatedAt}>{when(order?.updatedAt)}</time>
            </p>
          </div>

          {/* Step tracker */}
          {!isCancelled ? (
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Progress
              </p>
              <ol className="relative space-y-4">
                {/* Vertical connector */}
                <div
                  className="absolute left-[22px] top-6 bottom-6 w-0.5 bg-stone-200"
                  aria-hidden="true"
                />
                {STEPS.map((step, i) => {
                  const done   = i < stepIndex;
                  const active = i === stepIndex;
                  return (
                    <li key={step.key} className="flex items-center gap-4">
                      <div
                        className={`relative z-10 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-2 text-lg transition-all duration-500 ${
                          done   ? "border-amber-500 bg-amber-500 text-white"
                               : active ? "border-amber-600 bg-white shadow shadow-amber-100 scale-110"
                               : "border-stone-200 bg-white text-stone-400"
                        }`}
                        aria-hidden="true"
                      >
                        {done ? "✓" : step.icon}
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${active ? "text-stone-900" : done ? "text-stone-500" : "text-stone-400 text-sm"}`}>
                          {step.label}
                        </p>
                      </div>
                      {active && (
                        <span className="flex h-2.5 w-2.5 flex-shrink-0" aria-hidden="true">
                          <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : (
            <div className="rounded-2xl bg-red-50 p-5 ring-1 ring-red-200">
              <p className="text-lg font-bold text-red-800">❌ Order cancelled</p>
              <p className="mt-1 text-sm text-red-700">This order will not be delivered.</p>
            </div>
          )}

          {/* Order details — text fallback for map */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 space-y-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Order details
            </p>
            <dl className="space-y-2">
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">Order placed</dt>
                <dd className="font-medium text-stone-900 text-right">
                  <time dateTime={order?.createdAt}>{when(order?.createdAt)}</time>
                </dd>
              </div>
              {address && (
                <div className="flex justify-between gap-4">
                  <dt className="text-stone-500">Delivering to</dt>
                  <dd className="font-medium text-stone-900 text-right">{address}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">Last update</dt>
                <dd className="font-medium text-stone-900 text-right">
                  {relative(order?.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Delivered banner */}
          {(status === "delivered" || status === "completed") && (
            <div className="rounded-2xl bg-teal-600 p-5 text-center text-white shadow-lg">
              <p className="text-3xl">🎉</p>
              <p className="mt-2 text-xl font-black">Your order has arrived!</p>
              <p className="mt-1 text-sm text-teal-100">
                Delivered to {address?.split(",")[0] ?? "your address"}.
              </p>
            </div>
          )}

          {/* CSV export */}
          {historyRows?.length > 0 && (
            <button
              type="button"
              onClick={() => downloadCsv("addis-eats-order-history.csv", historyRows)}
              className="w-full rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-800 transition hover:border-amber-600 hover:text-amber-800"
            >
              ⬇ Download order history CSV
            </button>
          )}

          {/* Navigation */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/orders"
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 transition hover:border-stone-500"
            >
              Order history
            </Link>
            <Link
              href="/menu"
              className="rounded-full bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-800"
            >
              Back to menu
            </Link>
          </div>
        </div>

        {/* ── Right: map ── */}
        <div className="space-y-4">
          <DeliveryMap status={status} address={address} />

          {/* Map text description for screen readers / no-JS */}
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200 text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 mb-2">
              Map description
            </p>
            <p className="text-stone-700">
              {status === "preparing"
                ? "Your food is being prepared. The rider will pick it up in about 3 seconds."
                : status === "on_the_way"
                ? `The delivery rider has left Addis Eats and is heading to ${address ?? "your address"}. Arriving in about 4 seconds.`
                : (status === "delivered" || status === "completed")
                ? `The rider has arrived at ${address ?? "your address"}. Your order is delivered.`
                : status === "cancelled"
                ? "This order was cancelled and will not be delivered."
                : `Your order is currently at Addis Eats (${status.replace(/_/g, " ")}). The rider has not yet set off.`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
