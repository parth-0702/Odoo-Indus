import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { db, Delivery, Warehouse, Product } from '@/lib/db';
import { useInventoryStore } from '@/store/inventoryStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { Plus, AlertCircle, CheckCircle2, PackageCheck } from 'lucide-react';
import { format } from 'date-fns';
import { assertSufficientStock, hasLedgerEntries } from '@/lib/stock';
import { api, hybrid } from '@/lib/api';
import { enqueueOperation } from '@/lib/sync';

interface ItemRow { productId: number; quantity: number; }
const EMPTY_FORM = { customer: '', warehouseId: '', deliveryDate: new Date().toISOString().slice(0, 10), notes: '' };

export default function DeliveriesPage() {
  const user = useAuthStore(s => s.user);
  const { refreshStock, getStock } = useInventoryStore();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [items, setItems] = useState<ItemRow[]>([{ productId: 0, quantity: 1 }]);

  const load = async () => {
    await refreshStock();
    const [d, w, p] = await Promise.all([
      db.deliveries.orderBy('createdAt').reverse().toArray(),
      db.warehouses.toArray(), db.products.toArray()
    ]);
    setDeliveries(d); setWarehouses(w); setProducts(p);
  };
  useEffect(() => { load(); }, []);

  const openDialog = () => {
    setForm({ ...EMPTY_FORM });
    setItems([{ productId: 0, quantity: 1 }]);
    setError('');
    setOpen(true);
  };

  const normalizeItems = (rows: ItemRow[]) => {
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

  const validateStock = async (warehouseId: number, lineItems: { productId: number; quantity: number }[]) => {
    try {
      await assertSufficientStock({
        warehouseId,
        items: lineItems.map(it => ({
          productId: it.productId,
          quantity: it.quantity,
          productName: products.find(p => p.id === it.productId)?.name,
        })),
      });
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  };

  const handleSubmit = async (validate = false) => {
    setError('');
    if (!form.customer.trim()) { setError('Customer name is required'); return; }
    if (!form.warehouseId) { setError('Please select a warehouse'); return; }

    const normalized = normalizeItems(items);
    if (normalized.length === 0) { setError('Add at least one product'); return; }

    // Hybrid path: Mongo is source of truth.
    if (hybrid.enabled && !hybrid.dbOnly) {
      setLoading(true);
      const ref = `DEL-${Date.now().toString().slice(-6)}`;
      const opStatus = (validate ? 'done' : 'ready') as 'done' | 'ready';
      const op = {
        type: 'delivery' as const,
        referenceNumber: ref,
        status: opStatus,
        warehouseId: String(form.warehouseId),
        customer: form.customer,
        date: form.deliveryDate,
        notes: form.notes,
        createdBy: String(user?.id ?? ''),
        items: normalized.map(it => ({ productId: String(it.productId), quantity: it.quantity })),
      };

      try {
        if (validate) {
          const created = await api.operations.create(op);
          await api.operations.post(created._id);
        } else {
          // Queue draft/ready operations too (so they appear once synced)
          await enqueueOperation(op);
        }

        setOpen(false);
        await refreshStock();
        await load();
      } catch (e) {
        // If server fails/offline, enqueue for later.
        try {
          await enqueueOperation(op);
          setOpen(false);
        } catch {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        setLoading(false);
      }

      return;
    }

    // --- Local Dexie path (db-only) ---

    if (validate) {
      const stockError = await validateStock(parseInt(form.warehouseId), normalized);
      if (stockError) { setError(stockError); return; }
    }

    setLoading(true);
    const ref = `DEL-${Date.now().toString().slice(-6)}`;
    const deliveryId = await db.deliveries.add({
      referenceNumber: ref,
      customer: form.customer,
      warehouseId: parseInt(form.warehouseId),
      deliveryDate: new Date(form.deliveryDate),
      status: validate ? 'done' : 'pick',
      notes: form.notes,
      createdBy: user?.id ?? 1,
      createdAt: new Date(),
    });

    await db.deliveryItems.bulkAdd(normalized.map(it => ({ ...it, deliveryId: deliveryId as number, unitId: 1 })));

    if (validate) {
      const now = new Date();
      await db.stockLedger.bulkAdd(normalized.map(it => ({
        productId: it.productId,
        warehouseId: parseInt(form.warehouseId),
        operationType: 'delivery' as const,
        quantityChange: -it.quantity,
        referenceId: deliveryId as number,
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

  const handleValidate = async (d: Delivery) => {
    if (d.status === 'done' || d.status === 'cancelled') return;

    if (hybrid.enabled && !hybrid.dbOnly) {
      alert('This delivery is from local storage. In hybrid mode, validate/post deliveries via the server flow.');
      return;
    }

    // Prevent duplicate ledger entries (faster + reliable)
    if (await hasLedgerEntries({ referenceId: d.id!, operationType: 'delivery' })) {
      await db.deliveries.update(d.id!, { status: 'done' });
      load();
      return;
    }

    const its = await db.deliveryItems.where('deliveryId').equals(d.id!).toArray();
    const stockError = await validateStock(d.warehouseId, its.map(i => ({ productId: i.productId, quantity: i.quantity })));
    if (stockError) { alert(stockError); return; }

    await db.stockLedger.bulkAdd(its.map(it => ({
      productId: it.productId, warehouseId: d.warehouseId,
      operationType: 'delivery' as const, quantityChange: -it.quantity,
      referenceId: d.id!, referenceNumber: d.referenceNumber,
      userId: user?.id ?? 1, createdAt: new Date(),
    })));
    await db.deliveries.update(d.id!, { status: 'done' });
    await refreshStock();
    load();
  };

  const cancelDelivery = async (d: Delivery) => {
    if (!confirm('Cancel this delivery?')) return;
    await db.deliveries.update(d.id!, { status: 'cancelled' });
    load();
  };

  const getWarehouseName = (id: number) => warehouses.find(w => w.id === id)?.name ?? '-';

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Delivery Orders" subtitle="Outgoing shipments to customers">
        <Button onClick={openDialog} size="sm" className="gradient-primary text-primary-foreground gap-1.5">
          <Plus className="w-4 h-4" /> New Delivery
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { status: 'pick', label: 'Pick', color: 'text-primary' },
          { status: 'pack', label: 'Pack', color: 'text-warning' },
          { status: 'done', label: 'Done', color: 'text-success' },
          { status: 'cancelled', label: 'Cancelled', color: 'text-destructive' },
        ].map(s => (
          <div key={s.status} className="card-elevated rounded-xl p-3">
            <p className="text-muted-foreground text-xs">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{deliveries.filter(d => d.status === s.status).length}</p>
          </div>
        ))}
      </div>

      <div className="card-elevated rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Reference', 'Customer', 'Warehouse', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-muted-foreground font-medium px-4 py-3 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deliveries.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-muted-foreground py-12">No deliveries found</td></tr>
              ) : deliveries.map(d => (
                <tr key={d.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-destructive font-semibold">{d.referenceNumber}</td>
                  <td className="px-4 py-3 text-foreground">{d.customer}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{getWarehouseName(d.warehouseId)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{format(new Date(d.deliveryDate), 'dd MMM yyyy')}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {(d.status === 'pick' || d.status === 'pack') && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleValidate(d)} className="text-success hover:bg-success/10 h-7 text-xs gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Validate
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => cancelDelivery(d)} className="text-destructive hover:bg-destructive/10 h-7 text-xs">
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
          <DialogHeader><DialogTitle className="text-foreground">New Delivery Order</DialogTitle></DialogHeader>
          {error && <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground text-sm mb-1.5 block">Customer *</Label>
                <Input value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} placeholder="e.g. Acme Corp" className="bg-input border-border text-foreground" />
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
                <Label className="text-foreground text-sm mb-1.5 block">Delivery Date</Label>
                <Input type="date" value={form.deliveryDate} onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))} className="bg-input border-border text-foreground" />
              </div>
              <div>
                <Label className="text-foreground text-sm mb-1.5 block">Notes</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" className="bg-input border-border text-foreground" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-foreground text-sm">Products *</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setItems(prev => [...prev, { productId: 0, quantity: 1 }])} className="border-border text-foreground h-7 text-xs">+ Add</Button>
              </div>
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center mb-2">
                  <Select value={item.productId > 0 ? String(item.productId) : ''} onValueChange={v => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, productId: parseInt(v) } : it))}>
                    <SelectTrigger className="flex-1 bg-input border-border text-foreground text-xs h-8"><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {products.map(p => <SelectItem key={p.id} value={String(p.id)} className="text-popover-foreground text-xs">{p.name} ({p.sku})</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input type="number" min={1} value={item.quantity}
                    onChange={e => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, quantity: parseInt(e.target.value) || 1 } : it))}
                    className="w-24 bg-input border-border text-foreground text-xs h-8" />
                  {items.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))} className="text-destructive w-7 h-7 shrink-0 text-base">×</Button>}
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2 border-t border-border">
              <Button onClick={() => handleSubmit(false)} disabled={loading} variant="outline" className="border-border text-foreground">Save as Pick</Button>
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
