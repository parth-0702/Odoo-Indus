import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Warehouse, ClipboardList,
  ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight,
  SlidersHorizontal, History, BarChart3, Settings,
  User, LogOut, ChevronDown, Layers
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: React.FC<{ className?: string }>;
  to?: string;
  children?: { label: string; to: string; icon: React.FC<{ className?: string }> }[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  {
    label: 'Products', icon: Package,
    children: [
      { label: 'Product List', to: '/products', icon: Package },
      { label: 'Create Product', to: '/products/create', icon: Package },
    ]
  },
  {
    label: 'Operations', icon: ClipboardList,
    children: [
      { label: 'Receipts', to: '/operations/receipts', icon: ArrowDownToLine },
      { label: 'Delivery Orders', to: '/operations/deliveries', icon: ArrowUpFromLine },
      { label: 'Internal Transfers', to: '/operations/transfers', icon: ArrowLeftRight },
      { label: 'Adjustments', to: '/operations/adjustments', icon: SlidersHorizontal },
    ]
  },
  { label: 'Move History', icon: History, to: '/history' },
  { label: 'Warehouses', icon: Warehouse, to: '/warehouses' },
  { label: 'Reports', icon: BarChart3, to: '/reports' },
  { label: 'Settings', icon: Settings, to: '/settings' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const logout = useAuthStore(s => s.logout);
  const user = useAuthStore(s => s.user);
  const [openGroups, setOpenGroups] = useState<string[]>(['Products', 'Operations']);

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={cn(
      'h-screen flex flex-col transition-all duration-300 ease-in-out border-r border-sidebar-border bg-sidebar relative',
      collapsed ? 'w-[64px]' : 'w-[240px]'
    )}>
      {/* Logo */}
      <div className={cn(
        'flex items-center h-[60px] border-b border-sidebar-border shrink-0 px-4 gap-3',
        collapsed && 'justify-center px-0'
      )}>
        <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shrink-0 glow-primary animate-pulse-glow">
          <Layers className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="font-bold text-foreground text-sm tracking-wide">CoreInventory</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-3">
        {navItems.map((item) => {
          if (item.to) {
            return (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.to === '/'}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 rounded-xl text-sm transition-all duration-200 group relative',
                  collapsed ? 'w-10 h-10 mx-auto justify-center' : 'px-3 py-2.5',
                  isActive
                    ? 'bg-primary/18 text-primary font-semibold shadow-inner ring-1 ring-primary/20'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                    )}
                    <item.icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-primary' : 'text-sidebar-foreground')} />
                    {!collapsed && <span className={cn('truncate', isActive && 'tracking-wide')}>{item.label}</span>}
                  </>
                )}
              </NavLink>
            );
          }

          const isOpen = openGroups.includes(item.label);
          return (
            <div key={item.label} className={cn('space-y-1', !collapsed && 'pb-2 border-b border-sidebar-border/40 last:border-b-0 last:pb-0')}>
              {/* Group header (looks like a section header, not a link) */}
              <button
                onClick={() => !collapsed && toggleGroup(item.label)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'w-full flex items-center gap-3 rounded-xl transition-all duration-200',
                  'text-sidebar-accent-foreground/90 hover:text-sidebar-accent-foreground',
                  'bg-transparent hover:bg-sidebar-accent/60',
                  collapsed ? 'w-10 h-10 mx-auto justify-center' : 'px-3 py-2.5'
                )}
              >
                <item.icon className={cn('w-4 h-4 shrink-0', isOpen ? 'text-primary' : 'text-sidebar-foreground')} />
                {!collapsed && (
                  <>
                    <span className={cn('flex-1 text-left text-[12px] font-semibold uppercase tracking-wider', isOpen && 'text-primary')}>
                      {item.label}
                    </span>
                    <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200 text-sidebar-foreground', isOpen && 'rotate-180')} />
                  </>
                )}
              </button>

              {!collapsed && isOpen && (
                <div className="ml-2 mt-0.5 pl-4 border-l border-sidebar-border/60 space-y-1">
                  {item.children?.map(child => (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      className={({ isActive }) => cn(
                        'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] transition-all duration-200 group',
                        isActive
                          ? 'text-primary font-semibold bg-primary/12 ring-1 ring-primary/15'
                          : 'text-sidebar-foreground/80 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent'
                      )}
                    >
                      {({ isActive }) => (
                        <>
                          {/* bullet indicator */}
                          <span className={cn(
                            'w-1.5 h-1.5 rounded-full shrink-0',
                            isActive ? 'bg-primary' : 'bg-sidebar-border'
                          )} />
                          <child.icon className={cn('w-3.5 h-3.5 shrink-0', isActive ? 'text-primary' : 'text-sidebar-foreground/80')} />
                          <span className="truncate">{child.label}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className={cn('border-t border-sidebar-border py-3 px-2 space-y-0.5 shrink-0')}>
        <NavLink
          to="/profile"
          title={collapsed ? 'Profile' : undefined}
          className={({ isActive }) => cn(
            'flex items-center gap-3 rounded-xl text-sm transition-all duration-200',
            collapsed ? 'w-10 h-10 mx-auto justify-center' : 'px-3 py-2.5',
            isActive ? 'bg-primary/15 text-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          )}
        >
          <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center shrink-0 glow-primary">
            <span className="text-primary-foreground text-xs font-bold leading-none">
              {user?.fullName?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-sidebar-accent-foreground truncate leading-tight">{user?.fullName}</p>
              <p className="text-[10px] text-sidebar-foreground capitalize leading-tight">{user?.role}</p>
            </div>
          )}
        </NavLink>
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className={cn(
            'w-full flex items-center gap-3 rounded-xl text-sm text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200',
            collapsed ? 'w-10 h-10 mx-auto justify-center' : 'px-3 py-2.5'
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>

        {/* Toggle button */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={onToggle}
            className="w-7 h-7 rounded-lg bg-sidebar-accent border border-sidebar-border flex items-center justify-center text-sidebar-foreground hover:text-primary hover:border-primary/30 transition-all duration-200"
          >
            <svg viewBox="0 0 16 16" className="w-3 h-3 fill-current">
              {collapsed
                ? <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                : <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              }
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
