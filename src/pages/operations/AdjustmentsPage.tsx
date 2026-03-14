import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useInventoryStore } from '@/store/inventoryStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { OperationDTO, ProductDTO, WarehouseDTO } from '@/lib/api';
import { api } from '@/lib/api';
import { listOperations, listProducts, listWarehouses } from '@/lib/repo';

type AdjustmentRow = {
  _id: string;
  referenceNumber: string;
  status: 'draft' | 'ready' | 'done' | 'cancelled';
  warehouseId: string;
  productId: string;
  quantityChange: number;
  reason: string;
  createdAt: string;
};

function toAdjustmentRows(ops: OperationDTO[]): AdjustmentRow[] {
  return ops
    .filter((o) => o.type === 'adjustment')
    .flatMap((o) =>
      (o.items ?? []).map((it) => ({
        _id: o._id,
        referenceNumber: o.referenceNumber,
        status: o.status,
        warehouseId: String(o.warehouseId ?? ''),
        productId: String(it.productId),
        quantityChange: Number(it.quantity ?? 0),
        reason: o.notes ?? '',
        createdAt: o.createdAt ?? new Date().toISOString(),
      }))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export default function AdjustmentsPage() {
  const user = useAuthStore((s) => s.user);
  const { refreshStock } = useInventoryStore();

  const [adjustments, setAdjustments] = useState<AdjustmentRow[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseDTO[]>([]);
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ productId: '', warehouseId: '', countedQty: '', reason: '' });
  const [systemQty, setSystemQty] = useState(0);

  const load = async () => {
    await refreshStock();

    const [w, p, ops] = await Promise.all([listWarehouses(), listProducts(), listOperations('adjustment')]);
    setWarehouses(w);
    setProducts(p);
    setAdjustments(toAdjustmentRows(ops));
  };
  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (form.productId && form.warehouseId) {
      api.stock.balance(form.productId, form.warehouseId).then((b) => setSystemQty(Number(b.quantity ?? 0)));
    }
  }, [form.productId, form.warehouseId]);

  const countedQtyNum = Number(form.countedQty);
  const countedValid = Number.isFinite(countedQtyNum) && countedQtyNum >= 0;
  const difference = countedValid ? countedQtyNum - systemQty : 0;

  const getProductName = (id: string) => products.find((p) => String(p._id) === String(id))?.name ?? '-';
  const getWHName = (id: string) => warehouses.find((w) => String(w._id) === String(id))?.name ?? '-';

  const handleSubmit = async () => {
    if (!form.productId || !form.warehouseId) return;
    if (!countedValid) return;

    setLoading(true);
    try {
      // Re-read system qty right before writing
      const latest = await api.stock.balance(form.productId, form.warehouseId);
      const latestSystemQty = Number(latest.quantity ?? 0);
      const latestDiff = countedQtyNum - latestSystemQty;
      if (latestDiff === 0) {
        setOpen(false);
        return;
      }

      const ref = `ADJ-${Date.now().toString().slice(-6)}`;

      const op = await api.operations.create({
        type: 'adjustment',
        referenceNumber: ref,
        status: 'ready',
        warehouseId: form.warehouseId,
        date: new Date().toISOString(),
        notes: form.reason,
        createdBy: user?.id,
        items: [{ productId: form.productId, quantity: latestDiff }],
      });

      await api.operations.post(op._id);

      await refreshStock();
      setOpen(false);
      setForm({ productId: '', warehouseId: '', countedQty: '', reason: '' });
      await load();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Inventory Adjustments" subtitle="Correct stock discrepancies">
        <Button onClick={() => setOpen(true)} size="sm" className="gradient-primary text-primary-foreground gap-1.5">
          <Plus className="w-4 h-4" /> New Adjustment
        </Button>
      </PageHeader>

      <div className="card-elevated rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Reference', 'Product', 'Warehouse', 'Quantity Change', 'Reason', 'Date', 'Status'].map((h) => (
                  <th key={h} className="text-left text-muted-foreground font-medium px-4 py-3 text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adjustments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground py-12">
                    No adjustments found
                  </td>
                </tr>
              ) : (
                adjustments.map((a) => (
                  <tr key={a._id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-primary">{a.referenceNumber}</td>
                    <td className="px-4 py-3 text-foreground text-xs">{getProductName(a.productId)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{getWHName(a.warehouseId)}</td>
                    <td
                      className={cn(
                        'px-4 py-3 font-semibold',
                        a.quantityChange > 0 ? 'text-success' : a.quantityChange < 0 ? 'text-destructive' : 'text-muted-foreground'
                      )}
                    >
                      {a.quantityChange > 0 ? '+' : ''}
                      {a.quantityChange}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-32 truncate">{a.reason}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{format(new Date(a.createdAt), 'dd MMM yyyy')}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">New Adjustment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground text-sm mb-1.5 block">Product</Label>
                <Select onValueChange={(v) => setForm((f) => ({ ...f, productId: v }))}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {products.map((p) => (
                      <SelectItem key={String(p._id)} value={String(p._id)} className="text-popover-foreground">
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-foreground text-sm mb-1.5 block">Warehouse</Label>
                <Select onValueChange={(v) => setForm((f) => ({ ...f, warehouseId: v }))}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {warehouses.map((w) => (
                      <SelectItem key={String(w._id)} value={String(w._id)} className="text-popover-foreground">
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.productId && form.warehouseId && (
              <div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-muted/30 border border-border">
                <div className="text-center">
                  <p className="text-muted-foreground text-xs">System Qty</p>
                  <p className="text-foreground font-bold text-lg mt-1">{systemQty}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground text-xs">Counted Qty</p>
                  <Input
                    type="number"
                    min={0}
                    value={form.countedQty}
                    onChange={(e) => setForm((f) => ({ ...f, countedQty: e.target.value }))}
                    className="bg-input border-border text-foreground text-center mt-1 h-8"
                  />
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground text-xs">Difference</p>
                  <p
                    className={cn(
                      'font-bold text-lg mt-1',
                      difference > 0 ? 'text-success' : difference < 0 ? 'text-destructive' : 'text-muted-foreground'
                    )}
                  >
                    {difference > 0 ? '+' : ''}
                    {difference}
                  </p>
                </div>
              </div>
            )}

            <div>
              <Label className="text-foreground text-sm mb-1.5 block">Reason</Label>
              <Textarea
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                rows={2}
                className="bg-input border-border text-foreground resize-none"
                placeholder="e.g. Physical count discrepancy..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSubmit}
                disabled={loading || !form.productId || !form.warehouseId}
                className="gradient-primary text-primary-foreground"
              >
                Apply Adjustment
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-border text-foreground">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
