import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { db, hashPassword } from '@/lib/db';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, KeyRound, CheckCircle, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const [searchParams] = useSearchParams();
  const { user, login } = useAuthStore();
  const defaultTab = searchParams.get('tab') === 'password' ? 'password' : 'profile';

  const [profile, setProfile] = useState({ fullName: user?.fullName ?? '', email: user?.email ?? '' });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const saveProfile = async () => {
    if (!user?.id) return;
    await db.users.update(user.id, { fullName: profile.fullName, email: profile.email });
    login({ ...user, fullName: profile.fullName, email: profile.email });
    setMsg({ type: 'success', text: 'Profile updated successfully.' });
    setTimeout(() => setMsg(null), 3000);
  };

  const savePassword = async () => {
    if (!user?.id) return;
    const u = await db.users.get(user.id);
    if (!u || u.passwordHash !== hashPassword(passwords.current)) {
      setMsg({ type: 'error', text: 'Current password is incorrect.' }); return;
    }
    if (passwords.newPass.length < 8) { setMsg({ type: 'error', text: 'New password must be at least 8 characters.' }); return; }
    if (passwords.newPass !== passwords.confirm) { setMsg({ type: 'error', text: "Passwords don't match." }); return; }
    await db.users.update(user.id, { passwordHash: hashPassword(passwords.newPass) });
    setPasswords({ current: '', newPass: '', confirm: '' });
    setMsg({ type: 'success', text: 'Password changed successfully.' });
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-xl">
      <PageHeader title="My Profile" subtitle="Manage your account settings" />

      {msg && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-success/10 border border-success/20 text-success' : 'bg-destructive/10 border border-destructive/20 text-destructive'}`}>
          {msg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      {/* Avatar */}
      <div className="card-elevated rounded-xl p-4 flex items-center gap-4">
        <div className="w-14 h-14 gradient-primary rounded-full flex items-center justify-center shrink-0">
          <span className="text-primary-foreground text-xl font-bold">{user?.fullName?.charAt(0) ?? 'U'}</span>
        </div>
        <div>
          <p className="text-foreground font-semibold">{user?.fullName}</p>
          <p className="text-muted-foreground text-sm">{user?.email}</p>
          <p className="text-primary text-xs capitalize mt-0.5">{user?.role}</p>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="profile" className="data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground gap-2">
            <User className="w-3.5 h-3.5" /> Profile
          </TabsTrigger>
          <TabsTrigger value="password" className="data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground gap-2">
            <KeyRound className="w-3.5 h-3.5" /> Password
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="card-elevated rounded-xl p-5 space-y-4">
            <div>
              <Label className="text-foreground text-sm mb-1.5 block">Full Name</Label>
              <Input value={profile.fullName} onChange={e => setProfile(f => ({ ...f, fullName: e.target.value }))} className="bg-input border-border text-foreground" />
            </div>
            <div>
              <Label className="text-foreground text-sm mb-1.5 block">Email</Label>
              <Input value={profile.email} onChange={e => setProfile(f => ({ ...f, email: e.target.value }))} type="email" className="bg-input border-border text-foreground" />
            </div>
            <div>
              <Label className="text-foreground text-sm mb-1.5 block">Login ID</Label>
              <Input value={user?.loginId} disabled className="bg-muted border-border text-muted-foreground" />
            </div>
            <div>
              <Label className="text-foreground text-sm mb-1.5 block">Role</Label>
              <Input value={user?.role} disabled className="bg-muted border-border text-muted-foreground capitalize" />
            </div>
            <Button onClick={saveProfile} className="gradient-primary text-primary-foreground">Save Changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="password">
          <div className="card-elevated rounded-xl p-5 space-y-4">
            <div>
              <Label className="text-foreground text-sm mb-1.5 block">Current Password</Label>
              <Input type="password" value={passwords.current} onChange={e => setPasswords(f => ({ ...f, current: e.target.value }))} className="bg-input border-border text-foreground" />
            </div>
            <div>
              <Label className="text-foreground text-sm mb-1.5 block">New Password</Label>
              <Input type="password" value={passwords.newPass} onChange={e => setPasswords(f => ({ ...f, newPass: e.target.value }))} className="bg-input border-border text-foreground" />
            </div>
            <div>
              <Label className="text-foreground text-sm mb-1.5 block">Confirm New Password</Label>
              <Input type="password" value={passwords.confirm} onChange={e => setPasswords(f => ({ ...f, confirm: e.target.value }))} className="bg-input border-border text-foreground" />
            </div>
            <Button onClick={savePassword} className="gradient-primary text-primary-foreground">Change Password</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
