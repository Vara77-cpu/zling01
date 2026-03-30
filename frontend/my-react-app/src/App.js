import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { useCart } from './context/CartContext';
import { useTranslation } from 'react-i18next';
import Login from './pages/Login';
import Register from './pages/Register';
import HomePage from './pages/HomePage';
import RestaurantDetail from './pages/RestaurantDetail';
import CartPage from './pages/CartPage';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation'; // ✅ Correct capitalization
import RestaurantDashboard from './pages/RestaurantDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DeliveryPartnerDashboard from './pages/DeliveryPartnerDashboard';

const Navbar = () => {
  const { getItemCount } = useCart();
  const { user, logout } = useAuth();
  const { i18n } = useTranslation();

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-orange-600 hover:text-orange-700 transition">
          Zling
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/cart" className="relative text-gray-700 hover:text-orange-600 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {getItemCount() > 0 && (
              <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {getItemCount()}
              </span>
            )}
          </Link>
          {/* Language Switcher */}
          <select
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="text-gray-600 border rounded px-2 py-1"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </select>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Hi, {user.name.split(' ')[0]}</span>
              {user.role === 'restaurant_owner' && (
                <Link to="/restaurant/dashboard" className="text-gray-600 hover:text-orange-600 transition">
                  Dashboard
                </Link>
              )}
              {user.role === 'delivery_partner' && (
                <Link to="/delivery/dashboard" className="text-gray-600 hover:text-orange-600 transition">
                  Delivery Dashboard
                </Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin/dashboard" className="text-gray-600 hover:text-orange-600 transition">
                  Admin Dashboard
                </Link>
              )}
              <button
                onClick={logout}
                className="text-gray-600 hover:text-orange-600 transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="text-gray-600 hover:text-orange-600 transition">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/restaurant/:id" element={<RestaurantDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/restaurant/dashboard" element={<RestaurantDashboard />} />
          <Route path="/delivery/dashboard" element={<DeliveryPartnerDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/order/:id" element={<OrderConfirmation />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;