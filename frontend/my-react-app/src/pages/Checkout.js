import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import toast from 'react-hot-toast';

const Checkout = () => {
  const { user } = useAuth();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    area: user?.address?.area || '',
    pincode: user?.address?.pincode || '',
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const subtotal = getCartTotal();
  const deliveryFee = 40; // could be dynamic per restaurant
  const tax = subtotal * 0.05;
  const totalBeforeDiscount = subtotal + deliveryFee + tax;
  const total = totalBeforeDiscount - couponDiscount;

  const applyCoupon = async () => {
    if (!couponCode) return;
    setApplyingCoupon(true);
    try {
      const res = await API.get(`/coupons/validate`, {
        params: {
          code: couponCode,
          restaurantId: cartItems[0]?.restaurantId,
          subtotal: subtotal
        }
      });
      setCouponDiscount(res.data.coupon.discount);
      setCouponError('');
      toast.success(`Coupon applied! You saved ₹${res.data.coupon.discount}`);
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon');
      setCouponDiscount(0);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please login to place order');
      navigate('/login');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      navigate('/');
      return;
    }

    if (!address.street || !address.city || !address.area || !address.pincode) {
      toast.error('Please fill complete delivery address');
      return;
    }

    const restaurantId = cartItems[0].restaurantId;
    const orderItems = cartItems.map(item => ({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      specialInstructions: specialInstructions,
    }));

    const orderData = {
      restaurantId,
      items: orderItems,
      deliveryAddress: address,
      paymentMethod,
      specialInstructions,
      couponCode: couponCode, // send coupon code
    };

    setLoading(true);
    try {
      const response = await API.post('/orders', orderData);
      toast.success('Order placed successfully!');
      clearCart();
      navigate(`/order/${response.data.order._id}`);
    } catch (error) {
      console.error('Order error:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2 mb-4">
            {cartItems.map(item => (
              <div key={item.menuItemId} className="flex justify-between text-sm">
                <span>{item.quantity} x {item.name}</span>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-2 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>₹{deliveryFee}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (5%)</span>
              <span>₹{tax}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Coupon Discount</span>
                <span>-₹{couponDiscount}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span>₹{total}</span>
            </div>
          </div>
        </div>

        {/* Delivery Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Delivery Address</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Street Address"
              value={address.street}
              onChange={e => setAddress({ ...address, street: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <input
              type="text"
              placeholder="Area"
              value={address.area}
              onChange={e => setAddress({ ...address, area: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <input
              type="text"
              placeholder="City"
              value={address.city}
              onChange={e => setAddress({ ...address, city: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <input
              type="text"
              placeholder="Pincode"
              value={address.pincode}
              onChange={e => setAddress({ ...address, pincode: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <h2 className="text-lg font-semibold mt-6 mb-4">Payment Method</h2>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="payment"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={() => setPaymentMethod('cash')}
                className="mr-2"
              />
              Cash on Delivery
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="payment"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={() => setPaymentMethod('card')}
                className="mr-2"
              />
              Credit/Debit Card
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="payment"
                value="upi"
                checked={paymentMethod === 'upi'}
                onChange={() => setPaymentMethod('upi')}
                className="mr-2"
              />
              UPI
            </label>
          </div>

          <h2 className="text-lg font-semibold mt-6 mb-4">Coupon</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              onClick={applyCoupon}
              disabled={applyingCoupon || !couponCode}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
            >
              {applyingCoupon ? 'Applying...' : 'Apply'}
            </button>
          </div>
          {couponError && <p className="text-red-500 text-sm mt-1">{couponError}</p>}
          {couponDiscount > 0 && (
            <p className="text-green-600 text-sm mt-1">Coupon applied! You saved ₹{couponDiscount}</p>
          )}

          <h2 className="text-lg font-semibold mt-6 mb-4">Special Instructions (Optional)</h2>
          <textarea
            rows="2"
            value={specialInstructions}
            onChange={e => setSpecialInstructions(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Any special requests? e.g., extra spicy, no onions..."
          ></textarea>

          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            className="mt-6 w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
          >
            {loading ? 'Placing Order...' : `Place Order • ₹${total}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;