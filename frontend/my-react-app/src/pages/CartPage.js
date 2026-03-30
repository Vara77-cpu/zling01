import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const CartPage = () => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, getItemCount } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <Link to="/" className="text-orange-600 hover:underline">
          Browse restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Cart ({getItemCount()} items)</h1>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="divide-y divide-gray-200">
          {cartItems.map(item => (
            <div key={item.menuItemId} className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium">{item.name}</h3>
                  <span className="text-xs px-2 py-1 rounded bg-gray-200">
                    {item.isVeg ? '🌱 Veg' : '🍗 Non-Veg'}
                  </span>
                </div>
                <p className="text-gray-500 text-sm">₹{item.price}</p>
                <p className="text-xs text-gray-400">{item.restaurantName}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300"
                >
                  -
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300"
                >
                  +
                </button>
                <button
                  onClick={() => {
                    removeFromCart(item.menuItemId);
                    toast.error('Removed from cart');
                  }}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold">Total:</span>
            <span className="text-xl font-bold">₹{getCartTotal()}</span>
          </div>
          <Link
            to="/checkout"
            className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition-colors text-center block"
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CartPage;