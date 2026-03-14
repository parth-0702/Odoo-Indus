import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { listOperations, listWarehouses, listProducts, createAndPostOperation } from '@/lib/repo';
import type { OperationDTO, WarehouseDTO, ProductDTO } from '@/lib/api';
import { api } from '@/lib/api';
import { useInventoryStore } from '@/store/inventoryStore';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Plus, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface ReceiptItemRow { productId: string; quantity: number; }
const EMPTY_FORM = { supplier: '', warehouseId: '', receiptDate: new Date().toISOString().slice(0, 10), notes: '' };

export default function ReceiptsPage() {
  const user = useAuthStore(s => s.user);
  const { refreshStock } = useInventoryStore();
  const [receipts, setReceipts] = useState<OperationDTO[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseDTO[]>([]);
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [items, setItems] = useState<ReceiptItemRow[]>([{ productId: '', quantity: 1 }]);

  const load = async () => {
    const [r, w, p] = await Promise.all([
      listOperations('receipt'),
      listWarehouses(),
      listProducts(),
    ]);
    setReceipts(r);
    setWarehouses(w);
    setProducts(p);
  };
  useEffect(() => { void load(); }, []);

  const openDialog = () => {
    setForm({ ...EMPTY_FORM });
    setItems([{ productId: '', quantity: 1 }]);
    setError('');
    setOpen(true);
  };

  const normalizeItems = (rows: ReceiptItemRow[]) => {
    const valid = rows
      .filter(r => r.productId)
      .map(r => ({ productId: r.productId, quantity: Number(r.quantity) }))
      .filter(r => Number.isFinite(r.quantity) && r.quantity > 0);

    const aggregated = Object.values(valid.reduce((acc, it) => {
      acc[it.productId] = acc[it.productId]
        ? { ...it, quantity: acc[it.productId].quantity + it.quantity }
        : { ...it };
      return acc;
    }, {} as Record<string, { productId: string; quantity: number }>));

    return aggregated;
  };

  const handleSubmit = async (asDone = false) => {
    setError('');
    if (!form.supplier.trim()) { setError('Supplier name is required'); return; }
    if (!form.warehouseId) { setError('Please select a warehouse'); return; }

    const normalized = normalizeItems(items);
    if (normalized.length === 0) { setError('Add at least one product with a valid quantity'); return; }

    setLoading(true);
    try {
      const ref = `RCP-${Date.now().toString().slice(-6)}`;
      const op = {
        type: 'receipt' as const,
        referenceNumber: ref,
        status: (asDone ? 'done' : 'ready') as 'done' | 'ready',
        warehouseId: form.warehouseId,
        supplier: form.supplier,
        date: form.receiptDate,
        notes: form.notes,
        createdBy: user?.id ?? undefined,
        items: normalized,
      };

      if (asDone) {
        await createAndPostOperation(op);
        await refreshStock();
      } else {
        await api.operations.create(op);
      }

      setOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (receipt: OperationDTO) => {
    if (receipt.status === 'done' || receipt.status === 'cancelled') return;
    setLoading(true);
    try {
      await api.operations.post(receipt._id);
      await refreshStock();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const cancelReceipt = async (receipt: OperationDTO) => {
    if (receipt.status === 'done' || receipt.status === 'cancelled') return;
    setLoading(true);
    try {
      await api.operations.cancel(receipt._id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const getWarehouseName = (id?: string) => warehouses.find(w => w._id === id)?.name ?? '-';
  const getProductName = (id: string) => products.find(p => p._id === id)?.name ?? `Product ${id.slice(0, 6)}`;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Receipts" subtitle="Incoming stock from suppliers">
        <Button onClick={openDialog} size="sm" className="gradient-primary text-primary-foreground gap-1.5">
          <Plus className="w-4 h-4" /> New Receipt
        </Button>
      </PageHeader>

      <p className="text-sm text-muted-foreground -mt-2">
        Receipts increase stock. Create a receipt when items arrive from a supplier, then validate it to post the movement to the ledger.
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { status: 'draft', label: 'Draft', color: 'text-muted-foreground' },
          { status: 'ready', label: 'Ready', color: 'text-warning' },
          { status: 'done', label: 'Done', color: 'text-success' },
          { status: 'cancelled', label: 'Cancelled', color: 'text-destructive' },
        ].map(s => (
          <div key={s.status} className="card-elevated rounded-xl p-3">
            <p className="text-muted-foreground text-xs">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{receipts.filter(r => r.status === s.status).length}</p>
          </div>
        ))}
      </div>

      <div className="card-elevated rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Reference', 'Supplier', 'Warehouse', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-muted-foreground font-medium px-4 py-3 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {receipts.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-muted-foreground py-12">No receipts found. Create your first receipt!</td></tr>
              ) : receipts.map(r => (
                <tr key={r._id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-primary font-semibold">{r.referenceNumber}</td>
                  <td className="px-4 py-3 text-foreground">{r.supplier}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{getWarehouseName(r.warehouseId)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{format(new Date(r.date), 'dd MMM yyyy')}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {(r.status === 'ready' || r.status === 'draft') && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleValidate(r)} className="text-success hover:bg-success/10 h-7 text-xs gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Validate
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => cancelReceipt(r)} className="text-destructive hover:bg-destructive/10 h-7 text-xs">
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={v => { if (!v) setOpen(false); }}>
        <DialogContent className="bg-card border-border text-foreground max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-foreground">New Receipt</DialogTitle></DialogHeader>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground text-sm mb-1.5 block">Supplier *</Label>
                <Input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} placeholder="e.g. Tech Supplies Co." className="bg-input border-border text-foreground" />
              </div>
              <div>
                <Label className="text-foreground text-sm mb-1.5 block">Warehouse *</Label>
                <Select value={form.warehouseId} onValueChange={v => setForm(f => ({ ...f, warehouseId: v }))}>
                  <SelectTrigger className="bg-input border-border text-foreground"><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {warehouses.map(w => <SelectItem key={w._id} value={String(w._id)} className="text-popover-foreground">{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-foreground text-sm mb-1.5 block">Receipt Date</Label>
                <Input type="date" value={form.receiptDate} onChange={e => setForm(f => ({ ...f, receiptDate: e.target.value }))} className="bg-input border-border text-foreground" />
              </div>
              <div>
                <Label className="text-foreground text-sm mb-1.5 block">Notes</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." className="bg-input border-border text-foreground" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-foreground text-sm">Products *</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setItems(prev => [...prev, { productId: '', quantity: 1 }])} className="border-border text-foreground h-7 text-xs">+ Add Row</Button>
              </div>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Select value={item.productId} onValueChange={v => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, productId: v } : it))}>
                      <SelectTrigger className="flex-1 bg-input border-border text-foreground text-xs h-8"><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {products.map(p => <SelectItem key={p._id} value={String(p._id)} className="text-popover-foreground text-xs">{p.name} ({p.sku})</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input type="number" min={1} value={item.quantity}
                      onChange={e => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, quantity: parseInt(e.target.value) || 1 } : it))}
                      className="w-24 bg-input border-border text-foreground text-xs h-8" placeholder="Qty" />
                    {items.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))} className="text-destructive hover:bg-destructive/10 w-7 h-7 shrink-0 text-base leading-none">×</Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-border">
              <Button onClick={() => handleSubmit(false)} disabled={loading} variant="outline" className="border-border text-foreground">
                Save as Ready
              </Button>
              <Button onClick={() => handleSubmit(true)} disabled={loading} className="gradient-primary text-primary-foreground">
                {loading ? 'Processing…' : '✓ Validate & Done'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
