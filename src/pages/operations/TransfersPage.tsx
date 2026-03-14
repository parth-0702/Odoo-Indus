import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { db, Transfer, Warehouse, Product } from '@/lib/db';
import { useInventoryStore } from '@/store/inventoryStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { Plus, AlertCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { getStockForWarehouse, assertSufficientStock } from '@/lib/stock';

const EMPTY_FORM = { sourceWarehouseId: '', destinationWarehouseId: '', transferDate: new Date().toISOString().slice(0, 10), notes: '' };

export default function TransfersPage() {
  const user = useAuthStore(s => s.user);
  const { refreshStock, getStock } = useInventoryStore();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [items, setItems] = useState([{ productId: 0, quantity: 1 }]);
  const [liveAvail, setLiveAvail] = useState<Record<number, number>>({});

  const load = async () => {
    await refreshStock();
    const [t, w, p] = await Promise.all([
      db.transfers.orderBy('createdAt').reverse().toArray(),
      db.warehouses.toArray(), db.products.toArray()
    ]);
    setTransfers(t); setWarehouses(w); setProducts(p);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const sourceId = parseInt(form.sourceWarehouseId);
    if (!sourceId) { setLiveAvail({}); return; }
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(products.map(async p => [p.id!, await getStockForWarehouse(p.id!, sourceId)] as const));
      if (cancelled) return;
      setLiveAvail(Object.fromEntries(entries));
    })();
    return () => { cancelled = true; };
  }, [form.sourceWarehouseId, products]);

  const openDialog = () => {
    setForm({ ...EMPTY_FORM });
    setItems([{ productId: 0, quantity: 1 }]);
    setError('');
    setOpen(true);
  };

  const handleSubmit = async (validate = false) => {
    setError('');

    if (!form.sourceWarehouseId || !form.destinationWarehouseId) {
      setError('Please select both source and destination warehouses');
      return;
    }
    if (form.sourceWarehouseId === form.destinationWarehouseId) {
      setError('Source and destination warehouses must be different');
      return;
    }

    const validItems = items
      .filter(it => it.productId > 0)
      .map(it => ({ ...it, quantity: Number(it.quantity) }))
      .filter(it => Number.isFinite(it.quantity) && it.quantity > 0);

    if (validItems.length === 0) { setError('Add at least one product'); return; }

    // Prevent duplicate product rows by aggregating quantities
    const aggregated = Object.values(validItems.reduce((acc, it) => {
      acc[it.productId] = acc[it.productId]
        ? { ...it, quantity: acc[it.productId].quantity + it.quantity }
        : { ...it };
      return acc;
    }, {} as Record<number, { productId: number; quantity: number }>));

    if (validate) {
      const sourceId = parseInt(form.sourceWarehouseId);
      try {
        await assertSufficientStock({
          warehouseId: sourceId,
          items: aggregated.map(it => ({
            productId: it.productId,
            quantity: it.quantity,
            productName: products.find(p => p.id === it.productId)?.name,
          })),
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        return;
      }
    }

    setLoading(true);
    const ref = `TRF-${Date.now().toString().slice(-6)}`;
    const transferId = await db.transfers.add({
      referenceNumber: ref,
      sourceWarehouseId: parseInt(form.sourceWarehouseId),
      destinationWarehouseId: parseInt(form.destinationWarehouseId),
      transferDate: new Date(form.transferDate),
      status: validate ? 'done' : 'ready',
      notes: form.notes,
      createdBy: user?.id ?? 1,
      createdAt: new Date(),
    });

    await db.transferItems.bulkAdd(aggregated.map(it => ({ ...it, transferId: transferId as number, unitId: 1 })));

    if (validate) {
      const srcId = parseInt(form.sourceWarehouseId);
      const dstId = parseInt(form.destinationWarehouseId);
      const now = new Date();
      await db.stockLedger.bulkAdd([
        ...aggregated.map(it => ({ productId: it.productId, warehouseId: srcId, operationType: 'transfer_out' as const, quantityChange: -it.quantity, referenceId: transferId as number, referenceNumber: ref, userId: user?.id ?? 1, createdAt: now })),
        ...aggregated.map(it => ({ productId: it.productId, warehouseId: dstId, operationType: 'transfer_in' as const, quantityChange: it.quantity, referenceId: transferId as number, referenceNumber: ref, userId: user?.id ?? 1, createdAt: now })),
      ]);

      await refreshStock();
    }

    setOpen(false);
    await load();
    setLoading(false);
  };

  const getWHName = (id: number) => warehouses.find(w => w.id === id)?.name?.replace(' Warehouse', '') ?? '-';
  const getProductName = (id: number) => products.find(p => p.id === id)?.name ?? `Product #${id}`;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Internal Transfers" subtitle="Move stock between warehouses">
        <Button onClick={openDialog} size="sm" className="gradient-primary text-primary-foreground gap-1.5">
          <Plus className="w-4 h-4" /> New Transfer
        </Button>
      </PageHeader>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { status: 'ready', label: 'Ready', color: 'text-warning' },
          { status: 'draft', label: 'Draft', color: 'text-muted-foreground' },
          { status: 'done', label: 'Done', color: 'text-success' },
          { status: 'cancelled', label: 'Cancelled', color: 'text-destructive' },
        ].map(s => (
          <div key={s.status} className="card-elevated rounded-xl p-3">
            <p className="text-muted-foreground text-xs">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{transfers.filter(t => t.status === s.status).length}</p>
          </div>
        ))}
      </div>

      <div className="card-elevated rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Reference', 'Route', 'Date', 'Status', 'Notes'].map(h => (
                  <th key={h} className="text-left text-muted-foreground font-medium px-4 py-3 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transfers.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-muted-foreground py-12">No transfers found</td></tr>
              ) : transfers.map(t => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-warning font-semibold">{t.referenceNumber}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-foreground">{getWHName(t.sourceWarehouseId)}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="text-foreground">{getWHName(t.destinationWarehouseId)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{format(new Date(t.transferDate), 'dd MMM yyyy')}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{t.notes ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={v => { if (!v) setOpen(false); }}>
        <DialogContent className="bg-card border-border text-foreground max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-foreground">New Internal Transfer</DialogTitle></DialogHeader>
          {error && <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground text-sm mb-1.5 block">From Warehouse *</Label>
                <Select value={form.sourceWarehouseId} onValueChange={v => setForm(f => ({ ...f, sourceWarehouseId: v }))}>
                  <SelectTrigger className="bg-input border-border text-foreground"><SelectValue placeholder="Source" /></SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {warehouses.map(w => <SelectItem key={w.id} value={String(w.id)} className="text-popover-foreground" disabled={String(w.id) === form.destinationWarehouseId}>{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-foreground text-sm mb-1.5 block">To Warehouse *</Label>
                <Select value={form.destinationWarehouseId} onValueChange={v => setForm(f => ({ ...f, destinationWarehouseId: v }))}>
                  <SelectTrigger className="bg-input border-border text-foreground"><SelectValue placeholder="Destination" /></SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {warehouses.map(w => <SelectItem key={w.id} value={String(w.id)} className="text-popover-foreground" disabled={String(w.id) === form.sourceWarehouseId}>{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-foreground text-sm mb-1.5 block">Transfer Date</Label>
                <Input type="date" value={form.transferDate} onChange={e => setForm(f => ({ ...f, transferDate: e.target.value }))} className="bg-input border-border text-foreground" />
              </div>
              <div>
                <Label className="text-foreground text-sm mb-1.5 block">Notes</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" className="bg-input border-border text-foreground" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-foreground text-sm">Products *</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setItems(p => [...p, { productId: 0, quantity: 1 }])} className="border-border text-foreground h-7 text-xs">+ Add</Button>
              </div>
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center mb-2">
                  <Select value={item.productId > 0 ? String(item.productId) : ''} onValueChange={v => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, productId: parseInt(v) } : it))}>
                    <SelectTrigger className="flex-1 bg-input border-border text-foreground text-xs h-8"><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {products.map(p => (
                        <SelectItem key={p.id} value={String(p.id)} className="text-popover-foreground text-xs">
                          {p.name} — {liveAvail[p.id!] ?? getStock(p.id!, parseInt(form.sourceWarehouseId))} avail.
                        </SelectItem>
                      ))}
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
              <Button onClick={() => handleSubmit(false)} disabled={loading} variant="outline" className="border-border text-foreground">Save as Ready</Button>
              <Button onClick={() => handleSubmit(true)} disabled={loading} className="gradient-primary text-primary-foreground">
                {loading ? 'Processing…' : '✓ Transfer Now'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
