import { getDishById } from "@/lib/dishes";

const orderStore = globalThis.__addisEatsOrders ?? new Map();
globalThis.__addisEatsOrders = orderStore;

export async function resolveOrderItems(items) {
  const orderItems = await Promise.all(
    items.map(async ({ id, quantity }) => {
      const dish = await getDishById(id);
      return dish
        ? { id: dish.id, name: dish.name, price: dish.price, quantity, total: dish.price * quantity }
        : null;
    })
  );

  if (orderItems.some((item) => item === null)) {
    return null;
  }

  return {
    items: orderItems,
    total: orderItems.reduce((sum, item) => sum + item.total, 0),
  };
}

export function saveOrder(order) {
  orderStore.set(order.id, order);
  return order;
}

export function getOrders() {
  return Array.from(orderStore.values());
}

export function getOrdersByUserId(userId) {
  return getOrders()
    .filter((order) => order.userId === userId)
    .sort(
      (left, right) =>
        new Date(right.createdAt) - new Date(left.createdAt) ||
        right.id.localeCompare(left.id)
    );
}

export function getOrderById(id) {
  return orderStore.get(id) ?? null;
}

export function getPublicOrderById(id) {
  const order = getOrderById(id);
  if (!order) {
    return null;
  }

  return {
    id: order.id,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt ?? order.createdAt,
  };
}
