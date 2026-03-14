import { useEffect, useState } from 'react';
import { listProducts, listWarehouses, listCategories } from '@/lib/repo';
import type { ProductDTO, WarehouseDTO, CategoryDTO } from '@/lib/api';
import { useInventoryStore } from '@/store/inventoryStore';
import PageHeader from '@/components/shared/PageHeader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { exportProWorkbook } from '@/lib/excelExport';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

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

export default function ReportsPage() {
  const { refreshStock, getStock } = useInventoryStore();
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);

  useEffect(() => {
    const load = async () => {
      await refreshStock();
      const [p, w, c] = await Promise.all([listProducts(), listWarehouses(), listCategories()]);
      setProducts(p);
      setWarehouses(w);
      setCategories(c);
    };
    void load();
  }, [refreshStock]);

  const productStocks = products.map(p => ({
    ...p,
    stock: getStock(p._id),
    catName: categories.find(c => c._id === p.category)?.name ?? '-',
    whName: '-',
  }));

  const lowStock = productStocks.filter(p => p.stock <= (p.reorderLevel ?? 0) && p.stock > 0);
  const outOfStock = productStocks.filter(p => p.stock === 0);

  const warehouseData = warehouses.map(w => {
    const stock = productStocks.reduce((s, p) => s + getStock(p._id, w._id), 0);
    return { name: w.name.replace(' Warehouse', ''), value: stock };
  });

  const topProducts = [...productStocks].sort((a, b) => b.stock - a.stock).slice(0, 8);

  const exportExcel = async () => {
    const totalStock = productStocks.reduce((s, p) => s + p.stock, 0);
    await exportProWorkbook({
      fileName: `stock-report_${new Date().toISOString().slice(0, 10)}.xlsx`,
      title: 'Inventory Stock Report',
      subtitle: 'Product-level stock summary (MongoDB Atlas live data)',
      sheetName: 'Stock Report',
      summary: [
        { label: 'Total Products', value: products.length },
        { label: 'Total Stock', value: totalStock },
        { label: 'Low Stock', value: lowStock.length },
      ],
      columns: [
        { header: 'Product', key: 'name', width: 34 },
        { header: 'SKU', key: 'sku', width: 18 },
        { header: 'Category', key: 'catName', width: 22 },
        { header: 'Stock', key: 'stock', width: 12, numFmt: '#,##0', align: 'right' },
        { header: 'Reorder Level', key: 'reorderLevel', width: 14, numFmt: '#,##0', align: 'right' },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Last Updated', key: 'updatedAt', width: 18 },
      ],
      rows: productStocks.map(p => ({
        name: p.name,
        sku: p.sku,
        catName: p.catName,
        stock: p.stock,
        reorderLevel: p.reorderLevel ?? 0,
        status: p.status ?? 'active',
        updatedAt: p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '',
      })),
    });
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Reports" subtitle="Inventory analytics and summaries">
        <Button onClick={() => void exportExcel()} variant="outline" size="sm" className="border-border text-foreground gap-1.5">
          <Download className="w-4 h-4" /> Export Excel
        </Button>
      </PageHeader>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Products', value: products.length, color: 'text-primary' },
          { label: 'Total Stock', value: productStocks.reduce((s, p) => s + p.stock, 0).toLocaleString(), color: 'text-success' },
          { label: 'Low Stock', value: lowStock.length, color: 'text-warning' },
          { label: 'Out of Stock', value: outOfStock.length, color: 'text-destructive' },
        ].map(s => (
          <div key={s.label} className="card-elevated rounded-xl p-4">
            <p className="text-muted-foreground text-xs">{s.label}</p>
            <p className={cn('text-2xl font-bold mt-1', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card-elevated rounded-xl p-4">
          <h3 className="text-foreground font-semibold text-sm mb-4">Top Products by Stock</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topProducts} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickFormatter={v => v.length > 12 ? v.slice(0, 12) + '…' : v} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
              <Bar dataKey="stock" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Stock" isAnimationActive animationDuration={700} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card-elevated rounded-xl p-4">
          <h3 className="text-foreground font-semibold text-sm mb-4">Stock by Warehouse</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={warehouseData}
                cx="50%" cy="50%"
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                isAnimationActive
                animationDuration={700}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {warehouseData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<DarkTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="card-elevated rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <h3 className="text-foreground font-semibold text-sm">Low Stock Alert</h3>
            <span className="ml-auto bg-warning/15 text-warning text-xs px-2 py-0.5 rounded-md">{lowStock.length} items</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                {['Product', 'SKU', 'Current Stock', 'Reorder Level', 'Warehouse'].map(h => (
                  <th key={h} className="text-left text-muted-foreground font-medium px-4 py-2.5 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {lowStock.map(p => (
                  <tr key={p._id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="px-4 py-2.5 text-foreground text-xs font-medium">{p.name}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{p.sku}</td>
                    <td className="px-4 py-2.5 text-warning font-semibold">{p.stock}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{p.reorderLevel}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{p.whName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Full Stock Summary */}
      <div className="card-elevated rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-foreground font-semibold text-sm">Stock Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              {['Product', 'SKU', 'Category', 'Stock', 'Reorder', 'Warehouse', 'Status'].map(h => (
                <th key={h} className="text-left text-muted-foreground font-medium px-4 py-2.5 text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {productStocks.map(p => (
                <tr key={p._id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-2.5 text-foreground text-xs font-medium">{p.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{p.sku}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{p.catName}</td>
                  <td className={cn('px-4 py-2.5 font-semibold', p.stock <= (p.reorderLevel ?? 0) ? 'text-warning' : 'text-foreground')}>{p.stock}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{p.reorderLevel}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{p.whName}</td>
                  <td className="px-4 py-2.5"><span className={cn('text-xs px-2 py-0.5 rounded-md', p.stock === 0 ? 'bg-destructive/15 text-destructive' : p.stock <= (p.reorderLevel ?? 0) ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success')}>{p.stock === 0 ? 'Out of Stock' : p.stock <= (p.reorderLevel ?? 0) ? 'Low Stock' : 'In Stock'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
