'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  ArrowLeft, User, Mail, Phone, Calendar, Shield, Briefcase, Eye,
  Loader2, Building2, MessageSquare, Pencil, Check, X, Lock,
  Key, Star, Heart, AlertCircle, CheckCircle2, Clock,
} from 'lucide-react';
import type { User as UserType } from '@/types';

export function ProfilePage() {
  const { user, setUser, currentView, setView } = useAppStore();

  // Edit profile
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Password change
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);

  // Stats
  const [stats, setStats] = useState({ enquiries: 0, businesses: 0, reviews: 0, favorites: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoadingStats(true);
    if (user.role === 'BUSINESS_OWNER' || user.role === 'ADMIN') {
      api.get<{ totalBusinesses: number; totalEnquiries: number }>('/api/stats')
        .then((s) => {
          setStats({ enquiries: s.totalEnquiries || 0, businesses: s.totalBusinesses || 0, reviews: 0, favorites: 0 });
        })
        .catch(() => {})
        .finally(() => setLoadingStats(false));
    } else {
      setLoadingStats(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in text-center">
        <p className="text-muted-foreground">Please log in to view your profile.</p>
      </div>
    );
  }

  const handleStartEdit = () => {
    setEditName(user.name);
    setEditPhone(user.phone || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => setIsEditing(false);

  const handleSave = async () => {
    if (!editName.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const res = await api.put<{ user: UserType }>('/api/auth/me', {
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
      });
      setUser(res.user);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw) { toast.error('All fields are required'); return; }
    if (newPw.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    if (newPw !== confirmPw) { toast.error('New passwords do not match'); return; }
    setChangingPw(true);
    try {
      await api.put('/api/auth/change-password', { currentPassword: currentPw, newPassword: newPw });
      toast.success('Password changed successfully');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setShowPwForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setChangingPw(false);
    }
  };

  const getBackView = () => {
    if (user.role === 'ADMIN') return 'admin-dashboard';
    if (user.role === 'BUSINESS_OWNER') return 'owner-dashboard';
    return 'visitor-dashboard';
  };

  const getRoleIcon = () => {
    switch (user.role) {
      case 'ADMIN': return <Shield className="h-5 w-5" />;
      case 'BUSINESS_OWNER': return <Briefcase className="h-5 w-5" />;
      default: return <Eye className="h-5 w-5" />;
    }
  };
  const getRoleLabel = () => {
    switch (user.role) {
      case 'ADMIN': return 'Administrator';
      case 'BUSINESS_OWNER': return 'Business Owner';
      default: return 'Visitor';
    }
  };
  const getRoleColor = () => {
    switch (user.role) {
      case 'ADMIN': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'BUSINESS_OWNER': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      default: return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400';
    }
  };

  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const lastUpdated = new Date(user.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Password strength indicator
  const pwStrength = (() => {
    if (!newPw) return { level: 0, label: '', color: '' };
    let score = 0;
    if (newPw.length >= 6) score++;
    if (newPw.length >= 10) score++;
    if (/[A-Z]/.test(newPw)) score++;
    if (/[0-9]/.test(newPw)) score++;
    if (/[^A-Za-z0-9]/.test(newPw)) score++;
    if (score <= 2) return { level: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { level: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score <= 4) return { level: 3, label: 'Good', color: 'bg-emerald-500' };
    return { level: 4, label: 'Strong', color: 'bg-teal-600' };
  })();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      {/* Back Button */}
      <Button variant="ghost" size="sm" className="mb-6" onClick={() => setView(getBackView())}>
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Dashboard
      </Button>

      {/* Profile Header Card */}
      <Card className="overflow-hidden shadow-sm mb-6">
        <div className="h-24 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 relative">
          <div className="absolute -bottom-10 left-6">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-xl ring-4 ring-background">
              <span className="text-white text-3xl font-bold">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </span>
            </div>
          </div>
        </div>
        <CardHeader className="pt-14 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">{user.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1.5">
                <Mail className="h-3.5 w-3.5" /> {user.email}
              </CardDescription>
            </div>
            <Badge className={`gap-1.5 shrink-0 self-start ${getRoleColor()}`}>
              {getRoleIcon()} {getRoleLabel()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium truncate">{user.phone || 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Member Since</p>
                <p className="text-sm font-medium truncate">{joinDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium truncate">{lastUpdated}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Edit Profile */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" /> Personal Information
                </CardTitle>
                <CardDescription className="mt-1">Update your name and phone number</CardDescription>
              </div>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={handleStartEdit} className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="profile-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="profile-name" value={editName} onChange={(e) => setEditName(e.target.value)} className="pl-9" placeholder="Your full name" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="profile-phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="pl-9" placeholder="Your phone number" />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit} className="gap-1.5">
                    <X className="h-4 w-4" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="text-sm font-medium">{user.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">{user.phone || 'Not set'}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" /> Security
                </CardTitle>
                <CardDescription className="mt-1">Manage your account password</CardDescription>
              </div>
              {!showPwForm && (
                <Button variant="outline" size="sm" onClick={() => setShowPwForm(true)} className="gap-1.5">
                  <Key className="h-3.5 w-3.5" /> Change
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {showPwForm ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="current-pw">Current Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="current-pw" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="pl-9" placeholder="Enter current password" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-pw">New Password *</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="new-pw" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="pl-9" placeholder="Min 6 characters" />
                  </div>
                  {newPw && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= pwStrength.level ? pwStrength.color : 'bg-muted'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{pwStrength.label}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pw">Confirm New Password *</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="confirm-pw" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="pl-9" placeholder="Repeat new password" />
                  </div>
                  {confirmPw && newPw !== confirmPw && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" /> Passwords do not match
                    </p>
                  )}
                  {confirmPw && newPw === confirmPw && confirmPw.length > 0 && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                      <CheckCircle2 className="h-3 w-3" /> Passwords match
                    </p>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleChangePassword} disabled={changingPw || !currentPw || !newPw || newPw !== confirmPw} className="gap-1.5">
                    {changingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Update Password
                  </Button>
                  <Button variant="outline" onClick={() => { setShowPwForm(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }} className="gap-1.5">
                    <X className="h-4 w-4" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center mb-4">
                  <Shield className="h-8 w-8 text-primary/60" />
                </div>
                <p className="text-sm font-medium">Your account is secured</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Click &quot;Change&quot; to update your password. We recommend using a strong, unique password.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Account Stats */}
      {(user.role === 'BUSINESS_OWNER' || user.role === 'ADMIN') && (
        <Card className="shadow-sm mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" /> Account Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <span className="text-xs text-muted-foreground">Businesses</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.businesses}</p>
                </div>
                <div className="p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <span className="text-xs text-muted-foreground">Enquiries</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.enquiries}</p>
                </div>
                <div className="p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                      <Star className="h-4 w-4" />
                    </div>
                    <span className="text-xs text-muted-foreground">Reviews</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.reviews}</p>
                </div>
                <div className="p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                      <Heart className="h-4 w-4" />
                    </div>
                    <span className="text-xs text-muted-foreground">Favorites</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.favorites}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}