import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  // Add or update item in cart (optimistic update)
  const addToCart = (item) => {
    setCart((prevCart) => {
      // Find if item exists (same food_item_id, size_string, spice_level)
      const idx = prevCart.findIndex(
        (ci) =>
          ci.food_item_id === item.food_item_id &&
          ci.size_string === item.size_string &&
          ci.spice_level === item.spice_level
      );
      if (idx !== -1) {
        // Update quantity
        const updated = [...prevCart];
        updated[idx] = {
          ...updated[idx],
          quantity: updated[idx].quantity + item.quantity,
        };
        return updated;
      } else {
        // Add new item
        return [...prevCart, item];
      }
    });
  };

  // Replace cart with backend data
  const setCartFromBackend = (cartData) => {
    setCart(cartData);
  };

  // Clear cart
  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, addToCart, setCartFromBackend, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
} 