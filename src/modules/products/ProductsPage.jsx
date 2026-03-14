import { useEffect, useState } from 'react';
import { getProductsApi, createProductApi, updateProductApi, deleteProductApi } from '../../api/products.api';
import { toast } from 'react-toastify';
import { MdEdit, MdDelete, MdAdd, MdSearch } from 'react-icons/md';

const emptyForm = { name: '', sku: '', category: '', uom: 'Units', description: '', minStockLevel: 10 };

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getProductsApi({ search });
      setProducts(res.data.products);
    } catch (e) { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const openCreate = () => { setForm(emptyForm); setEditProduct(null); setShowModal(true); };
  const openEdit = (p) => { setForm({ name: p.name, sku: p.sku, category: p.category, uom: p.uom, description: p.description || '', minStockLevel: p.minStockLevel }); setEditProduct(p); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editProduct) {
        await updateProductApi(editProduct._id, form);
        toast.success('Product updated');
      } else {
        await createProductApi(form);
        toast.success('Product created');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving product');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this product?')) return;
    try { await deleteProductApi(id); toast.success('Product deactivated'); load(); } catch { toast.error('Error'); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h2 className="page-title">Products</h2><p className="page-subtitle">{products.length} active products in catalog</p></div>
        <button className="btn btn-primary" onClick={openCreate}><MdAdd /> Add Product</button>
      </div>

      {/* Search */}
      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <MdSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 18 }} />
          <input className="form-control" style={{ paddingLeft: 34 }} placeholder="Search by name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr><th>Product</th><th>SKU</th><th>Category</th><th>UOM</th><th>Min Stock</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">📦</div><p>No products found. <button className="btn btn-primary btn-sm" onClick={openCreate}>Add your first product</button></p></div></td></tr>
            ) : (
              products.map((p) => (
                <tr key={p._id}>
                  <td><div style={{ fontWeight: 600 }}>{p.name}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.description}</div></td>
                  <td><code style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{p.sku}</code></td>
                  <td>{p.category}</td>
                  <td>{p.uom}</td>
                  <td>{p.minStockLevel}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-icon" onClick={() => openEdit(p)}><MdEdit /></button>
                      <button className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(p._id)}><MdDelete /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editProduct ? 'Edit Product' : 'New Product'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group"><label className="form-label">Product Name *</label><input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">SKU / Product Code *</label><input className="form-control" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Category *</label><input className="form-control" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required placeholder="e.g. Electronics" /></div>
              </div>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Unit of Measure</label>
                  <select className="form-control" value={form.uom} onChange={(e) => setForm({ ...form, uom: e.target.value })}>
                    {['Units', 'Kg', 'Liters', 'Meters', 'Pieces', 'Boxes', 'Pallets'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Min Stock Level</label><input className="form-control" type="number" min={0} value={form.minStockLevel} onChange={(e) => setForm({ ...form, minStockLevel: +e.target.value })} /></div>
              </div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} /></div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
