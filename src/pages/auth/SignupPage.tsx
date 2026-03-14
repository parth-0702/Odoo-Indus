import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Layers, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

const schema = z
  .object({
    loginId: z.string().min(6, 'Min 6 chars').max(12, 'Max 12 chars'),
    email: z.string().email('Invalid email'),
    fullName: z.string().min(2, 'Full name required'),
    password: z
      .string()
      .min(8, 'Min 8 characters')
      .regex(/[A-Z]/, 'Must contain uppercase')
      .regex(/[a-z]/, 'Must contain lowercase')
      .regex(/[0-9]/, 'Must contain number')
      .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');

    try {
      await api.auth.signup({
        loginId: data.loginId,
        email: data.email,
        fullName: data.fullName,
        password: data.password,
      });
      navigate('/login');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-xl font-semibold text-foreground mb-1">Create account</h1>
          <p className="text-muted-foreground text-sm mb-6">Join CoreInventory today</p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label className="text-foreground text-sm mb-1.5 block">Full Name</Label>
              <Input {...register('fullName')} placeholder="John Doe" className="bg-input border-border text-foreground placeholder:text-muted-foreground" />
              {errors.fullName && <p className="text-destructive text-xs mt-1">{errors.fullName.message}</p>}
            </div>
            <div>
              <Label className="text-foreground text-sm mb-1.5 block">
                Login ID <span className="text-muted-foreground">(6-12 chars)</span>
              </Label>
              <Input {...register('loginId')} placeholder="johndoe" className="bg-input border-border text-foreground placeholder:text-muted-foreground" />
              {errors.loginId && <p className="text-destructive text-xs mt-1">{errors.loginId.message}</p>}
            </div>
            <div>
              <Label className="text-foreground text-sm mb-1.5 block">Email</Label>
              <Input {...register('email')} type="email" placeholder="john@company.com" className="bg-input border-border text-foreground placeholder:text-muted-foreground" />
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label className="text-foreground text-sm mb-1.5 block">Password</Label>
              <div className="relative">
                <Input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min 8 chars, upper, lower, number, special"
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <Label className="text-foreground text-sm mb-1.5 block">Confirm Password</Label>
              <Input {...register('confirmPassword')} type="password" placeholder="Repeat password" className="bg-input border-border text-foreground placeholder:text-muted-foreground" />
              {errors.confirmPassword && <p className="text-destructive text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground font-medium">
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-muted-foreground text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
