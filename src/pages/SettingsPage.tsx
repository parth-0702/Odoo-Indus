import { useEffect, useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Tag, Ruler } from 'lucide-react';
import type { CategoryDTO, UnitDTO } from '@/lib/api';
import {
  listCategories,
  listUnits,
  createCategory,
  updateCategory,
  deleteCategory,
  createUnit,
  updateUnit,
  deleteUnit,
} from '@/lib/repo';

export default function SettingsPage() {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [units, setUnits] = useState<UnitDTO[]>([]);
  const [catOpen, setCatOpen] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [unitForm, setUnitForm] = useState({ name: '', symbol: '' });
  const [editingCat, setEditingCat] = useState<CategoryDTO | null>(null);
  const [editingUnit, setEditingUnit] = useState<UnitDTO | null>(null);

  const load = async () => {
    const [c, u] = await Promise.all([listCategories(), listUnits()]);
    setCategories(c);
    setUnits(u);
  };

  useEffect(() => {
    void load();
  }, []);

  const saveCategory = async () => {
    if (!catForm.name) return;
    if (editingCat?._id) await updateCategory(editingCat._id, catForm);
    else await createCategory({ ...catForm });
    setCatOpen(false);
    await load();
  };

  const removeCategory = async (id: string) => {
    if (!confirm('Delete?')) return;
    await deleteCategory(id);
    await load();
  };

  const saveUnit = async () => {
    if (!unitForm.name) return;
    if (editingUnit?._id) await updateUnit(editingUnit._id, unitForm);
    else await createUnit({ ...unitForm });
    setUnitOpen(false);
    await load();
  };

  const removeUnit = async (id: string) => {
    if (!confirm('Delete?')) return;
    await deleteUnit(id);
    await load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Settings" subtitle="Configure system preferences" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categories */}
        <div className="card-elevated rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              <h3 className="text-foreground font-semibold text-sm">Product Categories</h3>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingCat(null);
                setCatForm({ name: '', description: '' });
                setCatOpen(true);
              }}
              className="gradient-primary text-primary-foreground h-7 text-xs gap-1"
            >
              <Plus className="w-3 h-3" /> Add
            </Button>
          </div>
          <div className="divide-y divide-border">
            {categories.map((c) => (
              <div key={c._id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/20">
                <div>
                  <p className="text-foreground text-sm">{c.name}</p>
                  {c.description && <p className="text-muted-foreground text-xs mt-0.5">{c.description}</p>}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setEditingCat(c);
                      setCatForm({ name: c.name, description: c.description ?? '' });
                      setCatOpen(true);
                    }}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeCategory(c._id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Units */}
        <div className="card-elevated rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-warning" />
              <h3 className="text-foreground font-semibold text-sm">Units of Measure</h3>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingUnit(null);
                setUnitForm({ name: '', symbol: '' });
                setUnitOpen(true);
              }}
              className="gradient-primary text-primary-foreground h-7 text-xs gap-1"
            >
              <Plus className="w-3 h-3" /> Add
            </Button>
          </div>
          <div className="divide-y divide-border">
            {units.map((u) => (
              <div key={u._id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/20">
                <div className="flex items-center gap-3">
                  <span className="text-foreground text-sm">{u.name}</span>
                  <span className="text-muted-foreground text-xs font-mono bg-muted px-2 py-0.5 rounded">{u.symbol}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setEditingUnit(u);
                      setUnitForm({ name: u.name, symbol: u.symbol });
                      setUnitOpen(true);
                    }}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeUnit(u._id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Dialog */}
      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingCat ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-foreground text-sm mb-1.5 block">Name</Label>
              <Input
                value={catForm.name}
                onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
                className="bg-input border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-foreground text-sm mb-1.5 block">Description</Label>
              <Input
                value={catForm.description}
                onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))}
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={saveCategory} className="gradient-primary text-primary-foreground">
                Save
              </Button>
              <Button variant="outline" onClick={() => setCatOpen(false)} className="border-border text-foreground">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unit Dialog */}
      <Dialog open={unitOpen} onOpenChange={setUnitOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingUnit ? 'Edit Unit' : 'Add Unit'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-foreground text-sm mb-1.5 block">Name</Label>
              <Input
                value={unitForm.name}
                onChange={(e) => setUnitForm((f) => ({ ...f, name: e.target.value }))}
                className="bg-input border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-foreground text-sm mb-1.5 block">Symbol</Label>
              <Input
                value={unitForm.symbol}
                onChange={(e) => setUnitForm((f) => ({ ...f, symbol: e.target.value }))}
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={saveUnit} className="gradient-primary text-primary-foreground">
                Save
              </Button>
              <Button variant="outline" onClick={() => setUnitOpen(false)} className="border-border text-foreground">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
