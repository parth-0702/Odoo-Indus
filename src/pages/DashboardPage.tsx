import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Warehouse, ArrowDownToLine, ArrowUpFromLine,
  ArrowLeftRight, AlertTriangle, TrendingUp, TrendingDown,
  MoreHorizontal, Activity, Boxes, Clock, CheckCircle2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { api, type StockLedgerDTO } from '@/lib/api';
import * as repo from '@/lib/repo';
import { useInventoryStore } from '@/store/inventoryStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const CHART_COLORS = {
  primary: 'hsl(74 100% 57%)',
  violet: 'hsl(258 84% 66%)',
  success: 'hsl(142 69% 45%)',
  warning: 'hsl(38 95% 55%)',
  destructive: 'hsl(0 72% 55%)',
  muted: 'hsl(215 14% 30%)',
};

// Mini sparkline component
function Sparkline({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  const points = data.map((v, i) => ({
    x: i,
    y: v,
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={points} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <defs>
          <linearGradient id={`spark-${color.replace(/[^a-z]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="y"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${color.replace(/[^a-z]/gi, '')})`}
          dot={false}
          isAnimationActive
          animationDuration={600}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

type TooltipProps = { active?: boolean; payload?: Array<{ name?: string; value?: number }>; label?: unknown };

function DarkTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur px-3 py-2 shadow-xl">
      {label !== undefined && <p className="text-xs font-semibold text-foreground">{String(label)}</p>}
      <div className="mt-1 space-y-0.5">
        {payload.map((p, idx) => (
          <div key={idx} className="flex items-center justify-between gap-6 text-xs">
            <span className="text-muted-foreground">{p.name}</span>
            <span className="font-bold tabular-nums text-foreground">{Number(p.value ?? 0).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Stat card with sparkline
interface StatCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon: React.ReactNode;
  iconBg: string;
  sparkData?: number[];
  sparkColor?: string;
  onClick?: () => void;
  highlight?: boolean;
}

function NeonStatCard({ title, value, trend, trendLabel, icon, iconBg, sparkData, sparkColor, onClick, highlight }: StatCardProps) {
  const isPositive = (trend ?? 0) >= 0;
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl p-4 flex flex-col gap-2 transition-all duration-300 relative overflow-hidden',
        onClick && 'cursor-pointer hover:scale-[1.02]',
        highlight
          ? 'bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/40 shadow-neon'
          : 'card-elevated hover:border-primary/20'
      )}
    >
      {/* bg glow for highlight */}
      {highlight && (
        <div className="absolute inset-0 bg-gradient-radial opacity-60 pointer-events-none" />
      )}
      <div className="flex items-start justify-between relative">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
          {icon}
        </div>
        {sparkData && (
          <div className="w-20 h-8">
            <Sparkline data={sparkData} color={sparkColor ?? CHART_COLORS.primary} height={32} />
          </div>
        )}
      </div>
      <div className="relative">
        <p className="text-muted-foreground text-xs font-medium">{title}</p>
        <p className={cn('text-2xl font-bold mt-0.5 tabular-nums', highlight ? 'text-primary' : 'text-foreground')}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
      {trend !== undefined && (
        <div className={cn('flex items-center gap-1 text-xs font-medium', isPositive ? 'text-success' : 'text-destructive')}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{isPositive ? '+' : ''}{trend}%</span>
          {trendLabel && <span className="text-muted-foreground font-normal">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}

// Operation type mini badge
function OpBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    receipt: { label: 'Receipt', color: 'text-success', bg: 'bg-success/15' },
    delivery: { label: 'Delivery', color: 'text-destructive', bg: 'bg-destructive/15' },
    transfer_in: { label: 'Transfer In', color: 'text-primary', bg: 'bg-primary/15' },
    transfer_out: { label: 'Transfer Out', color: 'text-warning', bg: 'bg-warning/15' },
    adjustment: { label: 'Adjustment', color: 'text-violet', bg: 'bg-violet/15' },
    initial: { label: 'Initial', color: 'text-muted-foreground', bg: 'bg-muted/40' },
  };
  const info = map[type] ?? { label: type, color: 'text-muted-foreground', bg: 'bg-muted/30' };
  return (
    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', info.color, info.bg)}>
      {info.label}
    </span>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const { refreshStock } = useInventoryStore();

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    lowStockCount: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    pendingTransfers: 0,
  });
  const [movementData, setMovementData] = useState<{ name: string; receipts: number; deliveries: number; net: number }[]>([]);
  const [warehouseData, setWarehouseData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; stock: number; pct: number }[]>([]);
  const [recentMoves, setRecentMoves] = useState<RecentMove[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; count: number }[]>([]);
  const [operationStats, setOperationStats] = useState<{ name: string; value: number; color: string }[]>([]);

  type RecentMove = StockLedgerDTO & { productName: string; warehouseName: string };

  useEffect(() => {
    const load = async () => {
      await refreshStock();
      const [products, warehouses, categories, receipts, deliveries, transfers, ledger] = await Promise.all([
        repo.listProducts(),
        repo.listWarehouses(),
        repo.listCategories(),
        repo.listOperations('receipt'),
        repo.listOperations('delivery'),
        repo.listOperations('transfer'),
        api.stock.ledger({ limit: 1000 }),
      ]);

      // Build stock map
      const stockMap: Record<string, Record<string, number>> = {};
      ledger.forEach((e: StockLedgerDTO) => {
        if (!stockMap[e.productId]) stockMap[e.productId] = {};
        if (!stockMap[e.productId][e.warehouseId]) stockMap[e.productId][e.warehouseId] = 0;
        stockMap[e.productId][e.warehouseId] += e.quantityChange;
      });
      const getProductStock = (pid: string) => Object.values(stockMap[pid] ?? {}).reduce((s, v) => s + v, 0);

      let totalStock = 0;
      let lowStockCount = 0;
      products.forEach(p => {
        const s = getProductStock(p._id);
        totalStock += s;
        const reorderLevel = p.reorderLevel ?? 0;
        if (s <= reorderLevel) lowStockCount++;
      });

      setStats({
        totalProducts: products.length,
        totalStock,
        lowStockCount,
        pendingReceipts: receipts.filter(r => r.status !== 'done' && r.status !== 'cancelled').length,
        pendingDeliveries: deliveries.filter(d => d.status !== 'done' && d.status !== 'cancelled').length,
        pendingTransfers: transfers.filter(t => t.status !== 'done' && t.status !== 'cancelled').length,
      });

      // Movement chart: last 7 days
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d;
      });
      const mv = days.map(day => {
        const dayLedger = ledger.filter(e => {
          const ed = new Date(e.createdAt);
          return ed.toDateString() === day.toDateString();
        });
        const rec = dayLedger.filter(e => e.operationType === 'receipt').reduce((s, e) => s + e.quantityChange, 0);
        const del = Math.abs(dayLedger.filter(e => e.operationType === 'delivery').reduce((s, e) => s + e.quantityChange, 0));
        return {
          name: day.toLocaleDateString('en', { weekday: 'short' }),
          receipts: rec,
          deliveries: del,
          net: rec - del,
        };
      });
      setMovementData(mv);

      // Warehouse distribution
      const wColors = [CHART_COLORS.primary, CHART_COLORS.violet, CHART_COLORS.warning, CHART_COLORS.success];
      const wh = warehouses.map((w, i) => {
        const stock = ledger.filter(e => e.warehouseId === w._id)
          .reduce((s, e) => s + e.quantityChange, 0);
        return { name: w.name.replace(' Warehouse', ''), value: Math.max(0, stock), color: wColors[i % wColors.length] };
      }).filter(w => w.value > 0);
      setWarehouseData(wh);

      // Top products with percentage
      const allStocks = products.map(p => ({ name: p.name, stock: getProductStock(p._id) }));
      const maxStock = Math.max(...allStocks.map(p => p.stock), 1);
      const top = allStocks
        .sort((a, b) => b.stock - a.stock)
        .slice(0, 5)
        .map(p => ({ ...p, pct: Math.round((p.stock / maxStock) * 100) }));
      setTopProducts(top);

      // Recent moves (last 8 entries)
      const productMap = Object.fromEntries(products.map(p => [p._id, p.name]));
      const warehouseMap = Object.fromEntries(warehouses.map(w => [w._id, w.name.replace(' Warehouse', '')]));
      const recent = ledger.slice(0, 8).map(e => ({
        ...e,
        productName: productMap[e.productId] ?? `#${e.productId}`,
        warehouseName: warehouseMap[e.warehouseId] ?? `#${e.warehouseId}`,
      }));
      setRecentMoves(recent);

      // Category distribution
      const catCount = categories.map(c => ({
        name: c.name,
        count: products.filter(p => p.category === c._id).length,
      })).filter(c => c.count > 0);
      setCategoryData(catCount);

      // Operations breakdown
      setOperationStats([
        { name: 'Receipts Done', value: receipts.filter(r => r.status === 'done').length, color: CHART_COLORS.success },
        { name: 'Deliveries Done', value: deliveries.filter(d => d.status === 'done').length, color: CHART_COLORS.destructive },
        { name: 'Transfers Done', value: transfers.filter(t => t.status === 'done').length, color: CHART_COLORS.primary },
        { name: 'Pending', value: receipts.filter(r => r.status !== 'done' && r.status !== 'cancelled').length + deliveries.filter(d => d.status !== 'done' && d.status !== 'cancelled').length + transfers.filter(t => t.status !== 'done' && t.status !== 'cancelled').length, color: CHART_COLORS.warning },
      ]);
    };
    void load();
  }, [refreshStock]);

  // Spark lines must be real data (no placeholders)
  const sparkTotalStock = movementData.map(d => d.net);
  const sparkLowStock = movementData.map(d => d.deliveries);
  const totalWhStock = warehouseData.reduce((s, w) => s + w.value, 0);

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Hello, <span className="text-primary font-semibold">{user?.fullName?.split(' ')[0]}</span> — here's your inventory overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-xl px-3 py-1.5 hover:border-primary/30 transition-all">
            <Activity className="w-3.5 h-3.5" />
            Live
            <span className="neon-dot ml-1" />
          </button>
        </div>
      </div>

      {/* STATS ROW — 4 cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <NeonStatCard
          title="Total Products"
          value={stats.totalProducts}
          trend={0}
          trendLabel="this month"
          icon={<Package className="w-4 h-4 text-primary" />}
          iconBg="bg-primary/15"
          // derive a simple trend spark from the last 7 days movement (real ledger-based)
          sparkData={movementData.length ? movementData.map(d => d.receipts + d.deliveries) : undefined}
          sparkColor={CHART_COLORS.primary}
          onClick={() => navigate('/products')}
          highlight
        />
        <NeonStatCard
          title="Total Stock Units"
          value={stats.totalStock}
          trend={8}
          trendLabel="vs last week"
          icon={<Boxes className="w-4 h-4 text-violet" />}
          iconBg="bg-violet/15"
          sparkData={sparkTotalStock.length ? sparkTotalStock : undefined}
          sparkColor={CHART_COLORS.violet}
        />
        <NeonStatCard
          title="Low Stock Alerts"
          value={stats.lowStockCount}
          trend={stats.lowStockCount > 0 ? -12 : 0}
          trendLabel="items"
          icon={<AlertTriangle className="w-4 h-4 text-warning" />}
          iconBg="bg-warning/15"
          sparkData={sparkLowStock.length ? sparkLowStock : undefined}
          sparkColor={CHART_COLORS.warning}
          onClick={() => navigate('/products')}
        />
        <NeonStatCard
          title="Pending Operations"
          value={stats.pendingReceipts + stats.pendingDeliveries + stats.pendingTransfers}
          trend={-5}
          trendLabel="vs yesterday"
          icon={<Clock className="w-4 h-4 text-destructive" />}
          iconBg="bg-destructive/15"
          sparkData={movementData.length ? movementData.map(d => Math.max(0, d.deliveries)) : undefined}
          sparkColor={CHART_COLORS.destructive}
        />
      </div>

      {/* SECOND ROW — movement chart + donut + operations */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">

        {/* Inventory Movement (7 days) — 6 cols */}
        <div className="xl:col-span-6 card-elevated rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-foreground font-semibold text-sm">Inventory Movement</h3>
              <p className="text-muted-foreground text-xs">Receipts vs Deliveries — Last 7 days</p>
            </div>
            <button className="text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={movementData} barSize={14} barGap={3}>
              <defs>
                <linearGradient id="barReceipt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={1} />
                  <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0.5} />
                </linearGradient>
                <linearGradient id="barDelivery" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.destructive} stopOpacity={1} />
                  <stop offset="100%" stopColor={CHART_COLORS.destructive} stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 17%)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'hsl(215 14% 45%)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(215 14% 45%)', fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<DarkTooltip />} cursor={{ fill: 'hsl(220 16% 17%)' }} />
              <Bar dataKey="receipts" fill="url(#barReceipt)" radius={[6, 6, 0, 0]} name="Receipts" isAnimationActive animationDuration={700} />
              <Bar dataKey="deliveries" fill="url(#barDelivery)" radius={[6, 6, 0, 0]} name="Deliveries" isAnimationActive animationDuration={700} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm" style={{ background: CHART_COLORS.primary }} />
              <span className="text-xs text-muted-foreground">Receipts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm" style={{ background: CHART_COLORS.destructive }} />
              <span className="text-xs text-muted-foreground">Deliveries</span>
            </div>
          </div>
        </div>

        {/* Warehouse Donut — 3 cols */}
        <div className="xl:col-span-3 card-elevated rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-foreground font-semibold text-sm">Warehouse Stock</h3>
              <p className="text-muted-foreground text-xs">Distribution</p>
            </div>
            <Warehouse className="w-4 h-4 text-muted-foreground" />
          </div>
          {warehouseData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie
                    data={warehouseData}
                    cx="50%" cy="50%"
                    innerRadius={38} outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    isAnimationActive
                    animationDuration={700}
                    onClick={(d: { payload?: { name?: string } }) => {
                      // navigate to warehouses; user can drill down from there
                      if (d?.payload?.name) navigate('/warehouses');
                    }}
                  >
                    {warehouseData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<DarkTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-1">
                {warehouseData.map((w, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: w.color }} />
                      <span className="text-muted-foreground">{w.name}</span>
                    </div>
                    <span className="text-foreground font-semibold tabular-nums">
                      {totalWhStock > 0 ? Math.round((w.value / totalWhStock) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No data</div>
          )}
        </div>

        {/* Operations Summary — 3 cols */}
        <div className="xl:col-span-3 card-elevated rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-foreground font-semibold text-sm">Operations</h3>
              <p className="text-muted-foreground text-xs">All time summary</p>
            </div>
            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {operationStats.map((op, i) => {
              const maxOp = Math.max(...operationStats.map(o => o.value), 1);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{op.name}</span>
                    <span className="text-foreground font-bold tabular-nums">{op.value}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.round((op.value / maxOp) * 100)}%`, background: op.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-border grid grid-cols-2 gap-2">
            {[
              { label: 'Receipts', val: stats.pendingReceipts, color: 'text-success', icon: <ArrowDownToLine className="w-3 h-3" />, to: '/operations/receipts' },
              { label: 'Deliveries', val: stats.pendingDeliveries, color: 'text-destructive', icon: <ArrowUpFromLine className="w-3 h-3" />, to: '/operations/deliveries' },
              { label: 'Transfers', val: stats.pendingTransfers, color: 'text-primary', icon: <ArrowLeftRight className="w-3 h-3" />, to: '/operations/transfers' },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => navigate(item.to)}
                className="flex items-center gap-1.5 text-xs hover:opacity-80 transition-opacity"
              >
                <span className={item.color}>{item.icon}</span>
                <span className="text-muted-foreground">{item.label}</span>
                <span className={cn('font-bold ml-auto', item.val > 0 ? item.color : 'text-muted-foreground')}>{item.val}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* THIRD ROW — top products + recent moves */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">

        {/* Top Products by stock */}
        <div className="xl:col-span-5 card-elevated rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-foreground font-semibold text-sm">Top Products</h3>
              <p className="text-muted-foreground text-xs">By stock quantity</p>
            </div>
            <button onClick={() => navigate('/products')} className="text-xs text-primary hover:underline">View all</button>
          </div>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={i} className="group">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-md bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="text-foreground font-medium truncate max-w-[140px]">{p.name}</span>
                  </div>
                  <span className="text-foreground font-bold tabular-nums">{p.stock.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${p.pct}%`,
                      background: i === 0 ? CHART_COLORS.primary
                        : i === 1 ? CHART_COLORS.violet
                        : i === 2 ? CHART_COLORS.success
                        : i === 3 ? CHART_COLORS.warning
                        : CHART_COLORS.muted
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Category mini chips */}
          {categoryData.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Categories</p>
              <div className="flex flex-wrap gap-1.5">
                {categoryData.map((c, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                    {c.name} <span className="text-foreground font-semibold">{c.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Stock Movements */}
        <div className="xl:col-span-7 card-elevated rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-foreground font-semibold text-sm">Recent Movements</h3>
              <p className="text-muted-foreground text-xs">Latest stock ledger entries</p>
            </div>
            <button onClick={() => navigate('/history')} className="text-xs text-primary hover:underline">View all</button>
          </div>
          <div className="space-y-2">
            {recentMoves.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No movements yet</p>
            ) : recentMoves.map((m, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/30 transition-colors">
                <div className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold',
                  m.quantityChange > 0 ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
                )}>
                  {m.quantityChange > 0 ? '+' : ''}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{m.productName}</p>
                  <p className="text-[10px] text-muted-foreground">{m.warehouseName}</p>
                </div>
                <OpBadge type={m.operationType} />
                <div className="text-right shrink-0">
                  <p className={cn('text-sm font-bold tabular-nums', m.quantityChange > 0 ? 'text-success' : 'text-destructive')}>
                    {m.quantityChange > 0 ? '+' : ''}{m.quantityChange}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(m.createdAt).toLocaleDateString('en', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
