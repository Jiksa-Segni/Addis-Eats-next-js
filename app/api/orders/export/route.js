/**
 * GET /api/orders/export
 *
 * Streams a CSV file of the authenticated customer's order history.
 * Uses lib/csv.js for serialisation — same quoting rules as the
 * client-side downloadCsv helper so values are consistent everywhere.
 */
import { getSession } from "@/lib/auth";
import { getOrdersByUserId } from "@/lib/orders";
import { toCsv } from "@/lib/csv";
import { when, etb } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (session?.role !== "customer") {
    return Response.json({ message: "Customer sign-in required." }, { status: 401 });
  }

  const orders = getOrdersByUserId(session.id);

  const rows = [
    ["Order ID", "Date", "Status", "Items", "Total", "Delivery address"],
    ...orders.map((order) => [
      order.id,
      when(order.createdAt),
      order.status.replace("_", " "),
      order.items.map((item) => `${item.quantity} x ${item.name}`).join("; "),
      etb(order.total),
      order.address ?? "",
    ]),
  ];

  const csv = toCsv(rows);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="addis-eats-order-history.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
