import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layers, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Step = 'email' | 'otp' | 'reset';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }

    // Dexie has been removed; server-driven reset flow is not implemented yet.
    // For now we keep a demo-only OTP flow so the UI does not crash.
    setLoading(true);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setStep('otp');
    setError('');
    setLoading(false);

    setTimeout(() => alert(`Demo OTP (would be emailed): ${code}`), 100);
  };

  const handleOtpSubmit = () => {
    if (otp !== generatedOtp) {
      setError('Invalid OTP');
      return;
    }
    setStep('reset');
    setError('');
  };

  const handleReset = async () => {
    if (newPassword.length < 8) {
      setError('Min 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    // Placeholder: implement server endpoint to update password securely.
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/login');
    }, 250);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">CoreInventory</span>
        </div>

        <div className="card-elevated rounded-xl p-8">
          <Link to="/login" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {step === 'email' && (
            <>
              <h1 className="text-xl font-semibold text-foreground mb-1">Reset Password</h1>
              <p className="text-muted-foreground text-sm mb-6">Enter your email to receive an OTP</p>
              <div className="space-y-4">
                <div>
                  <Label className="text-foreground text-sm mb-1.5 block">Email</Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="your@email.com"
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <Button onClick={handleEmailSubmit} disabled={loading} className="w-full gradient-primary text-primary-foreground">
                  {loading ? 'Sending...' : 'Send OTP'}
                </Button>
              </div>
            </>
          )}

          {step === 'otp' && (
            <>
              <h1 className="text-xl font-semibold text-foreground mb-1">Verify OTP</h1>
              <p className="text-muted-foreground text-sm mb-6">Enter the 6-digit OTP sent to your email</p>
              <div className="space-y-4">
                <div>
                  <Label className="text-foreground text-sm mb-1.5 block">OTP Code</Label>
                  <Input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground text-center text-lg tracking-widest"
                  />
                </div>
                <Button onClick={handleOtpSubmit} className="w-full gradient-primary text-primary-foreground">
                  Verify OTP
                </Button>
              </div>
            </>
          )}

          {step === 'reset' && (
            <>
              <h1 className="text-xl font-semibold text-foreground mb-1">New Password</h1>
              <p className="text-muted-foreground text-sm mb-6">Choose a strong new password</p>
              <div className="space-y-4">
                <div>
                  <Label className="text-foreground text-sm mb-1.5 block">New Password</Label>
                  <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" className="bg-input border-border text-foreground" />
                </div>
                <div>
                  <Label className="text-foreground text-sm mb-1.5 block">Confirm Password</Label>
                  <Input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type="password"
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <Button onClick={handleReset} disabled={loading} className="w-full gradient-primary text-primary-foreground">
                  {loading ? 'Saving...' : 'Reset Password'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
