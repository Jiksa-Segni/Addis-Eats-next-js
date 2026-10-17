import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getOrderById } from "@/lib/orders";
import OrderStatus from "./OrderStatus";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }) {
  const { id } = await params;

  const session = await getSession();
  if (session?.role !== "customer") {
    redirect(`/signin?next=${encodeURIComponent(`/orders/${id}`)}`);
  }

  const order = getOrderById(id);

  if (!order) {
    notFound();
  }

  if (order.userId !== session.id) {
    notFound();
  }

  // Public-safe projection passed to the client component as initial server data.
  // address is included so the delivery map can show the destination neighbourhood.
  const publicOrder = {
    id: order.id,
    status: order.status,
    address: order.address ?? null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt ?? order.createdAt,
  };

  return <OrderStatus id={id} initial={publicOrder} />;
}
