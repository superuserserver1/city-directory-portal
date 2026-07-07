'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, LogIn, UserPlus, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import type { User } from '@/types';

export function LoginPage() {
  const { setView, login } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post<{ user: User; token: string }>('/api/auth/login', { email, password });
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);
      if (data.user.role === 'ADMIN') setView('admin-dashboard');
      else if (data.user.role === 'BUSINESS_OWNER') setView('owner-dashboard');
      else setView('home');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 p-2.5 rounded-xl bg-primary">
            <LogIn className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to your CityDir account</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password" type={showPass ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" required
                />
                <button
                  type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><LogIn className="h-4 w-4 mr-2" /> Sign In</>}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <button onClick={() => setView('register')} className="text-primary font-medium hover:underline">
              Register now
            </button>
          </div>
          <Button variant="ghost" size="sm" className="w-full mt-3" onClick={() => setView('home')}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function RegisterPage() {
  const { setView, login } = useAppStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'VISITOR' | 'BUSINESS_OWNER'>('VISITOR');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post<{ user: User; token: string }>('/api/auth/register', {
        name, email, phone, password, role,
      });
      login(data.user, data.token);
      toast.success(`Account created! Welcome, ${data.user.name}!`);
      if (data.user.role === 'BUSINESS_OWNER') setView('owner-dashboard');
      else setView('home');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 p-2.5 rounded-xl bg-primary">
            <UserPlus className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Join CityDir today</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Toggle */}
            <div className="flex rounded-lg border overflow-hidden">
              <button
                type="button"
                onClick={() => setRole('VISITOR')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  role === 'VISITOR' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Visitor
              </button>
              <button
                type="button"
                onClick={() => setRole('BUSINESS_OWNER')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  role === 'BUSINESS_OWNER' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Business Owner
              </button>
            </div>
            <div>
              <Label htmlFor="reg-name">Full Name *</Label>
              <Input id="reg-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="reg-email">Email *</Label>
              <Input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="reg-phone">Phone</Label>
              <Input id="reg-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="reg-password">Password *</Label>
              <div className="relative mt-1.5">
                <Input
                  id="reg-password" type={showPass ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6}
                />
                <button
                  type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4 mr-2" /> Create Account</>}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <button onClick={() => setView('login')} className="text-primary font-medium hover:underline">
              Sign in
            </button>
          </div>
          <Button variant="ghost" size="sm" className="w-full mt-3" onClick={() => setView('home')}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}