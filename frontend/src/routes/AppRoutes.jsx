import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layout/DashboardLayout';
import LoginPage from '../modules/auth/LoginPage';
import SignupPage from '../modules/auth/SignupPage';
import DashboardPage from '../modules/dashboard/DashboardPage';
import ProductsPage from '../modules/products/ProductsPage';
import ReceiptsPage from '../modules/receipts/ReceiptsPage';
import DeliveriesPage from '../modules/deliveries/DeliveriesPage';
import TransfersPage from '../modules/transfers/TransfersPage';
import AdjustmentsPage from '../modules/adjustments/AdjustmentsPage';
import WarehousePage from '../modules/warehouse/WarehousePage';
import MovementsPage from '../modules/movements/MovementsPage';
import ProfilePage from '../modules/auth/ProfilePage';
import SettingsPage from '../modules/auth/SettingsPage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="receipts" element={<ReceiptsPage />} />
          <Route path="deliveries" element={<DeliveriesPage />} />
          <Route path="transfers" element={<TransfersPage />} />
          <Route path="adjustments" element={<AdjustmentsPage />} />
          <Route path="warehouse" element={<WarehousePage />} />
          <Route path="movements" element={<MovementsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
