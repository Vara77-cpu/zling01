import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import toast from 'react-hot-toast';
import socket from '../services/socket';

const DeliveryPartnerDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await API.get('/orders');
      // Filter: orders that are assigned to me OR ready and unassigned
      const myOrders = res.data.filter(order => 
        (order.deliveryPartnerId === user?.id) ||
        (order.orderStatus === 'ready' && !order.deliveryPartnerId)
      );
      setOrders(myOrders);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  // Socket updates
  useEffect(() => {
    if (user?.id) {
      socket.on('orderStatusUpdated', (data) => {
        fetchOrders(); // refresh on any status change
      });
      return () => socket.off('orderStatusUpdated');
    }
  }, [user]);

  const acceptOrder = async (orderId) => {
    try {
      await API.put(`/orders/${orderId}/status`, { 
        status: 'picked_up',
        deliveryPartnerId: user.id
      });
      toast.success('Order accepted');
      fetchOrders();
    } catch (err) {
      toast.error('Failed to accept order');
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await API.put(`/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order marked as ${newStatus.replace('_', ' ')}`);
      fetchOrders();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <div className="text-center py-12">Loading orders...</div>;

  if (!user) return <div className="text-center py-12">Please log in.</div>;

  if (user.role !== 'delivery_partner') {
    return <div className="text-center py-12">Access denied. Only delivery partners can view this page.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Delivery Partner Dashboard</h1>
      <div className="space-y-4">
        {orders.length === 0 && <p className="text-gray-500">No orders available.</p>}
        {orders.map(order => (
          <div key={order._id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold">Order #{order.orderId}</p>
                <p className="text-sm text-gray-600">Status: {order.orderStatus.replace('_', ' ')}</p>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <div className="mt-2">
              <p>Restaurant: {order.restaurantId?.name}</p>
              <p>Customer: {order.customerId?.name} ({order.customerId?.phone})</p>
              <p>Address: {order.deliveryAddress?.street}, {order.deliveryAddress?.area}, {order.deliveryAddress?.city} - {order.deliveryAddress?.pincode}</p>
              <div className="mt-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="text-sm">{item.quantity} x {item.name}</div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {order.orderStatus === 'ready' && !order.deliveryPartnerId && (
                <button
                  onClick={() => acceptOrder(order._id)}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Accept Order
                </button>
              )}
              {order.deliveryPartnerId === user.id && order.orderStatus === 'picked_up' && (
                <button
                  onClick={() => updateStatus(order._id, 'on_the_way')}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Start Delivery
                </button>
              )}
              {order.deliveryPartnerId === user.id && order.orderStatus === 'on_the_way' && (
                <button
                  onClick={() => updateStatus(order._id, 'delivered')}
                  className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                >
                  Mark Delivered
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeliveryPartnerDashboard;