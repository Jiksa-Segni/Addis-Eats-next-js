"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, getSession, isAdminCredential, isSafeRedirectPath, normalizePhone, setSession } from "@/lib/auth";
import { addDish, removeDish, setDishAvailability } from "@/lib/dishes";
import { getOrderById, resolveOrderItems, saveOrder } from "@/lib/orders";
import { dishSchema, orderSchema } from "@/lib/schema";

async function requireAdmin() {
  const session = await getSession();
  if (session?.role !== "admin") {
    throw new Error("Admin access required");
  }
}

function revalidateMenuManagement() {
  revalidatePath("/");
  revalidatePath("/menu");
  revalidatePath("/kitchen/items");
  revalidatePath("/api/dishes");
}

export async function createDish(formData) {
  await requireAdmin();
  const parsed = dishSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    price: Number(formData.get("price")),
    description: String(formData.get("description") ?? ""),
    image: String(formData.get("image") ?? "").trim() || "/images/dorowet.jpg",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join(" "));
  }

  addDish(parsed.data);
  revalidateMenuManagement();
  redirect("/kitchen/items?result=added");
}

export async function changeDishAvailability(formData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const isAvailable = String(formData.get("isAvailable") ?? "") === "true";
  const updatedDish = setDishAvailability(id, isAvailable);
  if (!updatedDish) {
    throw new Error("Dish not found");
  }

  revalidateMenuManagement();
  redirect(`/kitchen/items?result=${isAvailable ? "enabled" : "disabled"}`);
}

export async function deleteDish(formData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!removeDish(id)) {
    throw new Error("Dish not found");
  }

  revalidateMenuManagement();
  redirect("/kitchen/items?result=removed");
}

export async function authenticate(_previousState, formData) {
  const role = String(formData.get("role") ?? "customer");
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "");
  const redirectTo = isSafeRedirectPath(nextPath)
    ? nextPath
    : role === "admin"
      ? "/kitchen"
      : "/menu";

  if (role === "admin") {
    if (!isAdminCredential(phone, password)) {
      return { success: false, message: "Admin phone number or password is incorrect." };
    }

    await setSession({
      id: "admin",
      phone,
      name: process.env.ADMIN_NAME || "Admin",
      role: "admin",
    });
    return {
      success: true,
      redirectTo,
      user: { id: "admin", phone, name: process.env.ADMIN_NAME || "Admin", role: "admin" },
    };
  }

  if (role !== "customer") {
    return { success: false, message: "Choose a valid sign-in type." };
  }

  const parsedPhone = orderSchema.shape.phone.safeParse(phone);
  if (!parsedPhone.success || password.length < 6) {
    return {
      success: false,
      message: "Enter a valid Ethiopian phone number and a password with at least 6 characters.",
    };
  }

  const user = {
    id: `customer:${phone}`,
    phone,
    name: phone,
    role: "customer",
  };
  await setSession(user);
  return { success: true, redirectTo, user };
}

export async function signOut() {
  await clearSession();
  return true;
}

export async function placeOrder(_previousState, formData) {
  const session = await getSession();
  if (session?.role !== "customer") {
    return {
      success: false,
      message: "Please sign in as a customer before placing an order.",
      fieldErrors: {},
    };
  }

  let items;
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return {
      success: false,
      message: "Your cart could not be read. Please refresh and try again.",
      fieldErrors: {},
    };
  }

  const parsed = orderSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    phone: session.phone,
    address: String(formData.get("address") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    items,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the form and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const resolvedItems = await resolveOrderItems(parsed.data.items);
  if (!resolvedItems) {
    return {
      success: false,
      message: "Your cart contains an item that is no longer available. Please refresh your cart.",
      fieldErrors: {},
    };
  }

  const order = saveOrder({
    id: crypto.randomUUID(),
    userId: session.id,
    name: parsed.data.name,
    phone: session.phone,
    address: parsed.data.address,
    notes: parsed.data.notes,
    items: resolvedItems.items,
    total: resolvedItems.total,
    status: "received",
    createdAt: new Date().toISOString(),
  });

  revalidatePath("/checkout");
  revalidatePath("/cart");
  revalidatePath("/orders");
  revalidatePath("/kitchen");

  return {
    success: true,
    message: `Order ${order.id.slice(0, 8)} was placed successfully.`,
    orderId: order.id,
    fieldErrors: {},
  };
}

export async function cancelOrder(orderId) {
  const session = await getSession();
  if (session?.role !== "customer") {
    throw new Error("Not signed in");
  }

  const order = getOrderById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  if (order.userId !== session.id) {
    throw new Error("Not yours");
  }

  order.status = "cancelled";
  order.updatedAt = new Date().toISOString();
  revalidatePath("/checkout");
  return order;
}

export async function updateKitchenOrderStatus(orderId, nextStatus) {
  const session = await getSession();
  if (session?.role !== "admin") {
    throw new Error("Admin access required");
  }

  const order = getOrderById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  // on_the_way and delivered are delivery-phase statuses that extend the kitchen workflow.
  const validStatuses = ["received", "preparing", "ready", "on_the_way", "delivered", "completed", "cancelled"];
  if (!validStatuses.includes(nextStatus)) {
    throw new Error("Invalid order status");
  }

  order.status = nextStatus;
  order.updatedAt = new Date().toISOString();
  revalidatePath("/kitchen");
  revalidatePath("/orders");
  return order;
}

/**
 * Auto-advance action called by the customer's OrderStatus component.
 * The client runs the 2-second timers for preparing→on_the_way and
 * on_the_way→delivered, then calls this action to commit the state change.
 * Only allowed for the delivery-phase transitions to prevent customers from
 * advancing arbitrary statuses.
 */
export async function advanceDeliveryStatus(orderId, nextStatus) {
  const session = await getSession();
  if (session?.role !== "customer") {
    throw new Error("Not signed in as customer");
  }

  const order = getOrderById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  if (order.userId !== session.id) {
    throw new Error("Not your order");
  }

  // Only the two automatic delivery transitions are allowed here.
  const allowedTransitions = {
    preparing: "on_the_way",
    on_the_way: "delivered",
  };

  if (allowedTransitions[order.status] !== nextStatus) {
    // Silently ignore if the server already moved past this (race condition on poll).
    return order;
  }

  order.status = nextStatus;
  order.updatedAt = new Date().toISOString();
  revalidatePath("/orders");
  revalidatePath("/kitchen");
  return order;
}
