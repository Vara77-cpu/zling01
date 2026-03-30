import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import toast from 'react-hot-toast';
import socket from '../services/socket';

const RestaurantDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const socketConnectedRef = useRef(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null); // for button loading state

  // Log user on mount
  useEffect(() => {
    console.log('Dashboard: user object:', user);
    if (user?.restaurantId) {
      console.log('Dashboard: restaurantId:', user.restaurantId);
    } else {
      console.warn('Dashboard: user has no restaurantId');
    }
  }, [user]);

  const fetchOrders = async () => {
    console.log('Fetching orders...');
    try {
      const res = await API.get('/orders');
      console.log('Fetched orders count:', res.data.length);
      console.log('Fetched orders sample:', res.data.slice(0, 2));
      setOrders(res.data);
    } catch (err) {
      console.error('Fetch orders error:', err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, []);

  // Socket setup
  useEffect(() => {
    if (!user?.restaurantId) {
      console.log('No restaurantId, skipping socket setup');
      return;
    }

    const setupSocket = () => {
      if (!socket.connected) {
        console.log('Socket not connected, connecting...');
        socket.connect();
      }

      // Join the restaurant room
      socket.emit('joinRestaurantRoom', user.restaurantId);
      console.log('Emitted joinRestaurantRoom for:', user.restaurantId);
      socketConnectedRef.current = true;

      // Listen for new orders
      socket.on('newOrder', (newOrder) => {
        console.log('🔥🔥🔥 newOrder event received!', newOrder);
        toast.success(`New order #${newOrder.orderId} received!`);
        fetchOrders();
      });

      // Listen for status updates
      socket.on('orderStatusUpdated', (data) => {
        console.log('🔄 orderStatusUpdated event received:', data);
        fetchOrders();
      });

      // Optional: handle socket disconnect
      socket.on('disconnect', () => {
        console.warn('Socket disconnected');
        socketConnectedRef.current = false;
      });
    };

    setupSocket();

    return () => {
      console.log('Cleaning up socket listeners');
      socket.off('newOrder');
      socket.off('orderStatusUpdated');
      socket.off('disconnect');
    };
  }, [user?.restaurantId]);

  // Polling as backup (every 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Polling for orders...');
      fetchOrders();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    if (!orderId) {
      console.error('No orderId provided');
      toast.error('Invalid order ID');
      return;
    }

    console.log(`Updating order ${orderId} to ${newStatus}`);
    setUpdatingOrderId(orderId);
    try {
      // Ensure orderId is a string
      const response = await API.put(`/orders/${orderId}/status`, { status: newStatus });
      console.log('Update response:', response.data);
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders(); // refresh list
    } catch (err) {
      console.error('Update status error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to update order status';
      toast.error(errorMsg);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Filter orders for the logged-in restaurant
  const myOrders = orders.filter(order => order.restaurantId?._id === user?.restaurantId);
  const activeOrders = myOrders.filter(order =>
    ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way'].includes(order.orderStatus)
  );
  const historyOrders = myOrders.filter(order =>
    ['delivered', 'cancelled'].includes(order.orderStatus)
  );

  const displayedOrders = activeTab === 'active' ? activeOrders : historyOrders;

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      picked_up: 'bg-indigo-100 text-indigo-800',
      on_the_way: 'bg-orange-100 text-orange-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const nextStatusOptions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['ready'],
    ready: ['picked_up'],
    picked_up: ['on_the_way'],
    on_the_way: ['delivered'],
  };

  if (loading) return <div className="text-center py-12">Loading orders...</div>;

  if (!user?.restaurantId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">No Restaurant Assigned</h2>
        <p className="text-gray-600">You are registered as a restaurant owner but don't have a restaurant yet. Please contact the administrator to set up your restaurant.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Restaurant Dashboard</h1>
      <p className="text-gray-600 mb-6">Manage orders for your restaurant</p>

      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 font-medium ${activeTab === 'active' ? 'border-b-2 border-orange-600 text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Active Orders ({activeOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium ${activeTab === 'history' ? 'border-b-2 border-orange-600 text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          History ({historyOrders.length})
        </button>
      </div>

      {displayedOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">No orders to display.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedOrders.map(order => (
            <div key={order._id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-bold">Order #{order.orderId}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                  {order.orderStatus.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Customer</p>
                  <p>{order.customerId?.name}</p>
                  <p className="text-sm text-gray-500">{order.customerId?.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Delivery Address</p>
                  <p className="text-sm">{order.deliveryAddress?.street}</p>
                  <p className="text-sm">{order.deliveryAddress?.area}, {order.deliveryAddress?.city} - {order.deliveryAddress?.pincode}</p>
                </div>
              </div>

              <div className="border-t pt-2 mb-2">
                <p className="text-sm font-medium text-gray-700 mb-1">Items</p>
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.quantity} x {item.name}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="flex justify-between font-medium mt-2">
                  <span>Total</span>
                  <span>₹{order.totalAmount}</span>
                </div>
              </div>

              {activeTab === 'active' && nextStatusOptions[order.orderStatus] && (
                <div className="flex gap-2 mt-2 pt-2 border-t">
                  {nextStatusOptions[order.orderStatus].map(nextStatus => (
                    <button
                      key={nextStatus}
                      type="button"
                      disabled={updatingOrderId === order._id}
                      onClick={() => updateOrderStatus(order._id, nextStatus)}
                      className={`px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition ${
                        updatingOrderId === order._id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {updatingOrderId === order._id
                        ? 'Updating...'
                        : nextStatus === 'cancelled'
                        ? 'Cancel Order'
                        : `Mark as ${nextStatus.replace('_', ' ')}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RestaurantDashboard;