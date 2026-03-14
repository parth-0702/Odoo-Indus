import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronDown, User, KeyRound, LogOut, X, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Notification {
  id?: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: Date;
}

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    // Notifications were previously loaded from local Dexie.
    // Dexie has been removed; a server notifications endpoint can be added later.
    setNotifications([]);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifications]);

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const typeColor: Record<string, string> = {
    warning: 'bg-warning',
    success: 'bg-success',
    error: 'bg-destructive',
    info: 'bg-primary',
  };

  return (
    <header className="h-[60px] flex items-center gap-3 px-5 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
      {/* Logo area / brand */}
      <div className="flex items-center gap-2 mr-2">
        <Zap className="w-4 h-4 text-primary" />
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            placeholder="Start Search Here..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-muted/60 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(v => !v)}
            className="relative w-9 h-9 rounded-xl bg-muted/60 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-200"
          >
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full text-[9px] text-primary-foreground flex items-center justify-center font-bold shadow-neon">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-card-elevated rounded-2xl border border-border shadow-card-dark z-50 animate-scale-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="font-semibold text-foreground text-sm">Notifications</span>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary hover:text-primary/80 transition-colors">
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-muted-foreground text-sm p-4 text-center">No notifications</p>
                ) : notifications.map(n => (
                  <div key={n.id} className={cn('p-3.5 border-b border-border last:border-0 transition-colors hover:bg-muted/30', !n.read && 'bg-primary/5')}>
                    <div className="flex items-start gap-2.5">
                      <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', typeColor[n.type] ?? 'bg-primary')} />
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground text-xs font-semibold">{n.title}</p>
                        <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">{n.message}</p>
                        <p className="text-muted-foreground/50 text-[10px] mt-1">{format(new Date(n.createdAt), 'dd MMM yyyy')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-muted/60 border border-border hover:border-primary/30 transition-all duration-200">
              <div className="w-7 h-7 gradient-primary rounded-full flex items-center justify-center shrink-0 glow-primary">
                <span className="text-primary-foreground text-xs font-bold">
                  {user?.fullName?.charAt(0)?.toUpperCase() ?? 'U'}
                </span>
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-foreground text-xs font-semibold leading-tight">{user?.fullName}</p>
                <p className="text-muted-foreground text-[10px] capitalize leading-tight">{user?.role}</p>
              </div>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border-border rounded-xl shadow-card-dark">
            <DropdownMenuItem onClick={() => navigate('/profile')} className="text-foreground hover:bg-muted cursor-pointer rounded-lg text-sm">
              <User className="w-3.5 h-3.5 mr-2 text-muted-foreground" /> My Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/profile?tab=password')} className="text-foreground hover:bg-muted cursor-pointer rounded-lg text-sm">
              <KeyRound className="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Change Password
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive hover:bg-destructive/10 cursor-pointer rounded-lg text-sm">
              <LogOut className="w-3.5 h-3.5 mr-2" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
