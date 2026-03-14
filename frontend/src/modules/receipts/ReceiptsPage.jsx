import { useEffect, useState } from 'react';
import { getReceiptsApi, createReceiptApi, updateReceiptApi, validateReceiptApi, cancelReceiptApi } from '../../api/receipts.api';
import { getProductsApi } from '../../api/products.api';
import { getWarehousesApi } from '../../api/warehouse.api';
import { toast } from 'react-toastify';
import { MdAdd, MdCheck, MdClose } from 'react-icons/md';

const StatusBadge = ({ status }) => <span className={`badge badge-${status}`}>{status}</span>;

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ supplier: '', warehouse: '', locationId: '', locationName: '', lines: [{ product: '', quantity: 1 }], note: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const [rRes, pRes, wRes] = await Promise.all([getReceiptsApi(params), getProductsApi({}), getWarehousesApi()]);
      setReceipts(rRes.data.receipts);
      setProducts(pRes.data.products);
      setWarehouses(wRes.data.warehouses);
    } catch (e) { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const selectedWarehouse = warehouses.find((w) => w._id === form.warehouse);

  const addLine = () => setForm({ ...form, lines: [...form.lines, { product: '', quantity: 1 }] });
  const removeLine = (i) => setForm({ ...form, lines: form.lines.filter((_, idx) => idx !== i) });
  const updateLine = (i, field, val) => {
    const lines = [...form.lines];
    lines[i] = { ...lines[i], [field]: field === 'quantity' ? +val : val };
    setForm({ ...form, lines });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.warehouse || !form.locationId) return toast.error('Select warehouse and location');
    if (form.lines.some(l => !l.product || l.quantity < 1)) return toast.error('Fill all line items');
    setSaving(true);
    try {
      await createReceiptApi(form);
      toast.success('Receipt created');
      setShowModal(false);
      setForm({ supplier: '', warehouse: '', locationId: '', locationName: '', lines: [{ product: '', quantity: 1 }], note: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const validate = async (id) => {
    if (!window.confirm('Validate this receipt? Stock will be increased.')) return;
    try { await validateReceiptApi(id); toast.success('Receipt validated! Stock updated.'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };
  const cancel = async (id) => {
    if (!window.confirm('Cancel this receipt?')) return;
    try { await cancelReceiptApi(id); toast.success('Receipt cancelled'); load(); }
    catch { toast.error('Error'); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h2 className="page-title">Receipts</h2><p className="page-subtitle">Incoming goods from suppliers</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><MdAdd /> New Receipt</button>
      </div>

      <div className="filters-bar">
        {['', 'draft', 'waiting', 'ready', 'done', 'cancelled'].map(s => (
          <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setStatusFilter(s)}>
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </button>
        ))}
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr><th>Receipt No.</th><th>Supplier</th><th>Warehouse</th><th>Location</th><th>Lines</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
              : receipts.length === 0 ? <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon">📥</div><p>No receipts found</p></div></td></tr>
              : receipts.map((r) => (
                <tr key={r._id}>
                  <td><code style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{r.receiptNumber}</code></td>
                  <td style={{ fontWeight: 500 }}>{r.supplier}</td>
                  <td>{r.warehouse?.name}</td>
                  <td>{r.locationName}</td>
                  <td>{r.lines?.length} item(s)</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {r.status !== 'done' && r.status !== 'cancelled' && (
                        <button className="btn btn-success btn-sm" onClick={() => validate(r._id)}><MdCheck /> Validate</button>
                      )}
                      {r.status !== 'done' && r.status !== 'cancelled' && (
                        <button className="btn btn-danger btn-sm" onClick={() => cancel(r._id)}><MdClose /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">New Receipt</h3><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group"><label className="form-label">Supplier Name *</label><input className="form-control" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} required placeholder="Supplier / Vendor name" /></div>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Warehouse *</label>
                  <select className="form-control" value={form.warehouse} onChange={(e) => setForm({ ...form, warehouse: e.target.value, locationId: '', locationName: '' })} required>
                    <option value="">Select warehouse</option>
                    {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Location *</label>
                  <select className="form-control" value={form.locationId} onChange={(e) => { const loc = selectedWarehouse?.locations.find(l => l._id === e.target.value); setForm({ ...form, locationId: e.target.value, locationName: loc?.name || '' }); }} required disabled={!form.warehouse}>
                    <option value="">Select location</option>
                    {selectedWarehouse?.locations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                  </select>
                </div>
              </div>
              <hr className="divider" />
              <div style={{ fontWeight: 600, fontSize: 13 }}>Line Items</div>
              <div className="line-items-section">
                {form.lines.map((line, i) => (
                  <div key={i} className="line-item-row">
                    <select className="form-control" value={line.product} onChange={(e) => updateLine(i, 'product', e.target.value)} required>
                      <option value="">Select product</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                    </select>
                    <input className="form-control" type="number" min={1} value={line.quantity} onChange={(e) => updateLine(i, 'quantity', e.target.value)} style={{ width: 90 }} />
                    {form.lines.length > 1 && <button type="button" className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)' }} onClick={() => removeLine(i)}><MdClose /></button>}
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm" onClick={addLine} style={{ alignSelf: 'flex-start' }}><MdAdd /> Add Line</button>
              </div>
              <div className="form-group"><label className="form-label">Note</label><textarea className="form-control" rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} style={{ resize: 'vertical' }} /></div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Receipt'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
