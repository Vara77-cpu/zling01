import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import toast from 'react-hot-toast';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [salesReport, setSalesReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStats();
      fetchSalesReport();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const res = await API.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load stats');
    }
  };

  const fetchSalesReport = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      const res = await API.get(`/admin/reports/sales?${params}`);
      setSalesReport(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load sales report');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setDateRange({ ...dateRange, [e.target.name]: e.target.value });
  };

  const applyDateFilter = () => {
    fetchSalesReport();
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (user?.role !== 'admin') return <div className="text-center py-12">Access denied. Admin only.</div>;

  // Prepare chart data
  const dailySalesData = salesReport?.dailySales || [];
  const labels = dailySalesData.map(d => d._id);
  const totals = dailySalesData.map(d => d.total);
  const counts = dailySalesData.map(d => d.count);

  const lineData = {
    labels,
    datasets: [
      {
        label: 'Revenue (₹)',
        data: totals,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.1,
        yAxisID: 'y',
      },
    ],
  };

  const barData = {
    labels,
    datasets: [
      {
        label: 'Number of Orders',
        data: counts,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: { title: { display: true, text: 'Daily Sales' } },
    scales: {
      y: { title: { display: true, text: 'Revenue (₹)' }, beginAtZero: true },
      y1: { title: { display: true, text: 'Orders Count' }, position: 'right', beginAtZero: true },
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm">Total Users</h3>
          <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm">Restaurants</h3>
          <p className="text-2xl font-bold">{stats?.totalRestaurants || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm">Total Orders</h3>
          <p className="text-2xl font-bold">{stats?.totalOrders || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm">Total Revenue</h3>
          <p className="text-2xl font-bold">₹{stats?.totalRevenue?.toFixed(2) || 0}</p>
        </div>
      </div>

      {/* Orders by Status */}
      <div className="bg-white rounded-lg shadow p-4 mb-8">
        <h2 className="text-lg font-semibold mb-4">Orders by Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {stats?.ordersByStatus?.map(({ _id, count }) => (
            <div key={_id} className="flex justify-between border-b py-1">
              <span className="capitalize">{_id.replace('_', ' ')}</span>
              <span className="font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sales Report with Date Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-8">
        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              name="start"
              value={dateRange.start}
              onChange={handleDateChange}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              name="end"
              value={dateRange.end}
              onChange={handleDateChange}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            />
          </div>
          <button
            onClick={applyDateFilter}
            className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
          >
            Apply
          </button>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Daily Sales (Revenue)</h2>
          <Line data={lineData} />
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">Daily Orders Count</h2>
          <Bar data={barData} options={options} />
        </div>
      </div>

      {/* Recent Orders (optional) */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restaurant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats?.recentOrders?.map(order => (
                <tr key={order._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.orderId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.restaurantId?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customerId?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{order.totalAmount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{order.orderStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;