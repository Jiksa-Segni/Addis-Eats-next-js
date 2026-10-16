"use server";

import { revalidatePath } from "next/cache";
import { getOrderById, saveOrder } from "@/lib/orders";
import { orderSchema } from "@/lib/schema";

const session = {
  user: { id: "user-demo" },
};

export async function placeOrder(_previousState, formData) {
  const parsed = orderSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    address: String(formData.get("address") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the form and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const order = saveOrder({
    id: crypto.randomUUID(),
    userId: session.user.id,
    ...parsed.data,
    status: "received",
    createdAt: new Date().toISOString(),
  });

  revalidatePath("/checkout");
  revalidatePath("/cart");

  return {
    success: true,
    message: `Order ${order.id.slice(0, 8)} was placed successfully.`,
    orderId: order.id,
    fieldErrors: {},
  };
}

export async function cancelOrder(orderId) {
  if (!session?.user) {
    throw new Error("Not signed in");
  }

  const order = getOrderById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  if (order.userId !== session.user.id) {
    throw new Error("Not yours");
  }

  order.status = "cancelled";
  order.updatedAt = new Date().toISOString();
  revalidatePath("/checkout");
  return order;
}

export async function updateKitchenOrderStatus(orderId, nextStatus) {
  const order = getOrderById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  const validStatuses = ["received", "preparing", "ready", "completed", "cancelled"];
  if (!validStatuses.includes(nextStatus)) {
    throw new Error("Invalid order status");
  }

  order.status = nextStatus;
  order.updatedAt = new Date().toISOString();
  revalidatePath("/kitchen");
  return order;
}
