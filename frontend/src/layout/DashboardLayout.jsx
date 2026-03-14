import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Outlet, useLocation } from 'react-router-dom';

const pageTitles = {
  '/': 'Dashboard',
  '/products': 'Products',
  '/receipts': 'Receipts',
  '/deliveries': 'Deliveries',
  '/transfers': 'Internal Transfers',
  '/adjustments': 'Inventory Adjustments',
  '/movements': 'Move History',
  '/warehouse': 'Warehouse & Locations',
  '/settings': 'Settings',
  '/profile': 'Profile',
};

export default function DashboardLayout() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'CoreInventory';

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Navbar title={title} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
