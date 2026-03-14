import { useEffect, useState } from 'react';
import { getAdjustmentsApi, createAdjustmentApi, applyAdjustmentApi } from '../../api/adjustments.api';
import { getProductsApi } from '../../api/products.api';
import { getWarehousesApi } from '../../api/warehouse.api';
import { getStockApi } from '../../api/inventory.api';
import { toast } from 'react-toastify';
import { MdAdd, MdCheck } from 'react-icons/md';

const StatusBadge = ({ status }) => <span className={`badge badge-${status}`}>{status}</span>;

export default function AdjustmentsPage() {
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentStock, setCurrentStock] = useState(null);
  const [form, setForm] = useState({ product: '', warehouse: '', locationId: '', locationName: '', countedQuantity: 0, reason: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [aRes, pRes, wRes] = await Promise.all([getAdjustmentsApi(), getProductsApi({}), getWarehousesApi()]);
      setAdjustments(aRes.data.adjustments); setProducts(pRes.data.products); setWarehouses(wRes.data.warehouses);
    } catch { toast.error('Failed to load'); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const selectedWarehouse = warehouses.find(w => w._id === form.warehouse);

  const lookupStock = async () => {
    if (!form.product || !form.warehouse || !form.locationId) return;
    try {
      const res = await getStockApi({ product: form.product, warehouse: form.warehouse, location: form.locationId });
      const stock = res.data.stocks?.[0];
      setCurrentStock(stock ? stock.quantity : 0);
    } catch { setCurrentStock(0); }
  };

  useEffect(() => { lookupStock(); }, [form.product, form.warehouse, form.locationId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.product || !form.warehouse || !form.locationId) return toast.error('Fill all required fields');
    setSaving(true);
    try { await createAdjustmentApi(form); toast.success('Adjustment created'); setShowModal(false); setCurrentStock(null); setForm({ product: '', warehouse: '', locationId: '', locationName: '', countedQuantity: 0, reason: '' }); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); } finally { setSaving(false); }
  };

  const apply = async (id) => {
    if (!window.confirm('Apply adjustment? Stock will be updated.')) return;
    try { await applyAdjustmentApi(id); toast.success('Adjustment applied!'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h2 className="page-title">Inventory Adjustments</h2><p className="page-subtitle">Correct stock when physical count differs from system</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><MdAdd /> New Adjustment</button>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr><th>Adj. No.</th><th>Product</th><th>Warehouse</th><th>Location</th><th>Previous Qty</th><th>Counted Qty</th><th>Difference</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
              : adjustments.length === 0 ? <tr><td colSpan={9}><div className="empty-state"><div className="empty-state-icon">🔧</div><p>No adjustments found</p></div></td></tr>
              : adjustments.map((a) => (
                <tr key={a._id}>
                  <td><code style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{a.adjustmentNumber}</code></td>
                  <td><div style={{ fontWeight: 500 }}>{a.product?.name}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.product?.sku}</div></td>
                  <td>{a.warehouse?.name}</td>
                  <td>{a.locationName}</td>
                  <td>{a.previousQuantity}</td>
                  <td>{a.countedQuantity}</td>
                  <td><span style={{ color: a.difference > 0 ? 'var(--success)' : a.difference < 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 600 }}>{a.difference > 0 ? '+' : ''}{a.difference}</span></td>
                  <td><StatusBadge status={a.status} /></td>
                  <td>{a.status !== 'done' && <button className="btn btn-success btn-sm" onClick={() => apply(a._id)}><MdCheck /> Apply</button>}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">New Adjustment</h3><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group"><label className="form-label">Product *</label>
                <select className="form-control" value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} required>
                  <option value="">Select product</option>{products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                </select></div>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Warehouse *</label>
                  <select className="form-control" value={form.warehouse} onChange={e => setForm({ ...form, warehouse: e.target.value, locationId: '', locationName: '' })} required>
                    <option value="">Select</option>{warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                  </select></div>
                <div className="form-group"><label className="form-label">Location *</label>
                  <select className="form-control" value={form.locationId} onChange={e => { const loc = selectedWarehouse?.locations.find(l => l._id === e.target.value); setForm({ ...form, locationId: e.target.value, locationName: loc?.name || '' }); }} required disabled={!form.warehouse}>
                    <option value="">Select</option>{selectedWarehouse?.locations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                  </select></div>
              </div>
              {currentStock !== null && (
                <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Current Stock on System</div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{currentStock} units</div>
                </div>
              )}
              <div className="form-group"><label className="form-label">Physical Count (Counted Quantity) *</label><input className="form-control" type="number" min={0} value={form.countedQuantity} onChange={e => setForm({ ...form, countedQuantity: +e.target.value })} required /></div>
              {currentStock !== null && (
                <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', background: form.countedQuantity - currentStock > 0 ? 'var(--success-bg)' : form.countedQuantity - currentStock < 0 ? 'var(--danger-bg)' : 'var(--bg-secondary)', color: form.countedQuantity - currentStock > 0 ? 'var(--success)' : form.countedQuantity - currentStock < 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 600 }}>
                  Difference: {form.countedQuantity - currentStock > 0 ? '+' : ''}{form.countedQuantity - currentStock} units
                </div>
              )}
              <div className="form-group"><label className="form-label">Reason</label><input className="form-control" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Physical count, damaged goods..." /></div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Adjustment'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
