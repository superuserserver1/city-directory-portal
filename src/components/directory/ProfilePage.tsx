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
  Loader2, Building2, MessageSquare, Pencil, Check, X,
} from 'lucide-react';
import type { User as UserType } from '@/types';

export function ProfilePage() {
  const { user, setUser, currentView } = useAppStore();
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<{ enquiries: number; businesses: number }>({ enquiries: 0, businesses: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch user stats
  useEffect(() => {
    if (!user) return;
    setLoadingStats(true);
    // For business owners, count their businesses
    if (user.role === 'BUSINESS_OWNER' || user.role === 'ADMIN') {
      api.get<{ businesses: { id: string }[] }>('/api/businesses?limit=1')
        .then(() => {
          // We use the stats API for a proper count
          api.get<{ totalBusinesses: number; totalEnquiries: number }>('/api/stats')
            .then((s) => {
              setStats({ enquiries: s.totalEnquiries || 0, businesses: s.totalBusinesses || 0 });
            })
            .catch(() => {})
            .finally(() => setLoadingStats(false));
        })
        .catch(() => setLoadingStats(false));
    } else {
      setLoadingStats(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in text-center">
        <p className="text-muted-foreground">Please log in to view your profile.</p>
      </div>
    );
  }

  const handleStartEdit = () => {
    setEditName(user.name);
    setEditPhone(user.phone || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      toast.error('Name is required');
      return;
    }
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

  const getBackView = () => {
    if (currentView === 'profile') {
      if (user.role === 'ADMIN') return 'admin-dashboard';
      if (user.role === 'BUSINESS_OWNER') return 'owner-dashboard';
      return 'visitor-dashboard';
    }
    return 'home';
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
      case 'ADMIN': return 'Admin';
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

  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-6"
        onClick={() => useAppStore.getState().setView(getBackView())}
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Dashboard
      </Button>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <CardTitle className="text-xl">{user.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Mail className="h-3.5 w-3.5" /> {user.email}
                </CardDescription>
              </div>
            </div>
            <Badge className={`gap-1.5 shrink-0 ${getRoleColor()}`}>
              {getRoleIcon()}
              {getRoleLabel()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium truncate">{user.phone || 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Joined</p>
                <p className="text-sm font-medium truncate">{joinDate}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Stats */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Account Statistics</h3>
            {loadingStats ? (
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Enquiries</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.enquiries}</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Businesses</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.businesses}</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Edit Form */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Edit Profile</h3>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={handleStartEdit} className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                <div className="space-y-1.5">
                  <Label htmlFor="profile-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="profile-name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="pl-9"
                      placeholder="Your full name"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="profile-phone"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="pl-9"
                      placeholder="Your phone number"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
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
              <p className="text-sm text-muted-foreground">
                Click &quot;Edit&quot; to update your name and phone number.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}