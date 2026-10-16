const orderStore = globalThis.__addisEatsOrders ?? new Map();
globalThis.__addisEatsOrders = orderStore;

export function saveOrder(order) {
  orderStore.set(order.id, order);
  return order;
}

export function getOrders() {
  return Array.from(orderStore.values());
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
