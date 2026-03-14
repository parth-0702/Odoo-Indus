import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MdDashboard, MdInventory2, MdLocalShipping, MdSettings,
  MdPerson, MdChevronLeft, MdChevronRight, MdWarehouse,
  MdCallReceived, MdDeliveryDining, MdCompareArrows, MdTune, MdHistory
} from 'react-icons/md';

const navItems = [
  { label: 'Dashboard', icon: <MdDashboard />, path: '/' },
  { label: 'Products', icon: <MdInventory2 />, path: '/products' },
  {
    label: 'Operations', icon: <MdLocalShipping />, children: [
      { label: 'Receipts', icon: <MdCallReceived />, path: '/receipts' },
      { label: 'Deliveries', icon: <MdDeliveryDining />, path: '/deliveries' },
      { label: 'Transfers', icon: <MdCompareArrows />, path: '/transfers' },
      { label: 'Adjustments', icon: <MdTune />, path: '/adjustments' },
      { label: 'Move History', icon: <MdHistory />, path: '/movements' },
    ]
  },
  { label: 'Warehouse', icon: <MdWarehouse />, path: '/warehouse' },
  { label: 'Settings', icon: <MdSettings />, path: '/settings' },
  { label: 'Profile', icon: <MdPerson />, path: '/profile' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [operationsOpen, setOperationsOpen] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">📦</div>
        {!collapsed && <span className="sidebar-logo-text">CoreInventory</span>}
      </div>

      {/* Toggle button */}
      <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? <MdChevronRight /> : <MdChevronLeft />}
      </button>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          if (item.children) {
            return (
              <div key={item.label}>
                <button
                  className={`sidebar-group-btn ${operationsOpen ? 'open' : ''}`}
                  onClick={() => setOperationsOpen(!operationsOpen)}
                  title={collapsed ? item.label : ''}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  {!collapsed && <span className="sidebar-label">{item.label}</span>}
                  {!collapsed && <span className="sidebar-chevron">{operationsOpen ? '▾' : '▸'}</span>}
                </button>
                {operationsOpen && (
                  <div className="sidebar-submenu">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) => `sidebar-link sidebar-sub-link ${isActive ? 'active' : ''}`}
                        title={collapsed ? child.label : ''}
                      >
                        <span className="sidebar-icon">{child.icon}</span>
                        {!collapsed && <span className="sidebar-label">{child.label}</span>}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : ''}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="sidebar-logout" title="Logout">
          <span>🚪</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
