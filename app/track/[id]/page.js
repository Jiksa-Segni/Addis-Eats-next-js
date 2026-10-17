/**
 * /track/[id] — Delivery tracking page (server component wrapper).
 *
 * SERVER RESPONSIBILITIES
 * ───────────────────────
 * 1. Authenticate — redirect to /signin if not a customer.
 * 2. Ownership check — 404 if the order belongs to another user.
 * 3. Seed `initial` data so TrackPage renders immediately without waiting
 *    for the EventSource to connect.
 * 4. Prepare `historyRows` (already-formatted CSV rows) for the client-side
 *    CSV export button — prices formatted with etb(), dates with when().
 *
 * The client component (TrackPage) receives plain-serialisable props only.
 */
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getOrderById, getOrdersByUserId } from "@/lib/orders";
import { etb, when } from "@/lib/format";
import TrackPage from "./TrackPage";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Tracking order #${id.slice(0, 8).toUpperCase()}`,
    description: "Live delivery tracking for your Addis Eats order.",
    robots: { index: false, follow: false },
  };
}

export default async function TrackOrderPage({ params }) {
  const { id } = await params;

  const session = await getSession();
  if (session?.role !== "customer") {
    redirect(`/signin?next=${encodeURIComponent(`/track/${id}`)}`);
  }

  const order = getOrderById(id);
  if (!order || order.userId !== session.id) {
    notFound();
  }

  // Public-safe projection seeded into the client component
  const initial = {
    id:        order.id,
    status:    order.status,
    address:   order.address ?? null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt ?? order.createdAt,
  };

  // Pre-format the order history as CSV rows so the client component can
  // call downloadCsv() without touching the server again.
  const allOrders = getOrdersByUserId(session.id);
  const historyRows = [
    ["Order ID", "Date", "Status", "Items", "Total", "Delivery address"],
    ...allOrders.map((o) => [
      o.id,
      when(o.createdAt),
      o.status.replace(/_/g, " "),
      (o.items ?? []).map((item) => `${item.quantity} x ${item.name}`).join("; "),
      etb(o.total),
      o.address ?? "",
    ]),
  ];

  return <TrackPage id={id} initial={initial} historyRows={historyRows} />;
}
