"use client";

import { createContext, useCallback, useContext, useState, useSyncExternalStore } from "react";

const STORAGE_KEYS = {
  favorites: "addis-eats-favorites",
  cart: "addis-eats-cart",
};

const CartFavoritesContext = createContext(null);
const EMPTY_ARRAY = [];
const storedSnapshots = new Map();
const storedListeners = new Map();

function readStoredValue(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  let rawValue;
  let value = fallback;
  try {
    rawValue = window.localStorage.getItem(key);
    const cached = storedSnapshots.get(key);
    if (cached?.rawValue === rawValue) {
      return cached.value;
    }

    const parsed = rawValue ? JSON.parse(rawValue) : fallback;
    value = Array.isArray(parsed) ? parsed : fallback;
  } catch {
    value = fallback;
  }

  storedSnapshots.set(key, { rawValue, value });
  return value;
}

function subscribeToStoredValue(key, listener) {
  let listeners = storedListeners.get(key);
  if (!listeners) {
    listeners = new Set();
    storedListeners.set(key, listeners);
  }
  listeners.add(listener);

  function onStorage(event) {
    if (event.key === key || event.key === null) {
      storedSnapshots.delete(key);
      listener();
    }
  }

  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
    if (listeners.size === 0) {
      storedListeners.delete(key);
    }
  };
}

function saveStoredValue(key, value) {
  const rawValue = JSON.stringify(value);
  window.localStorage.setItem(key, rawValue);
  storedSnapshots.set(key, { rawValue, value });
  storedListeners.get(key)?.forEach((listener) => listener());
}

function updateStoredValue(key, update) {
  saveStoredValue(key, update(readStoredValue(key, EMPTY_ARRAY)));
}

export function Providers({ children, initialUser }) {
  const [user, setUser] = useState(initialUser);
  const favorites = useSyncExternalStore(
    (listener) => subscribeToStoredValue(STORAGE_KEYS.favorites, listener),
    () => readStoredValue(STORAGE_KEYS.favorites, EMPTY_ARRAY),
    () => EMPTY_ARRAY
  );
  const cart = useSyncExternalStore(
    (listener) => subscribeToStoredValue(STORAGE_KEYS.cart, listener),
    () => readStoredValue(STORAGE_KEYS.cart, EMPTY_ARRAY),
    () => EMPTY_ARRAY
  );

  const addToCart = (dish) => {
    updateStoredValue(STORAGE_KEYS.cart, (current) => {
      const existingItem = current.find((item) => item.id === dish.id);

      if (existingItem) {
        return current.map((item) =>
          item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...current, { ...dish, quantity: 1 }];
    });
  };

  const updateQuantity = (dishId, nextQuantity) => {
    if (nextQuantity <= 0) {
      updateStoredValue(STORAGE_KEYS.cart, (current) => current.filter((item) => item.id !== dishId));
      return;
    }

    updateStoredValue(STORAGE_KEYS.cart, (current) =>
      current.map((item) =>
        item.id === dishId ? { ...item, quantity: nextQuantity } : item
      )
    );
  };

  const removeFromCart = (dishId) => {
    updateStoredValue(STORAGE_KEYS.cart, (current) => current.filter((item) => item.id !== dishId));
  };

  const toggleFavorite = (dishId) => {
    updateStoredValue(STORAGE_KEYS.favorites, (current) =>
      current.includes(dishId)
        ? current.filter((id) => id !== dishId)
        : [...current, dishId]
    );
  };

  const isFavorite = (dishId) => favorites.includes(dishId);

  const signIn = useCallback((nextUser) => setUser(nextUser), []);

  const clearCart = useCallback(() => saveStoredValue(STORAGE_KEYS.cart, []), []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value = {
    user,
    cart,
    favorites,
    totalItems,
    totalPrice,
    addToCart,
    updateQuantity,
    removeFromCart,
    toggleFavorite,
    isFavorite,
    signIn,
    clearCart,
  };

  return <CartFavoritesContext.Provider value={value}>{children}</CartFavoritesContext.Provider>;
}

export function useCartFavorites() {
  const context = useContext(CartFavoritesContext);

  if (!context) {
    throw new Error("useCartFavorites must be used within Providers");
  }

  return context;
}
