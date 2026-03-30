import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';
import socket from '../services/socket';

const OrderConfirmation = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const res = await API.get(`/orders/${id}`);
      setOrder(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  // Socket.io for real-time status updates
  useEffect(() => {
    if (order?._id) {
      socket.emit('joinOrderRoom', order._id);
      socket.on('orderStatusUpdated', (data) => {
        if (data.orderId === order._id) {
          // Refresh order data when status changes
          fetchOrder();
        }
      });
      return () => {
        socket.off('orderStatusUpdated');
      };
    }
  }, [order]);

  if (loading) return <div className="text-center py-12">Loading order...</div>;
  if (!order) return <div className="text-center py-12">Order not found</div>;

  const statusSteps = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way', 'delivered'];
  const currentIndex = statusSteps.indexOf(order.orderStatus);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
      <p className="text-gray-600 mb-6">Order #{order.orderId}</p>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Order Status</h2>
        <div className="flex justify-between mb-8">
          {statusSteps.map((step, idx) => (
            <div key={step} className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                idx <= currentIndex ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {idx <= currentIndex ? '✓' : idx + 1}
              </div>
              <span className="text-xs mt-1 capitalize">{step.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-600">
          Estimated delivery: {new Date(order.estimatedDeliveryTime).toLocaleTimeString()}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Items</h2>
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between py-2 border-b">
            <span>{item.quantity} x {item.name}</span>
            <span>₹{item.price * item.quantity}</span>
          </div>
        ))}
        <div className="mt-4 pt-2 border-t">
          <div className="flex justify-between"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
          <div className="flex justify-between"><span>Delivery Fee</span><span>₹{order.deliveryFee}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>₹{order.tax}</span></div>
          <div className="flex justify-between font-bold mt-2"><span>Total</span><span>₹{order.totalAmount}</span></div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Delivery Address</h2>
        <p>{order.deliveryAddress.street}</p>
        <p>{order.deliveryAddress.area}, {order.deliveryAddress.city}</p>
        <p>{order.deliveryAddress.pincode}</p>
        {order.specialInstructions && (
          <p className="mt-2 text-gray-600">Instructions: {order.specialInstructions}</p>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link to="/" className="text-orange-600 hover:underline">Continue Shopping</Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;