import { useEffect, useState, useMemo, useCallback } from 'react';
import { listStockLedger, listProducts, listWarehouses } from '@/lib/repo';
import type { ProductDTO, WarehouseDTO } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/shared/PageHeader';
import { Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type LedgerRow = {
  _id?: string;
  productId: string;
  warehouseId: string;
  type: string;
  quantityChange: number;
  referenceNumber?: string;
  notes?: string;
  createdAt?: string;
};

const opTypeLabel: Record<string, string> = {
  initial: 'Initial Stock', receipt: 'Receipt', delivery: 'Delivery',
  transfer_in: 'Transfer In', transfer_out: 'Transfer Out', adjustment: 'Adjustment',
};

const opTypeColor: Record<string, string> = {
  initial: 'text-muted-foreground bg-muted/50',
  receipt: 'text-success bg-success/10',
  delivery: 'text-destructive bg-destructive/10',
  transfer_in: 'text-primary bg-primary/10',
  transfer_out: 'text-warning bg-warning/10',
  adjustment: 'text-foreground bg-muted/50',
};

export default function MoveHistoryPage() {
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseDTO[]>([]);
  const [search, setSearch] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('all');
  const [filterOp, setFilterOp] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 25;

  useEffect(() => {
    (async () => {
      const [l, p, w] = await Promise.all([
        listStockLedger({ limit: 2000 }),
        listProducts(),
        listWarehouses(),
      ]);
      setLedger(l as LedgerRow[]);
      setProducts(p);
      setWarehouses(w);
    })().catch(() => {
      setLedger([]);
      setProducts([]);
      setWarehouses([]);
    });
  }, []);

  const getProductName = useCallback((id: string) => products.find(p => p._id === id)?.name ?? `Product ${id.slice?.(0, 6) ?? id}`, [products]);
  const getWHName = (id: string) => warehouses.find(w => w._id === id)?.name ?? '-';

  const filtered = useMemo(() => {
    return ledger.filter(e => {
      const pName = getProductName(e.productId).toLowerCase();
      const matchSearch = !search || pName.includes(search.toLowerCase()) || (e.referenceNumber ?? '').toLowerCase().includes(search.toLowerCase());
      const matchWH = filterWarehouse === 'all' || e.warehouseId === filterWarehouse;
      const matchOp = filterOp === 'all' || e.type === filterOp;
      const entryDate = new Date(e.createdAt ?? 0);
      const matchFrom = !filterDateFrom || entryDate >= new Date(filterDateFrom);
      const matchTo = !filterDateTo || entryDate <= new Date(filterDateTo + 'T23:59:59');
      return matchSearch && matchWH && matchOp && matchFrom && matchTo;
    });
  }, [ledger, search, filterWarehouse, filterOp, filterDateFrom, filterDateTo, getProductName]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const clearFilters = () => {
    setSearch(''); setFilterWarehouse('all'); setFilterOp('all');
    setFilterDateFrom(''); setFilterDateTo(''); setPage(1);
  };
  const hasFilters = !!(search || filterWarehouse !== 'all' || filterOp !== 'all' || filterDateFrom || filterDateTo);

  const summary = useMemo(() => {
    const totalIn = filtered.filter(e => e.quantityChange > 0).reduce((s, e) => s + e.quantityChange, 0);
    const totalOut = filtered.filter(e => e.quantityChange < 0).reduce((s, e) => s + Math.abs(e.quantityChange), 0);
    return { totalIn, totalOut };
  }, [filtered]);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Move History" subtitle="Complete stock ledger of all inventory movements" />

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-elevated rounded-xl p-3">
          <p className="text-muted-foreground text-xs">Total Records</p>
          <p className="text-2xl font-bold text-foreground mt-1">{filtered.length}</p>
        </div>
        <div className="card-elevated rounded-xl p-3">
          <p className="text-muted-foreground text-xs">Total Stock In</p>
          <p className="text-2xl font-bold text-success mt-1">+{summary.totalIn}</p>
        </div>
        <div className="card-elevated rounded-xl p-3">
          <p className="text-muted-foreground text-xs">Total Stock Out</p>
          <p className="text-2xl font-bold text-destructive mt-1">-{summary.totalOut}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-elevated rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search product or reference..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9 bg-input border-border text-foreground placeholder:text-muted-foreground" />
          </div>
          <Select value={filterWarehouse} onValueChange={v => { setFilterWarehouse(v); setPage(1); }}>
            <SelectTrigger className="w-48 bg-input border-border text-foreground"><SelectValue placeholder="All Warehouses" /></SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all" className="text-popover-foreground">All Warehouses</SelectItem>
              {warehouses.map(w => <SelectItem key={w._id} value={String(w._id)} className="text-popover-foreground">{w.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterOp} onValueChange={v => { setFilterOp(v); setPage(1); }}>
            <SelectTrigger className="w-44 bg-input border-border text-foreground"><SelectValue placeholder="All Operations" /></SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all" className="text-popover-foreground">All Operations</SelectItem>
              {Object.entries(opTypeLabel).map(([k, v]) => <SelectItem key={k} value={k} className="text-popover-foreground">{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex gap-3 flex-1">
            <div>
              <Label className="text-muted-foreground text-xs mb-1 block">From Date</Label>
              <Input type="date" value={filterDateFrom} onChange={e => { setFilterDateFrom(e.target.value); setPage(1); }} className="bg-input border-border text-foreground text-sm h-9" />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs mb-1 block">To Date</Label>
              <Input type="date" value={filterDateTo} onChange={e => { setFilterDateTo(e.target.value); setPage(1); }} className="bg-input border-border text-foreground text-sm h-9" />
            </div>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground h-9 gap-1.5 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Clear Filters
            </Button>
          )}
        </div>
      </div>

      <div className="card-elevated rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Date & Time', 'Product', 'Operation', 'Qty', 'Warehouse', 'Reference', 'Notes'].map(h => (
                  <th key={h} className="text-left text-muted-foreground font-medium px-4 py-3 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground py-12">
                    {hasFilters ? 'No records match your filters' : 'No movement records found'}
                  </td>
                </tr>
              ) : paginated.map((e, idx) => (
                <tr key={e._id ?? `${e.createdAt}-${e.referenceNumber}-${e.warehouseId}`} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{e.createdAt ? format(new Date(e.createdAt), 'dd MMM yyyy HH:mm') : '-'}</td>
                  <td className="px-4 py-3 text-foreground text-xs font-medium max-w-[160px] truncate">{getProductName(e.productId)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md', opTypeColor[e.type] ?? 'text-foreground bg-muted/50')}>
                      {opTypeLabel[e.type] ?? e.type}
                    </span>
                  </td>
                  <td className={cn('px-4 py-3 font-bold text-sm', e.quantityChange > 0 ? 'text-success' : 'text-destructive')}>
                    {e.quantityChange > 0 ? '+' : ''}{e.quantityChange}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{getWHName(e.warehouseId)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.referenceNumber ?? '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[120px] truncate">{e.notes ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-muted-foreground text-xs">{filtered.length} total records</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="border-border text-foreground h-7 text-xs">← Prev</Button>
              <span className="text-foreground text-xs">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="border-border text-foreground h-7 text-xs">Next →</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
