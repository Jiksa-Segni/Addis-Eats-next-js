/**
 * Authenticated order status polling endpoint.
 *
 * The OrderStatus client component polls this route every 2–5 seconds.
 * Returns the public-safe projection: id, status, address, createdAt, updatedAt.
 * Ownership is enforced — a customer can only poll their own orders.
 */
import { getSession } from "@/lib/auth";
import { getOrderById } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const session = await getSession();

  if (session?.role !== "customer") {
    return Response.json({ error: "Customer sign-in required." }, { status: 401 });
  }

  const { id } = await params;
  const order = getOrderById(id);

  if (!order || order.userId !== session.id) {
    return Response.json({ error: "Order not found." }, { status: 404 });
  }

  return Response.json({
    id: order.id,
    status: order.status,
    address: order.address ?? null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt ?? order.createdAt,
  });
}
