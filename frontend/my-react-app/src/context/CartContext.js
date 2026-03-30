import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('zling_cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('zling_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Add item to cart
  const addToCart = (item, restaurantId, restaurantName) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(
        i => i.menuItemId === item._id && i.restaurantId === restaurantId
      );
      if (existingItem) {
        return prevItems.map(i =>
          i.menuItemId === item._id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [
        ...prevItems,
        {
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity: 1,
          restaurantId,
          restaurantName,
          isVeg: item.isVeg
        }
      ];
    });
  };

  // Remove item from cart
  const removeFromCart = (menuItemId) => {
    setCartItems(prevItems => prevItems.filter(i => i.menuItemId !== menuItemId));
  };

  // Update quantity
  const updateQuantity = (menuItemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(i =>
        i.menuItemId === menuItemId ? { ...i, quantity } : i
      )
    );
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Calculate totals
  const getCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getItemCount = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getItemCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};