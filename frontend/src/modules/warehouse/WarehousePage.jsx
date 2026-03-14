import { useEffect, useState } from 'react';
import { getWarehousesApi, createWarehouseApi, addLocationApi, deleteLocationApi } from '../../api/warehouse.api';
import { toast } from 'react-toastify';
import { MdAdd, MdDelete, MdWarehouse, MdLocationOn } from 'react-icons/md';

export default function WarehousePage() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWHModal, setShowWHModal] = useState(false);
  const [showLocModal, setShowLocModal] = useState(null); // warehouseId
  const [whForm, setWhForm] = useState({ name: '', code: '', address: '' });
  const [locForm, setLocForm] = useState({ name: '', type: 'rack' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const res = await getWarehousesApi(); setWarehouses(res.data.warehouses); }
    catch { toast.error('Failed to load'); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const createWH = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await createWarehouseApi(whForm); toast.success('Warehouse created'); setShowWHModal(false); setWhForm({ name: '', code: '', address: '' }); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); } finally { setSaving(false); }
  };

  const addLoc = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await addLocationApi(showLocModal, locForm); toast.success('Location added'); setShowLocModal(null); setLocForm({ name: '', type: 'rack' }); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); } finally { setSaving(false); }
  };

  const deleteLoc = async (warehouseId, locationId) => {
    if (!window.confirm('Delete this location?')) return;
    try { await deleteLocationApi(warehouseId, locationId); toast.success('Location deleted'); load(); }
    catch { toast.error('Error'); }
  };

  const locTypeColors = { rack: 'var(--info)', area: 'var(--success)', zone: 'var(--warning)', other: 'var(--text-muted)' };

  return (
    <div>
      <div className="page-header">
        <div><h2 className="page-title">Warehouse & Locations</h2><p className="page-subtitle">Manage your warehouses and internal storage locations</p></div>
        <button className="btn btn-primary" onClick={() => setShowWHModal(true)}><MdAdd /> Add Warehouse</button>
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div>
        : warehouses.length === 0 ? (
          <div className="empty-state card"><div className="empty-state-icon"><MdWarehouse /></div><p>No warehouses yet. Create your first one!</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {warehouses.map((w) => (
              <div key={w._id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, background: 'var(--primary-bg)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: 20 }}>
                      <MdWarehouse />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{w.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Code: <strong>{w.code}</strong> {w.address && `• ${w.address}`}</div>
                    </div>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowLocModal(w._id)}><MdAdd /> Add Location</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {w.locations?.length === 0 ? (
                    <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 13, color: 'var(--text-muted)' }}>No locations yet</div>
                  ) : w.locations.map((loc) => (
                    <div key={loc._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }}>
                      <MdLocationOn style={{ color: locTypeColors[loc.type], fontSize: 16 }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{loc.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{loc.type}</div>
                      </div>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)', marginLeft: 4 }} onClick={() => deleteLoc(w._id, loc._id)}><MdDelete /></button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Warehouse Modal */}
      {showWHModal && (
        <div className="modal-overlay" onClick={() => setShowWHModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">New Warehouse</h3><button className="modal-close" onClick={() => setShowWHModal(false)}>×</button></div>
            <form onSubmit={createWH} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group"><label className="form-label">Warehouse Name *</label><input className="form-control" value={whForm.name} onChange={e => setWhForm({ ...whForm, name: e.target.value })} required placeholder="e.g. Main Warehouse" /></div>
              <div className="form-group"><label className="form-label">Code *</label><input className="form-control" value={whForm.code} onChange={e => setWhForm({ ...whForm, code: e.target.value })} required placeholder="e.g. WH-A" /></div>
              <div className="form-group"><label className="form-label">Address</label><input className="form-control" value={whForm.address} onChange={e => setWhForm({ ...whForm, address: e.target.value })} placeholder="Optional address" /></div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}><button type="button" className="btn btn-secondary" onClick={() => setShowWHModal(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Warehouse'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocModal && (
        <div className="modal-overlay" onClick={() => setShowLocModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Add Location</h3><button className="modal-close" onClick={() => setShowLocModal(null)}>×</button></div>
            <form onSubmit={addLoc} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group"><label className="form-label">Location Name *</label><input className="form-control" value={locForm.name} onChange={e => setLocForm({ ...locForm, name: e.target.value })} required placeholder="e.g. Rack A, Zone B" /></div>
              <div className="form-group"><label className="form-label">Type</label>
                <select className="form-control" value={locForm.type} onChange={e => setLocForm({ ...locForm, type: e.target.value })}>
                  {['rack', 'area', 'zone', 'other'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select></div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}><button type="button" className="btn btn-secondary" onClick={() => setShowLocModal(null)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Adding...' : 'Add Location'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
