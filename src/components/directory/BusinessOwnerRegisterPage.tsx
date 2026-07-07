'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Eye, EyeOff, Loader2, Building2, MessageSquare, BarChart3, ShieldCheck, Rocket } from 'lucide-react';
import type { User } from '@/types';

const BENEFITS = [
  { icon: Building2, title: 'List Your Business', desc: 'Showcase your products & services to thousands of visitors' },
  { icon: MessageSquare, title: 'Manage Enquiries', desc: 'Receive and respond to customer enquiries in real-time' },
  { icon: BarChart3, title: 'Track Performance', desc: 'Monitor views, enquiries, and business growth' },
  { icon: ShieldCheck, title: 'Get Verified', desc: 'Build trust with a verified badge on your listing' },
];

export function BusinessOwnerRegisterPage() {
  const { setView, login } = useAppStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      const data = await api.post<{ user: User; token: string }>('/api/auth/register', {
        name,
        email,
        phone,
        password,
        role: 'BUSINESS_OWNER',
      });
      login(data.user, data.token);
      toast.success('Account created! Welcome to your dashboard.');
      if (businessName.trim()) {
        sessionStorage.setItem('citydir_business_intent', businessName.trim());
      }
      setView('owner-dashboard');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left - Benefits */}
        <div className="hidden lg:block order-1">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Rocket className="h-4 w-4" /> For Business Owners
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-3">
              Grow Your Business with CityDir
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Join hundreds of businesses in our directory. Reach more customers and grow your online presence.
            </p>
          </div>
          <div className="space-y-4">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">{title}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right - Registration Form */}
        <Card className="border-border/50 shadow-xl order-2">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-3 p-2.5 rounded-xl bg-primary">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Register as Business Owner</CardTitle>
            <CardDescription>Create your account and start listing your business</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="owner-name">Full Name *</Label>
                <Input
                  id="owner-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="owner-email">Email *</Label>
                <Input
                  id="owner-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="owner-phone">Phone</Label>
                <Input
                  id="owner-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="owner-biz">Business Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="owner-biz"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Sunrise Cafe"
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">Pre-fills the listing form for you</p>
              </div>
              <div>
                <Label htmlFor="owner-password">Password *</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="owner-password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="owner-confirm">Confirm Password *</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="owner-confirm"
                    type={showPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Building2 className="h-4 w-4 mr-2" />
                    Create Account & Add Business
                  </>
                )}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <button
                onClick={() => setView('login')}
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </button>
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-3" onClick={() => setView('home')}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Home
            </Button>
          </CardContent>
        </Card>

        {/* Mobile Benefits - show on small screens below form */}
        <div className="lg:hidden order-3">
          <h3 className="font-semibold text-lg mb-3 text-center">Why join CityDir?</h3>
          <div className="grid grid-cols-2 gap-3">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-3 rounded-xl bg-muted/50 text-center">
                <div className="p-2 rounded-lg bg-primary/10 text-primary w-fit mx-auto mb-2">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-medium text-xs">{title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}