import { useEffect, useState } from 'react';
import { getDashboardStatsApi } from '../../api/dashboard.api';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

const KPICard = ({ label, value, icon, color, bg, onClick }) => (
  <div className="kpi-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
    <div className="kpi-icon" style={{ background: bg, color }}>
      {icon}
    </div>
    <div>
      <div className="kpi-value" style={{ color }}>{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  </div>
);

const movementTypeColor = { receipt: 'var(--success)', delivery: 'var(--danger)', transfer: 'var(--info)', adjustment: 'var(--warning)' };
const movementTypeLabel = { receipt: 'Receipt', delivery: 'Delivery', transfer: 'Transfer', adjustment: 'Adjustment' };

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getDashboardStatsApi();
        setStats(res.data);
      } catch (e) {
        console.error(e);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  // Process chart data
  const chartData = (() => {
    if (!stats?.movementsByMonth) return [];
    const map = {};
    stats.movementsByMonth.forEach(({ _id, count }) => {
      const key = `${months[_id.month - 1]} ${_id.year}`;
      if (!map[key]) map[key] = { name: key, receipt: 0, delivery: 0, transfer: 0, adjustment: 0 };
      map[key][_id.type] = count;
    });
    return Object.values(map);
  })();

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const s = stats?.stats || {};
  const kpis = [
    { label: 'Total Products', value: s.totalProducts ?? 0, icon: '📦', color: 'var(--primary)', bg: 'var(--primary-bg)', path: '/products' },
    { label: 'Low Stock Items', value: s.lowStock ?? 0, icon: '⚠️', color: 'var(--warning)', bg: 'var(--warning-bg)', path: '/products' },
    { label: 'Out of Stock', value: s.outOfStock ?? 0, icon: '🚨', color: 'var(--danger)', bg: 'var(--danger-bg)', path: '/products' },
    { label: 'Pending Receipts', value: s.pendingReceipts ?? 0, icon: '📥', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', path: '/receipts' },
    { label: 'Pending Deliveries', value: s.pendingDeliveries ?? 0, icon: '📤', color: 'var(--info)', bg: 'var(--info-bg)', path: '/deliveries' },
    { label: 'Pending Transfers', value: s.pendingTransfers ?? 0, icon: '🔄', color: 'var(--success)', bg: 'var(--success-bg)', path: '/transfers' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Real-time inventory overview and operations summary</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => navigate('/receipts')}>+ New Receipt</button>
          <button className="btn btn-secondary" onClick={() => navigate('/deliveries')}>+ New Delivery</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        {kpis.map((k) => (
          <KPICard key={k.label} {...k} onClick={() => navigate(k.path)} />
        ))}
      </div>

      {/* Charts + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        {/* Movement Chart */}
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Stock Movement Trends</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Last 6 months of inventory operations</div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} barSize={18} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
                  cursor={{ fill: 'rgba(79,70,229,0.05)' }}
                />
                <Bar dataKey="receipt" name="Receipts" fill="var(--success)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="delivery" name="Deliveries" fill="var(--danger)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="transfer" name="Transfers" fill="var(--info)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="adjustment" name="Adjustments" fill="var(--warning)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <div className="empty-state-icon">📊</div>
              <p>No movement data yet. Start by creating receipts and deliveries.</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Recent Activity</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Latest stock movements</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 300, overflowY: 'auto' }}>
            {stats?.recentMovements?.length > 0 ? stats.recentMovements.map((m) => (
              <div key={m._id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${movementTypeColor[m.type]}20`, color: movementTypeColor[m.type], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                  {m.type === 'receipt' ? '↑' : m.type === 'delivery' ? '↓' : m.type === 'transfer' ? '⇄' : '≈'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: movementTypeColor[m.type] }}>{movementTypeLabel[m.type]}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.product?.name || 'Unknown Product'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {m.quantityChange > 0 ? '+' : ''}{m.quantityChange} units
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                  {new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            )) : (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <div style={{ fontSize: 32 }}>📋</div>
                <p style={{ fontSize: 13 }}>No activity yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ fontWeight: 700, marginBottom: 16 }}>Quick Actions</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: '+ Add Product', path: '/products', color: 'btn-primary' },
            { label: '+ New Receipt', path: '/receipts', color: 'btn-secondary' },
            { label: '+ New Delivery', path: '/deliveries', color: 'btn-secondary' },
            { label: '+ New Transfer', path: '/transfers', color: 'btn-secondary' },
            { label: '+ Adjust Stock', path: '/adjustments', color: 'btn-secondary' },
            { label: 'View Move History', path: '/movements', color: 'btn-ghost' },
          ].map((a) => (
            <button key={a.label} className={`btn ${a.color}`} onClick={() => navigate(a.path)}>{a.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
