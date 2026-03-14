import { useAuth } from '../../context/AuthContext';
export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <div>
      <div className="page-header"><div><h2 className="page-title">Profile</h2><p className="page-subtitle">Your account information</p></div></div>
      <div className="card" style={{ maxWidth: 500 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div style={{ width: 72, height: 72, background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: 'white' }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 20 }}>{user?.name}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{user?.email}</div>
            <span className="badge badge-done" style={{ marginTop: 6 }}>{user?.role}</span>
          </div>
        </div>
        <hr className="divider" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-group"><label className="form-label">Name</label><input className="form-control" defaultValue={user?.name} readOnly /></div>
          <div className="form-group"><label className="form-label">Email</label><input className="form-control" defaultValue={user?.email} readOnly /></div>
          <div className="form-group"><label className="form-label">Role</label><input className="form-control" defaultValue={user?.role} readOnly /></div>
        </div>
      </div>
    </div>
  );
}
