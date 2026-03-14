import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon: React.ReactNode;
  iconBg?: string;
  className?: string;
  onClick?: () => void;
}

export default function StatCard({ title, value, subtitle, trend, icon, iconBg, className, onClick }: StatCardProps) {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'card-elevated rounded-xl p-4 flex flex-col gap-3 animate-fade-in',
        onClick && 'cursor-pointer hover:border-primary/30 transition-colors',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{title}</p>
        </div>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', iconBg ?? 'bg-primary/15')}>
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-3">
        <span className="text-2xl font-bold text-foreground">{typeof value === 'number' ? value.toLocaleString() : value}</span>
        {trend !== undefined && (
          <span className={cn('flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-md mb-0.5', isPositive ? 'stat-up' : 'stat-down')}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      {subtitle && <p className="text-muted-foreground text-xs">{subtitle}</p>}
    </div>
  );
}
