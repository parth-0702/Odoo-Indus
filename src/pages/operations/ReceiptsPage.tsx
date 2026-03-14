import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { db, Receipt, Warehouse, Product } from '@/lib/db';
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
import { hasLedgerEntries } from '@/lib/stock';

interface ReceiptItemRow { productId: number; quantity: number; }
const EMPTY_FORM = { supplier: '', warehouseId: '', receiptDate: new Date().toISOString().slice(0, 10), notes: '' };

export default function ReceiptsPage() {
  const user = useAuthStore(s => s.user);
  const { refreshStock } = useInventoryStore();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [items, setItems] = useState<ReceiptItemRow[]>([{ productId: 0, quantity: 1 }]);

  const load = async () => {
    const [r, w, p] = await Promise.all([
      db.receipts.orderBy('createdAt').reverse().toArray(),
      db.warehouses.toArray(),
      db.products.toArray(),
    ]);
    setReceipts(r); setWarehouses(w); setProducts(p);
  };
  useEffect(() => { load(); }, []);

  const openDialog = () => {
    setForm({ ...EMPTY_FORM });
    setItems([{ productId: 0, quantity: 1 }]);
    setError('');
    setOpen(true);
  };

  const normalizeItems = (rows: ReceiptItemRow[]) => {
    const valid = rows
      .filter(r => r.productId > 0)
      .map(r => ({ productId: r.productId, quantity: Number(r.quantity) }))
      .filter(r => Number.isFinite(r.quantity) && r.quantity > 0);

    return Object.values(valid.reduce((acc, it) => {
      acc[it.productId] = acc[it.productId]
        ? { ...it, quantity: acc[it.productId].quantity + it.quantity }
        : { ...it };
      return acc;
    }, {} as Record<number, { productId: number; quantity: number }>));
  };

  const handleSubmit = async (asDone = false) => {
    setError('');
    if (!form.supplier.trim()) { setError('Supplier name is required'); return; }
    if (!form.warehouseId) { setError('Please select a warehouse'); return; }

    const normalized = normalizeItems(items);
    if (normalized.length === 0) { setError('Add at least one product with a valid quantity'); return; }

    setLoading(true);
    const ref = `RCP-${Date.now().toString().slice(-6)}`;
    const receiptId = await db.receipts.add({
      referenceNumber: ref,
      supplier: form.supplier,
      warehouseId: parseInt(form.warehouseId),
      receiptDate: new Date(form.receiptDate),
      status: asDone ? 'done' : 'ready',
      notes: form.notes,
      createdBy: user?.id ?? 1,
      createdAt: new Date(),
    });

    await db.receiptItems.bulkAdd(normalized.map(it => ({ ...it, receiptId: receiptId as number, unitId: 1 })));

    if (asDone) {
      const now = new Date();
      await db.stockLedger.bulkAdd(normalized.map(it => ({
        productId: it.productId,
        warehouseId: parseInt(form.warehouseId),
        operationType: 'receipt' as const,
        quantityChange: it.quantity,
        referenceId: receiptId as number,
        referenceNumber: ref,
        userId: user?.id ?? 1,
        createdAt: now,
      })));
      await refreshStock();
    }

    setOpen(false);
    await load();
    setLoading(false);
  };

  const handleValidate = async (receipt: Receipt) => {
    if (receipt.status === 'done' || receipt.status === 'cancelled') return;

    // Check no duplicate ledger entries
    if (await hasLedgerEntries({ referenceId: receipt.id!, operationType: 'receipt' })) {
      await db.receipts.update(receipt.id!, { status: 'done' });
      load();
      return;
    }

    const items = await db.receiptItems.where('receiptId').equals(receipt.id!).toArray();
    if (items.length === 0) { alert('No items in this receipt'); return; }
    await db.stockLedger.bulkAdd(items.map(it => ({
      productId: it.productId, warehouseId: receipt.warehouseId,
      operationType: 'receipt' as const, quantityChange: it.quantity,
      referenceId: receipt.id!, referenceNumber: receipt.referenceNumber,
      userId: user?.id ?? 1, createdAt: new Date(),
    })));
    await db.receipts.update(receipt.id!, { status: 'done' });
    await refreshStock();
    load();
  };

  const cancelReceipt = async (receipt: Receipt) => {
    if (!confirm('Cancel this receipt?')) return;
    await db.receipts.update(receipt.id!, { status: 'cancelled' });
    load();
  };

  const getWarehouseName = (id: number) => warehouses.find(w => w.id === id)?.name ?? '-';
  const getProductName = (id: number) => products.find(p => p.id === id)?.name ?? `Product #${id}`;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Receipts" subtitle="Incoming stock from suppliers">
        <Button onClick={openDialog} size="sm" className="gradient-primary text-primary-foreground gap-1.5">
          <Plus className="w-4 h-4" /> New Receipt
        </Button>
      </PageHeader>

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
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-primary font-semibold">{r.referenceNumber}</td>
                  <td className="px-4 py-3 text-foreground">{r.supplier}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{getWarehouseName(r.warehouseId)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{format(new Date(r.receiptDate), 'dd MMM yyyy')}</td>
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
                    {warehouses.map(w => <SelectItem key={w.id} value={String(w.id)} className="text-popover-foreground">{w.name}</SelectItem>)}
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
                <Button type="button" variant="outline" size="sm" onClick={() => setItems(prev => [...prev, { productId: 0, quantity: 1 }])} className="border-border text-foreground h-7 text-xs">+ Add Row</Button>
              </div>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Select value={item.productId > 0 ? String(item.productId) : ''} onValueChange={v => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, productId: parseInt(v) } : it))}>
                      <SelectTrigger className="flex-1 bg-input border-border text-foreground text-xs h-8"><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {products.map(p => <SelectItem key={p.id} value={String(p.id)} className="text-popover-foreground text-xs">{p.name} ({p.sku})</SelectItem>)}
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
