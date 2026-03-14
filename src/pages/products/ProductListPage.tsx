import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StatusBadge from '@/components/shared/StatusBadge';
import PageHeader from '@/components/shared/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { ProductDTO } from '@/lib/api';
import { useInventoryStore } from '@/store/inventoryStore';
import { deleteProduct, listCategories, listProducts, listWarehouses } from '@/lib/repo';

export default function ProductListPage() {
  const navigate = useNavigate();
  const { refreshStock, getStock } = useInventoryStore();

  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [categories, setCategories] = useState<Array<{ _id: string; name: string }>>([]);
  const [warehouses, setWarehouses] = useState<Array<{ _id: string; name: string }>>([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const load = useCallback(async () => {
    const [p, c, w] = await Promise.all([listProducts(), listCategories(), listWarehouses()]);
    setProducts(p);
    setCategories(c.map((x) => ({ _id: x._id, name: x.name })));
    setWarehouses(w.map((x) => ({ _id: x._id, name: x.name })));
    await refreshStock();
  }, [refreshStock]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const name = String(p.name ?? '').toLowerCase();
      const sku = String(p.sku ?? '').toLowerCase();
      const matchSearch = name.includes(search.toLowerCase()) || sku.includes(search.toLowerCase());
      const matchCat = filterCat === 'all' || String(p.category ?? '') === filterCat;
      return matchSearch && matchCat;
    });
  }, [products, search, filterCat]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  const getCategoryName = (val?: string) => {
    if (!val) return '-';
    return categories.find((c) => c._id === val)?.name ?? val;
  };

  const getWarehouseName = (_id?: string) => {
    if (!_id) return '-';
    return warehouses.find((w) => w._id === _id)?.name ?? '-';
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Products" subtitle="Manage your product catalog">
        <Button onClick={() => navigate('/products/create')} size="sm" className="gradient-primary text-primary-foreground gap-1.5">
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="card-elevated rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <Select
          value={filterCat}
          onValueChange={(v) => {
            setFilterCat(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44 bg-input border-border text-foreground">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all" className="text-popover-foreground">
              All Categories
            </SelectItem>
            {categories.map((c) => (
              <SelectItem key={c._id} value={c._id} className="text-popover-foreground">
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="card-elevated rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-muted-foreground font-medium px-4 py-3 text-xs uppercase tracking-wide">Product</th>
                <th className="text-left text-muted-foreground font-medium px-4 py-3 text-xs uppercase tracking-wide">SKU</th>
                <th className="text-left text-muted-foreground font-medium px-4 py-3 text-xs uppercase tracking-wide">Category</th>
                <th className="text-right text-muted-foreground font-medium px-4 py-3 text-xs uppercase tracking-wide">Stock</th>
                <th className="text-left text-muted-foreground font-medium px-4 py-3 text-xs uppercase tracking-wide">Warehouse</th>
                <th className="text-left text-muted-foreground font-medium px-4 py-3 text-xs uppercase tracking-wide">Status</th>
                <th className="text-left text-muted-foreground font-medium px-4 py-3 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground py-12">
                    No products found
                  </td>
                </tr>
              ) : (
                paginated.map((p: ProductDTO) => {
                  const stock = getStock(p._id);
                  const isLow = stock <= Number(p.reorderLevel ?? 0);
                  return (
                    <tr key={p._id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isLow && <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />}
                          <span className="text-foreground font-medium">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-muted-foreground">{p.sku}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{getCategoryName(p.category)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn('font-semibold', isLow ? 'text-warning' : 'text-foreground')}>{stock}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{getWarehouseName(undefined)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-foreground" onClick={() => navigate(`/products/${p._id}`)}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-foreground" onClick={() => navigate(`/products/${p._id}/edit`)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(p._id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-muted-foreground text-xs">{filtered.length} products</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="border-border text-foreground h-7 text-xs">
                Prev
              </Button>
              <span className="text-foreground text-xs">
                {page} / {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="border-border text-foreground h-7 text-xs">
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
