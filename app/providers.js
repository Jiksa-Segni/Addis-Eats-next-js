"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEYS = {
  user: "addis-eats-user",
  favorites: "addis-eats-favorites",
  cart: "addis-eats-cart",
};

const CartFavoritesContext = createContext(null);

function readStoredValue(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch {
    return fallback;
  }
}

export function Providers({ children }) {
  const [user, setUser] = useState(() => readStoredValue(STORAGE_KEYS.user, null));
  const [favorites, setFavorites] = useState(() => readStoredValue(STORAGE_KEYS.favorites, []));
  const [cart, setCart] = useState(() => readStoredValue(STORAGE_KEYS.cart, []));

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
  }, [cart]);

  const addToCart = (dish) => {
    setCart((current) => {
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
      setCart((current) => current.filter((item) => item.id !== dishId));
      return;
    }

    setCart((current) =>
      current.map((item) =>
        item.id === dishId ? { ...item, quantity: nextQuantity } : item
      )
    );
  };

  const removeFromCart = (dishId) => {
    setCart((current) => current.filter((item) => item.id !== dishId));
  };

  const toggleFavorite = (dishId) => {
    setFavorites((current) =>
      current.includes(dishId)
        ? current.filter((id) => id !== dishId)
        : [...current, dishId]
    );
  };

  const isFavorite = (dishId) => favorites.includes(dishId);

  const signIn = (nextUser) => {
    setUser(nextUser);
  };

  const signOut = () => {
    setUser(null);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value = useMemo(
    () => ({
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
      signOut,
    }),
    [user, cart, favorites, totalItems, totalPrice]
  );

  return <CartFavoritesContext.Provider value={value}>{children}</CartFavoritesContext.Provider>;
}

export function useCartFavorites() {
  const context = useContext(CartFavoritesContext);

  if (!context) {
    throw new Error("useCartFavorites must be used within Providers");
  }

  return context;
}
