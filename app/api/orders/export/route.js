import { getSession } from "@/lib/auth";
import { getOrdersByUserId } from "@/lib/orders";

export const dynamic = "force-dynamic";

function csvCell(value) {
  let text = String(value ?? "");
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  const session = await getSession();
  if (session?.role !== "customer") {
    return Response.json({ message: "Customer sign-in required." }, { status: 401 });
  }

  const orders = getOrdersByUserId(session.id);
  const rows = [
    ["Order ID", "Date", "Status", "Items", "Total (ETB)", "Delivery address"],
    ...orders.map((order) => [
      order.id,
      order.createdAt,
      order.status,
      order.items.map((item) => `${item.quantity} x ${item.name}`).join("; "),
      order.total,
      order.address,
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="addis-eats-order-history.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
