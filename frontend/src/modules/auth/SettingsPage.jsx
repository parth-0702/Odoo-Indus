export default function SettingsPage() {
  return (
    <div>
      <div className="page-header"><div><h2 className="page-title">Settings</h2><p className="page-subtitle">System configuration and preferences</p></div></div>
      <div className="card" style={{ maxWidth: 500 }}>
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>General Settings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group"><label className="form-label">Company Name</label><input className="form-control" defaultValue="CoreInventory Corp" /></div>
          <div className="form-group"><label className="form-label">Default Currency</label><select className="form-control"><option>USD</option><option>EUR</option><option>GBP</option><option>INR</option></select></div>
          <div className="form-group"><label className="form-label">Low Stock Threshold</label><input className="form-control" type="number" defaultValue={10} /></div>
          <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Save Settings</button>
        </div>
      </div>
    </div>
  );
}
