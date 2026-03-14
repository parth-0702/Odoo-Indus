import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  listCategories,
  listUnits,
  listWarehouses,
  getProduct,
  createProduct,
  updateProduct,
  createAndPostOperation,
} from '@/lib/repo';
import type { CategoryDTO, UnitDTO, WarehouseDTO } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/shared/PageHeader';
import { ArrowLeft } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  sku: z.string().min(1, 'SKU required'),
  categoryId: z.string().min(1, 'Category required'),
  unitId: z.string().min(1, 'Unit required'),
  warehouseId: z.string().min(1, 'Warehouse required'),
  reorderLevel: z.coerce.number().min(0),
  initialStock: z.coerce.number().min(0),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

type FormData = z.infer<typeof schema>;
type Category = CategoryDTO;
type UnitOfMeasure = UnitDTO;
type Warehouse = WarehouseDTO;

export default function CreateProductPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!id;

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'active', initialStock: 0, reorderLevel: 5, categoryId: '', unitId: '', warehouseId: '' },
  });

  useEffect(() => {
    const load = async () => {
      const [c, u, w] = await Promise.all([listCategories(), listUnits(), listWarehouses()]);
      setCategories(c); setUnits(u); setWarehouses(w);

      if (isEdit && id) {
        const p = await getProduct(id);
        reset({
          name: p.name,
          sku: p.sku,
          categoryId: p.category ?? '',
          unitId: p.unit ?? '',
          warehouseId: '',
          reorderLevel: p.reorderLevel ?? 0,
          description: p.description ?? '',
          initialStock: 0,
          status: p.status ?? 'active',
        });
      }
    };
    void load().catch(e => setError(e instanceof Error ? e.message : String(e)));
  }, [id, isEdit, reset]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      if (isEdit && id) {
        await updateProduct(id, {
          name: data.name,
          sku: data.sku,
          category: data.categoryId,
          unit: data.unitId,
          reorderLevel: data.reorderLevel,
          description: data.description,
          status: data.status,
        });
        navigate('/products');
      } else {
        const created = await createProduct({
          name: data.name,
          sku: data.sku,
          category: data.categoryId,
          unit: data.unitId,
          reorderLevel: data.reorderLevel,
          description: data.description,
          status: data.status,
        });

        // Initial stock is recorded via a posted adjustment operation.
        if (data.initialStock > 0) {
          const whId = data.warehouseId;
          if (!whId) {
            throw new Error('Select a warehouse to set initial stock.');
          }
          await createAndPostOperation({
            type: 'adjustment',
            referenceNumber: `INIT-${Date.now().toString().slice(-6)}`,
            status: 'done',
            warehouseId: whId,
            date: new Date().toISOString(),
            notes: 'Initial stock entry',
            items: [{ productId: created._id, quantity: data.initialStock }],
          });
        }

        navigate('/products');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <PageHeader title={isEdit ? 'Edit Product' : 'Create Product'} subtitle={isEdit ? 'Update product details' : 'Add a new product to inventory'}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/products')} className="text-muted-foreground gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
      </PageHeader>

      {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>}

      <div className="card-elevated rounded-xl p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground text-sm mb-1.5 block">Product Name</Label>
              <Input {...register('name')} className="bg-input border-border text-foreground" placeholder="e.g. MacBook Pro 14&quot;" />
              {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label className="text-foreground text-sm mb-1.5 block">SKU Code</Label>
              <Input {...register('sku')} className="bg-input border-border text-foreground" placeholder="e.g. MBP-001" />
              {errors.sku && <p className="text-destructive text-xs mt-1">{errors.sku.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground text-sm mb-1.5 block">Category</Label>
              <Controller name="categoryId" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-input border-border text-foreground"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {categories.map(c => (
                      <SelectItem key={c._id} value={c._id} className="text-popover-foreground">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
              {errors.categoryId && <p className="text-destructive text-xs mt-1">{errors.categoryId.message}</p>}
            </div>
            <div>
              <Label className="text-foreground text-sm mb-1.5 block">Unit of Measure</Label>
              <Controller name="unitId" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-input border-border text-foreground"><SelectValue placeholder="Select unit" /></SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {units.map(u => (
                      <SelectItem key={u._id} value={u._id} className="text-popover-foreground">
                        {u.name} ({u.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
              {errors.unitId && <p className="text-destructive text-xs mt-1">{errors.unitId.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground text-sm mb-1.5 block">Warehouse</Label>
              <Controller name="warehouseId" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-input border-border text-foreground"><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {warehouses.map(w => (
                      <SelectItem key={w._id} value={w._id} className="text-popover-foreground">
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
              {errors.warehouseId && <p className="text-destructive text-xs mt-1">{errors.warehouseId.message}</p>}
            </div>
            <div>
              <Label className="text-foreground text-sm mb-1.5 block">Status</Label>
              <Controller name="status" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-input border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="active" className="text-popover-foreground">Active</SelectItem>
                    <SelectItem value="inactive" className="text-popover-foreground">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground text-sm mb-1.5 block">Reorder Level</Label>
              <Input {...register('reorderLevel')} type="number" min={0} className="bg-input border-border text-foreground" />
              {errors.reorderLevel && <p className="text-destructive text-xs mt-1">{errors.reorderLevel.message}</p>}
            </div>
            {!isEdit && (
              <div>
                <Label className="text-foreground text-sm mb-1.5 block">Initial Stock <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input {...register('initialStock')} type="number" min={0} className="bg-input border-border text-foreground" />
              </div>
            )}
          </div>

          <div>
            <Label className="text-foreground text-sm mb-1.5 block">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea {...register('description')} rows={3} className="bg-input border-border text-foreground placeholder:text-muted-foreground resize-none" placeholder="Optional product description..." />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="gradient-primary text-primary-foreground px-6">
              {loading ? 'Saving…' : isEdit ? 'Update Product' : 'Create Product'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/products')} className="border-border text-foreground">Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
