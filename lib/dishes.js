export const dishes = [
  {
    id: "1",
    name: "Doro Wet",
    price: 450,
    description: "A rich chicken stew with onion, ginger, and berbere, served with injera.",
    image: "/images/dorowet.jpg",
  },
  {
    id: "2",
    name: "Kitfo",
    price: 500,
    description: "Lean minced beef with mitmita, butter, and a warm spice finish.",
    image: "/images/kitfo.webp",
  },
  {
    id: "3",
    name: "Shiro",
    price: 180,
    description: "A comforting chickpea stew with lentils and warm spices.",
    image: "/images/shiro.jpg",
  },
  {
    id: "4",
    name: "Tibs",
    price: 420,
    description: "Sautéed beef cubes with onion, peppers, and Ethiopian spices.",
    image: "/images/Tibs.jpg",
  },
  {
    id: "5",
    name: "Ethiopian Coffee",
    price: 120,
    description: "Traditional coffee ritual with a deep, aromatic cup to finish the meal.",
    image: "/images/Ethiopian%20Coffee.jpg",
  },
  {
    id: "6",
    name: "Fresh Mango Juice",
    price: 95,
    description: "A chilled fruit blend with bright tropical sweetness.",
    image: "/images/Fresh%20Mango%20Juice.jpg",
  },
  {
    id: "7",
    name: "Tej",
    price: 150,
    description: "A lightly sweet honey wine with floral, aromatic notes.",
    image: "/images/Tej.jpg",
  },
  {
    id: "8",
    name: "Margherita Pizza",
    price: 360,
    description: "A classic pizza with tomato sauce, mozzarella, and basil.",
    image: "/images/Margherita%20Pizza.jpg",
  },
  {
    id: "9",
    name: "Chicken Burger",
    price: 310,
    description: "Crispy chicken, soft bun, lettuce, and house sauce.",
    image: "/images/Chicken%20Burger.jpg",
  },
  {
    id: "10",
    name: "Classic Burger",
    price: 290,
    description: "A juicy grilled burger layered with cheddar and fresh toppings.",
    image: "/images/Classic%20Burger.jpg",
  },
  {
    id: "11",
    name: "Veggie Pizza",
    price: 340,
    description: "Loaded with vegetables and a rich, savory cheese finish.",
    image: "/images/Veggie%20Pizza.jpg",
  },
  {
    id: "12",
    name: "Spris Juice",
    price: 110,
    description: "A refreshing citrus blend served cold and bright.",
    image: "/images/Spris%20Juice.jpg",
  },
];

const dishStore = globalThis.__addisEatsMenu ?? new Map();
if (!globalThis.__addisEatsMenu) {
  for (const dish of dishes) {
    dishStore.set(dish.id, { ...dish, isAvailable: true });
  }
  globalThis.__addisEatsMenu = dishStore;
}

export const dishesPageSize = 4;

export async function getAllDishes() {
  return Array.from(dishStore.values());
}

export async function getDishes() {
  return (await getAllDishes()).filter((dish) => dish.isAvailable);
}

export async function getDishById(id) {
  const dish = dishStore.get(String(id));
  return dish?.isAvailable ? dish : null;
}

export function addDish(dish) {
  const id = `dish-${crypto.randomUUID()}`;
  const newDish = { ...dish, id, isAvailable: true };
  dishStore.set(id, newDish);
  return newDish;
}

export function setDishAvailability(id, isAvailable) {
  const dish = dishStore.get(String(id));
  if (!dish) {
    return null;
  }

  const updatedDish = { ...dish, isAvailable };
  dishStore.set(updatedDish.id, updatedDish);
  return updatedDish;
}

export function removeDish(id) {
  return dishStore.delete(String(id));
}

export async function getDishesPage({ query = "", page = 1 } = {}) {
  const availableDishes = await getDishes();
  const normalizedQuery = query.trim().toLowerCase();
  const filteredDishes = normalizedQuery
    ? availableDishes.filter((dish) =>
        `${dish.name} ${dish.description}`.toLowerCase().includes(normalizedQuery)
      )
    : availableDishes;
  const totalPages = Math.max(1, Math.ceil(filteredDishes.length / dishesPageSize));
  const start = (page - 1) * dishesPageSize;

  return {
    dishes: filteredDishes.slice(start, start + dishesPageSize),
    page,
    pageSize: dishesPageSize,
    total: filteredDishes.length,
    totalPages,
  };
}
