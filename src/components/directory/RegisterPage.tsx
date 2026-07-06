'use client';

import { useState } from 'react';
import { Mail, Lock, Loader2, MapPin, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store/app-store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { User as UserType } from '@/types';

export function RegisterPage() {
  const { login, setView } = useAppStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<string>('VISITOR');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ user: UserType; token: string }>('/api/auth/register', {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        role,
      });
      login(res.user, res.token);
      toast.success(`Welcome, ${res.user.name}! Account created successfully.`);

      if (res.user.role === 'ADMIN') setView('admin-dashboard');
      else if (res.user.role === 'BUSINESS_OWNER') setView('owner-dashboard');
      else setView('home');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <MapPin className="h-7 w-7 text-primary" />
            <span className="text-2xl font-bold">CityDir</span>
          </div>
          <p className="text-sm text-muted-foreground">Create your account</p>
        </div>

        <Card>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Create Account</CardTitle>
            <CardDescription>Join the city directory community</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reg-name">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reg-name"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9"
                    autoComplete="name"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    autoComplete="email"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reg-phone"
                    type="tel"
                    placeholder="Your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-9"
                    autoComplete="tel"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-role">Account Type</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VISITOR">Visitor - I want to browse</SelectItem>
                    <SelectItem value="BUSINESS_OWNER">Business Owner - I want to list my business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-confirm">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reg-confirm"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-4">
              <Separator />
              <p className="text-center text-sm text-muted-foreground mt-4">
                Already have an account?{' '}
                <button
                  onClick={() => setView('login')}
                  className="text-primary font-medium hover:underline"
                >
                  Sign In
                </button>
              </p>
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView('home')}
              className="text-muted-foreground"
            >
              Back to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}