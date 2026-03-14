import { cn } from '@/lib/utils';

type Status = 'draft' | 'ready' | 'done' | 'cancelled' | 'pick' | 'pack' | 'pending' | 'active' | 'inactive';

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  ready: { label: 'Ready', className: 'bg-warning/15 text-warning' },
  done: { label: 'Done', className: 'bg-success/15 text-success' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/15 text-destructive' },
  pick: { label: 'Pick', className: 'bg-primary/15 text-primary' },
  pack: { label: 'Pack', className: 'bg-warning/15 text-warning' },
  pending: { label: 'Pending', className: 'bg-warning/15 text-warning' },
  active: { label: 'Active', className: 'bg-success/15 text-success' },
  inactive: { label: 'Inactive', className: 'bg-muted text-muted-foreground' },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-muted text-muted-foreground' };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium capitalize', config.className, className)}>
      {config.label}
    </span>
  );
}
