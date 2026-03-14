import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import type { WarehouseDTO } from '@/lib/api';
import { createWarehouse, deleteWarehouse, listWarehouses, updateWarehouse } from '@/lib/repo';

const schema = z.object({
  name: z.string().min(2),
  location: z.string().min(2),
  manager: z.string().min(2),
  capacity: z.coerce.number().min(1),
  status: z.enum(['active', 'inactive']),
});

type FormData = z.infer<typeof schema>;

type WarehouseFormKeys = keyof Pick<FormData, 'name' | 'location' | 'manager'>;
const FIELDS: Array<{ key: WarehouseFormKeys; label: string }> = [
  { key: 'name', label: 'Warehouse Name' },
  { key: 'location', label: 'Location' },
  { key: 'manager', label: 'Manager' },
];

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseDTO[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WarehouseDTO | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'active', capacity: 1000 },
  });

  const load = async () => {
    const w = await listWarehouses();
    setWarehouses(w);
  };
  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ status: 'active', capacity: 1000, name: '', location: '', manager: '' });
    setOpen(true);
  };

  const openEdit = (w: WarehouseDTO) => {
    setEditing(w);
    reset({
      name: w.name,
      location: w.location ?? '',
      manager: w.manager ?? '',
      capacity: Number(w.capacity ?? 0),
      status: (w.status ?? 'active') as FormData['status'],
    });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    if (editing?._id) {
      const updated = await updateWarehouse(editing._id, data);
      setWarehouses((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
    } else {
      const created = await createWarehouse({
        name: data.name,
        location: data.location,
        manager: data.manager,
        capacity: data.capacity,
        status: data.status,
      });
      setWarehouses((prev) => [created, ...prev]);
    }

    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete warehouse?')) return;
    await deleteWarehouse(id);
    setWarehouses((prev) => prev.filter((w) => w._id !== id));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Warehouses" subtitle="Manage storage locations">
        <Button onClick={openCreate} size="sm" className="gradient-primary text-primary-foreground gap-1.5">
          <Plus className="w-4 h-4" /> Add Warehouse
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {warehouses.map((w) => (
          <div key={w._id} className="card-elevated rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-foreground font-semibold">{w.name}</h3>
                <p className="text-muted-foreground text-xs mt-0.5">{w.location}</p>
              </div>
              <StatusBadge status={w.status} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Manager</span>
                <p className="text-foreground mt-0.5">{w.manager}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Capacity</span>
                <p className="text-foreground mt-0.5">{Number(w.capacity ?? 0).toLocaleString()} units</p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => openEdit(w)} className="border-border text-foreground h-7 text-xs gap-1.5">
                <Pencil className="w-3 h-3" /> Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(w._id)} className="text-destructive hover:bg-destructive/10 h-7 text-xs gap-1.5">
                <Trash2 className="w-3 h-3" /> Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editing ? 'Edit Warehouse' : 'Add Warehouse'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {FIELDS.map(({ key, label }) => (
              <div key={key}>
                <Label className="text-foreground text-sm mb-1.5 block">{label}</Label>
                <Input {...register(key)} className="bg-input border-border text-foreground" />
                {errors[key] && <p className="text-destructive text-xs mt-1">{String(errors[key]?.message ?? '')}</p>}
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-foreground text-sm mb-1.5 block">Capacity</Label>
                <Input {...register('capacity')} type="number" className="bg-input border-border text-foreground" />
              </div>
              <div>
                <Label className="text-foreground text-sm mb-1.5 block">Status</Label>
                <Select onValueChange={(v) => setValue('status', v as FormData['status'])} defaultValue={watch('status')}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="active" className="text-popover-foreground">
                      Active
                    </SelectItem>
                    <SelectItem value="inactive" className="text-popover-foreground">
                      Inactive
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="gradient-primary text-primary-foreground">
                {editing ? 'Update' : 'Create'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-border text-foreground">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
