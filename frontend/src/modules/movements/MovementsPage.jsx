import { useEffect, useState } from 'react';
import { getMovementsApi } from '../../api/movements.api';
import { toast } from 'react-toastify';

const typeConfig = {
  receipt: { label: 'Receipt', icon: '↑', color: 'var(--success)', bg: 'rgba(16,185,129,0.1)' },
  delivery: { label: 'Delivery', icon: '↓', color: 'var(--danger)', bg: 'rgba(239,68,68,0.1)' },
  transfer: { label: 'Transfer', icon: '⇄', color: 'var(--info)', bg: 'rgba(59,130,246,0.1)' },
  adjustment: { label: 'Adjustment', icon: '≈', color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)' },
};

export default function MovementsPage() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (typeFilter) params.type = typeFilter;
      const res = await getMovementsApi(params);
      setMovements(res.data.movements);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load movements'); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [typeFilter, page]);

  return (
    <div>
      <div className="page-header">
        <div><h2 className="page-title">Move History</h2><p className="page-subtitle">Complete stock ledger — every movement recorded</p></div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{total} total records</div>
      </div>

      <div className="filters-bar">
        {[{ val: '', label: 'All Movements' }, { val: 'receipt', label: '↑ Receipts' }, { val: 'delivery', label: '↓ Deliveries' }, { val: 'transfer', label: '⇄ Transfers' }, { val: 'adjustment', label: '≈ Adjustments' }].map(f => (
          <button key={f.val} className={`btn btn-sm ${typeFilter === f.val ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setTypeFilter(f.val); setPage(1); }}>{f.label}</button>
        ))}
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr><th>Date</th><th>Type</th><th>Reference</th><th>Product</th><th>From</th><th>To</th><th>Qty Change</th><th>Note</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
              : movements.length === 0 ? <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon">📋</div><p>No movements found</p></div></td></tr>
              : movements.map((m) => {
                const cfg = typeConfig[m.type] || typeConfig.receipt;
                return (
                  <tr key={m._id}>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(m.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 6, background: cfg.bg, color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{cfg.icon}</div>
                        <span style={{ color: cfg.color, fontWeight: 600, fontSize: 12 }}>{cfg.label}</span>
                      </div>
                    </td>
                    <td><code style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>{m.referenceNumber || '—'}</code></td>
                    <td><div style={{ fontWeight: 500 }}>{m.product?.name || '—'}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.product?.sku}</div></td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.fromWarehouse?.name ? `${m.fromWarehouse.name} › ${m.fromLocation}` : '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.toWarehouse?.name ? `${m.toWarehouse.name} › ${m.toLocation}` : '—'}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: m.quantityChange > 0 ? 'var(--success)' : m.quantityChange < 0 ? 'var(--danger)' : 'var(--text-muted)', fontSize: 15 }}>
                        {m.quantityChange > 0 ? '+' : ''}{m.quantityChange}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.note || '—'}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > limit && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, justifyContent: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Page {page} of {Math.ceil(total / limit)}</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / limit)}>Next →</button>
        </div>
      )}
    </div>
  );
}
