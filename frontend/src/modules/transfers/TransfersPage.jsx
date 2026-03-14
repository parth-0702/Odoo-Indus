import { useEffect, useState } from 'react';
import { getTransfersApi, createTransferApi, confirmTransferApi, cancelTransferApi } from '../../api/transfers.api';
import { getProductsApi } from '../../api/products.api';
import { getWarehousesApi } from '../../api/warehouse.api';
import { toast } from 'react-toastify';
import { MdAdd, MdCheck, MdClose } from 'react-icons/md';

const StatusBadge = ({ status }) => <span className={`badge badge-${status}`}>{status}</span>;

export default function TransfersPage() {
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ fromWarehouse: '', fromLocationId: '', fromLocationName: '', toWarehouse: '', toLocationId: '', toLocationName: '', lines: [{ product: '', quantity: 1 }], note: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const [tRes, pRes, wRes] = await Promise.all([getTransfersApi(params), getProductsApi({}), getWarehousesApi()]);
      setTransfers(tRes.data.transfers); setProducts(pRes.data.products); setWarehouses(wRes.data.warehouses);
    } catch { toast.error('Failed to load'); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [statusFilter]);

  const fromWH = warehouses.find(w => w._id === form.fromWarehouse);
  const toWH = warehouses.find(w => w._id === form.toWarehouse);
  const addLine = () => setForm({ ...form, lines: [...form.lines, { product: '', quantity: 1 }] });
  const removeLine = (i) => setForm({ ...form, lines: form.lines.filter((_, idx) => idx !== i) });
  const updateLine = (i, f, v) => { const l = [...form.lines]; l[i] = { ...l[i], [f]: f === 'quantity' ? +v : v }; setForm({ ...form, lines: l }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fromWarehouse || !form.fromLocationId || !form.toWarehouse || !form.toLocationId) return toast.error('Fill all location fields');
    setSaving(true);
    try { await createTransferApi(form); toast.success('Transfer created'); setShowModal(false); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); } finally { setSaving(false); }
  };

  const confirm = async (id) => { if (!window.confirm('Confirm transfer? Stock will be moved.')) return; try { await confirmTransferApi(id); toast.success('Transfer confirmed!'); load(); } catch (err) { toast.error(err.response?.data?.message || 'Error'); } };
  const cancel = async (id) => { if (!window.confirm('Cancel this transfer?')) return; try { await cancelTransferApi(id); toast.success('Transfer cancelled'); load(); } catch { toast.error('Error'); } };

  return (
    <div>
      <div className="page-header">
        <div><h2 className="page-title">Internal Transfers</h2><p className="page-subtitle">Move stock between locations. Total stock remains unchanged.</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><MdAdd /> New Transfer</button>
      </div>
      <div className="filters-bar">{['', 'draft', 'waiting', 'ready', 'done', 'cancelled'].map(s => <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setStatusFilter(s)}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}</button>)}</div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr><th>Transfer No.</th><th>From</th><th>To</th><th>Lines</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
              : transfers.length === 0 ? <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">🔄</div><p>No transfers found</p></div></td></tr>
              : transfers.map((t) => (
                <tr key={t._id}>
                  <td><code style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{t.transferNumber}</code></td>
                  <td><div style={{ fontSize: 12 }}>{t.fromWarehouse?.name}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.fromLocationName}</div></td>
                  <td><div style={{ fontSize: 12 }}>{t.toWarehouse?.name}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.toLocationName}</div></td>
                  <td>{t.lines?.length} item(s)</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td><div style={{ display: 'flex', gap: 6 }}>
                    {t.status !== 'done' && t.status !== 'cancelled' && <button className="btn btn-success btn-sm" onClick={() => confirm(t._id)}><MdCheck /> Confirm</button>}
                    {t.status !== 'done' && t.status !== 'cancelled' && <button className="btn btn-danger btn-sm" onClick={() => cancel(t._id)}><MdClose /></button>}
                  </div></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">New Internal Transfer</h3><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>Source</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="form-group"><label className="form-label">From Warehouse *</label>
                      <select className="form-control" value={form.fromWarehouse} onChange={e => setForm({ ...form, fromWarehouse: e.target.value, fromLocationId: '', fromLocationName: '' })} required>
                        <option value="">Select</option>{warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                      </select></div>
                    <div className="form-group"><label className="form-label">From Location *</label>
                      <select className="form-control" value={form.fromLocationId} onChange={e => { const loc = fromWH?.locations.find(l => l._id === e.target.value); setForm({ ...form, fromLocationId: e.target.value, fromLocationName: loc?.name || '' }); }} required disabled={!form.fromWarehouse}>
                        <option value="">Select</option>{fromWH?.locations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                      </select></div>
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>Destination</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="form-group"><label className="form-label">To Warehouse *</label>
                      <select className="form-control" value={form.toWarehouse} onChange={e => setForm({ ...form, toWarehouse: e.target.value, toLocationId: '', toLocationName: '' })} required>
                        <option value="">Select</option>{warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                      </select></div>
                    <div className="form-group"><label className="form-label">To Location *</label>
                      <select className="form-control" value={form.toLocationId} onChange={e => { const loc = toWH?.locations.find(l => l._id === e.target.value); setForm({ ...form, toLocationId: e.target.value, toLocationName: loc?.name || '' }); }} required disabled={!form.toWarehouse}>
                        <option value="">Select</option>{toWH?.locations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                      </select></div>
                  </div>
                </div>
              </div>
              <hr className="divider" /><div style={{ fontWeight: 600, fontSize: 13 }}>Products to Transfer</div>
              <div className="line-items-section">
                {form.lines.map((line, i) => (
                  <div key={i} className="line-item-row">
                    <select className="form-control" value={line.product} onChange={e => updateLine(i, 'product', e.target.value)} required>
                      <option value="">Select product</option>{products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                    </select>
                    <input className="form-control" type="number" min={1} value={line.quantity} onChange={e => updateLine(i, 'quantity', e.target.value)} style={{ width: 90 }} />
                    {form.lines.length > 1 && <button type="button" className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)' }} onClick={() => removeLine(i)}><MdClose /></button>}
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm" onClick={addLine} style={{ alignSelf: 'flex-start' }}><MdAdd /> Add Line</button>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Transfer'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
