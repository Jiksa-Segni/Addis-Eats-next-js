import { notFound } from "next/navigation";
import { getPublicOrderById } from "@/lib/orders";
import OrderStatus from "./OrderStatus";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }) {
  const { id } = await params;
  const order = getPublicOrderById(id);

  if (!order) {
    notFound();
  }

  return <OrderStatus id={id} initial={order} />;
}
