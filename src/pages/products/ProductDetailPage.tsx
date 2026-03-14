import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProduct, listWarehouses, listCategories, listUnits, listStockLedger } from '@/lib/repo';
import type { ProductDTO, CategoryDTO, UnitDTO, WarehouseDTO, StockLedgerDTO } from '@/lib/api';
import { useInventoryStore } from '@/store/inventoryStore';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil, BarChart3, AlertTriangle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type LedgerRow = StockLedgerDTO;

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { refreshStock, getStock } = useInventoryStore();

  const [product, setProduct] = useState<ProductDTO | null>(null);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [units, setUnits] = useState<UnitDTO[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseDTO[]>([]);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      await refreshStock();

      try {
        const [p, c, u, w, l] = await Promise.all([
          getProduct(id),
          listCategories(),
          listUnits(),
          listWarehouses(),
          listStockLedger({ productId: id, limit: 200 }),
        ]);
        setProduct(p);
        setCategories(c);
        setUnits(u);
        setWarehouses(w);
        setLedger(l as LedgerRow[]);
      } catch {
        navigate('/products');
        return;
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id, navigate, refreshStock]);

  const stockByWH = useMemo(() => {
    if (!product) return [] as Array<{ name: string; stock: number }>;
    return warehouses
      .map(w => ({ name: w.name, stock: getStock(product._id, w._id) }))
      .filter(w => w.stock !== 0);
  }, [warehouses, product, getStock]);

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  if (!product) return null;

  const unit = units.find(u => u._id === product.unit);
  const category = categories.find(c => c._id === product.category);

  const totalStock = getStock(product._id);
  const isLow = totalStock <= (product.reorderLevel ?? 0);

  const opTypeLabel: Record<string, string> = {
    initial: 'Initial', receipt: 'Receipt', delivery: 'Delivery',
    transfer_in: 'Transfer In', transfer_out: 'Transfer Out',
    adjustment: 'Adjustment', transfer: 'Transfer',
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      <PageHeader title={product.name} subtitle={`SKU: ${product.sku}`}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/products')} className="text-muted-foreground gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button size="sm" onClick={() => navigate(`/products/${product._id}/edit`)} className="gradient-primary text-primary-foreground gap-1.5">
          <Pencil className="w-3.5 h-3.5" /> Edit
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 card-elevated rounded-xl p-5 space-y-4">
          <h3 className="text-foreground font-semibold text-sm border-b border-border pb-2">Product Details</h3>
          <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
            {[
              ['Name', product.name],
              ['SKU', product.sku],
              ['Category', category?.name ?? '-'],
              ['Unit', `${unit?.name ?? '-'} (${unit?.symbol ?? ''})`],
              ['Reorder Level', String(product.reorderLevel ?? 0)],
              ['Status', null],
              ['Created', product.createdAt ? format(new Date(product.createdAt), 'dd MMM yyyy') : '-'],
            ].map(([label, value]) => (
              <div key={label as string}>
                <p className="text-muted-foreground text-xs">{label}</p>
                {value === null
                  ? <StatusBadge status={product.status ?? 'active'} className="mt-0.5" />
                  : <p className="text-foreground mt-0.5 font-medium">{value}</p>
                }
              </div>
            ))}
          </div>
          {product.description && (
            <div className="pt-2 border-t border-border">
              <p className="text-muted-foreground text-xs mb-1">Description</p>
              <p className="text-foreground text-sm">{product.description}</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className={cn('card-elevated rounded-xl p-5 text-center', isLow && 'border border-warning/30')}>
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3', isLow ? 'bg-warning/15' : 'bg-primary/15')}>
              {isLow ? <AlertTriangle className="w-6 h-6 text-warning" /> : <BarChart3 className="w-6 h-6 text-primary" />}
            </div>
            <p className="text-muted-foreground text-xs mb-1">Total Stock</p>
            <p className={cn('text-4xl font-bold', isLow ? 'text-warning' : 'text-foreground')}>{totalStock}</p>
            <p className="text-muted-foreground text-xs mt-1">{unit?.symbol ?? 'units'}</p>
            {isLow && <p className="text-warning text-xs mt-2 font-medium">⚠ Below reorder level ({product.reorderLevel ?? 0})</p>}
          </div>

          {stockByWH.length > 1 && (
            <div className="card-elevated rounded-xl p-4">
              <p className="text-muted-foreground text-xs font-medium mb-3 uppercase tracking-wide">By Warehouse</p>
              {stockByWH.map(w => (
                <div key={w.name} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground text-xs">{w.name.replace(' Warehouse', '')}</span>
                  <span className={cn('font-semibold text-sm', w.stock < 0 ? 'text-destructive' : 'text-foreground')}>{w.stock}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card-elevated rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-foreground font-semibold text-sm">Movement History</h3>
          <span className="ml-auto text-muted-foreground text-xs">{ledger.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              {['Date', 'Operation', 'Qty', 'Warehouse', 'Reference'].map(h => (
                <th key={h} className="text-left text-muted-foreground font-medium px-4 py-2.5 text-xs uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {ledger.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-muted-foreground py-8">No movement history</td></tr>
              ) : ledger.slice(0, 20).map(e => (
                <tr key={e._id ?? `${e.createdAt}-${e.referenceNumber}-${e.warehouseId}`} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">
                    {e.createdAt ? format(new Date(e.createdAt), 'dd MMM yyyy HH:mm') : '-'}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-medium text-foreground">{opTypeLabel[e.operationType] ?? e.operationType}</td>
                  <td className={cn('px-4 py-2.5 font-semibold', e.quantityChange > 0 ? 'text-success' : 'text-destructive')}>
                    {e.quantityChange > 0 ? '+' : ''}{e.quantityChange}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">
                    {warehouses.find(w => w._id === e.warehouseId)?.name ?? '-'}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{e.referenceNumber ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
