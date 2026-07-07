'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users, Building2, MessageSquare, FolderTree, Map, Plus, Pencil, Trash2,
  ShieldCheck, Star, Eye, CheckCircle2, Clock, XCircle, ArrowLeft,
  TrendingUp, TrendingDown, Shield, Inbox, UserCog, MessageCircle, Settings,
  Check, AlertCircle, Loader2,
} from 'lucide-react';
import { ChatPanel } from './ChatPanel';
import { UserManagement } from './UserManagement';
import { SiteSettingsPage } from './SiteSettingsPage';
import type { DashboardStats, Category, Locality, Business, BusinessWithRelations, User as UserType, EnquiryWithRelations, BusinessStatus } from '@/types';

const STATUS_STYLES: Record<string, { class: string; icon: React.ElementType }> = {
  OPEN: { class: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400', icon: Clock },
  IN_PROGRESS: { class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Eye },
  CLOSED: { class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
};

export function AdminDashboard() {
  const { user, setView } = useAppStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [businesses, setBusinesses] = useState<BusinessWithRelations[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatEnquiry, setChatEnquiry] = useState<EnquiryWithRelations | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const fetchData = async () => {
    const [s, c, l, b, u, eq] = await Promise.all([
      api.get<DashboardStats>('/api/stats'),
      api.get<{ categories: Category[] }>('/api/categories'),
      api.get<{ localities: Locality[] }>('/api/localities'),
      api.get<{ businesses: BusinessWithRelations[] }>('/api/businesses?limit=100'),
      api.get<{ users: UserType[] }>('/api/users'),
      api.get<{ enquiries: EnquiryWithRelations[] }>('/api/enquiries'),
    ]);
    return { s, c, l, b, u, eq };
  };

  useEffect(() => {
    let cancelled = false;
    fetchData()
      .then(({ s, c, l, b, u, eq }) => {
        if (!cancelled) {
          setStats(s); setCategories(c.categories || []); setLocalities(l.localities || []);
          setBusinesses(b.businesses || []); setUsers(u.users || []); setEnquiries(eq.enquiries || []);
          setLoading(false);
        }
      })
      .catch(() => { if (!cancelled) { toast.error('Failed to load dashboard'); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const refresh = () => {
    setLoading(true);
    fetchData()
      .then(({ s, c, l, b, u, eq }) => {
        setStats(s); setCategories(c.categories || []); setLocalities(l.localities || []);
        setBusinesses(b.businesses || []); setUsers(u.users || []); setEnquiries(eq.enquiries || []);
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  };

  const handleVerify = async (id: string, val: boolean) => {
    try {
      await api.put(`/api/businesses/${id}`, { isVerified: val } as Partial<BusinessWithRelations>);
      toast.success(`Business ${val ? 'verified' : 'unverified'}`);
      refresh();
    } catch { toast.error('Failed to update'); }
  };

  const handleFeature = async (id: string, val: boolean) => {
    try {
      await api.put(`/api/businesses/${id}`, { isFeatured: val } as Partial<BusinessWithRelations>);
      toast.success(`Business ${val ? 'featured' : 'unfeatured'}`);
      refresh();
    } catch { toast.error('Failed to update'); }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api.del(`/api/categories/${id}`);
      toast.success('Category deleted');
      refresh();
    } catch { toast.error('Failed to delete'); }
  };

  const handleDeleteLocality = async (id: string) => {
    if (!confirm('Delete this locality?')) return;
    try {
      await api.del(`/api/localities/${id}`);
      toast.success('Locality deleted');
      refresh();
    } catch { toast.error('Failed to delete'); }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.del(`/api/users/${id}`);
      toast.success('User deleted');
      refresh();
    } catch { toast.error('Failed to delete'); }
  };

  const statCardData = stats ? [
    { icon: Users, label: 'Total Users', value: stats.totalUsers, trend: '+12%', trendUp: true, gradient: 'from-teal-500 to-emerald-500' },
    { icon: Building2, label: 'Businesses', value: stats.totalBusinesses, trend: '+8%', trendUp: true, gradient: 'from-emerald-500 to-teal-600' },
    { icon: MessageSquare, label: 'Enquiries', value: stats.totalEnquiries, trend: '-3%', trendUp: false, gradient: 'from-teal-600 to-cyan-600' },
    { icon: FolderTree, label: 'Categories', value: stats.totalCategories, trend: '+2%', trendUp: true, gradient: 'from-emerald-600 to-teal-500' },
    { icon: Map, label: 'Localities', value: stats.totalLocalities, trend: '+5%', trendUp: true, gradient: 'from-cyan-600 to-emerald-600' },
  ] : [];

  return (
    <div className="animate-fade-in">
      <div className="gradient-hero py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-white mb-6">
            <Button variant="secondary" size="sm" className="bg-white/90" onClick={() => setView('home')}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Home
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
          </div>
          {/* Welcome Banner */}
          <div className="rounded-2xl p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />
            <div className="relative flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Welcome back, {user?.name || 'Admin'}!</h2>
                <p className="text-white/70 mt-1">Manage your city directory, monitor enquiries, and verify businesses.</p>
              </div>
              <div className="hidden sm:block">
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm">
                  <Shield className="h-10 w-10 text-white/80" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8 stagger-children">
            {statCardData.map((item) => (
              <EnhancedStatCard
                key={item.label}
                icon={item.icon}
                label={item.label}
                value={item.value}
                trend={item.trend}
                trendUp={item.trendUp}
                gradient={item.gradient}
              />
            ))}
          </div>
        )}

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="flex-wrap h-auto gap-1 bg-muted p-1 rounded-lg">
            <TabsTrigger value="pending" className="gap-1.5 text-xs sm:text-sm relative">
              <Clock className="h-4 w-4" /> Pending
              {businesses.filter((b) => b.status === 'PENDING').length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                  {businesses.filter((b) => b.status === 'PENDING').length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="enquiries" className="gap-1.5 text-xs sm:text-sm"><MessageSquare className="h-4 w-4" /> Enquiries</TabsTrigger>
            <TabsTrigger value="businesses" className="gap-1.5 text-xs sm:text-sm"><Building2 className="h-4 w-4" /> Businesses</TabsTrigger>
            <TabsTrigger value="categories" className="gap-1.5 text-xs sm:text-sm"><FolderTree className="h-4 w-4" /> Categories</TabsTrigger>
            <TabsTrigger value="localities" className="gap-1.5 text-xs sm:text-sm"><Map className="h-4 w-4" /> Localities</TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5 text-xs sm:text-sm"><Users className="h-4 w-4" /> Users</TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5 text-xs sm:text-sm"><Settings className="h-4 w-4" /> Settings</TabsTrigger>
          </TabsList>

          {/* Pending Approvals Tab */}
          <TabsContent value="pending" className="mt-6">
            <PendingApprovalsSection businesses={businesses} onRefresh={refresh} />
          </TabsContent>

          {/* Enquiries Tab */}
          <TabsContent value="enquiries" className="mt-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">All Enquiries</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto max-h-96">
                {enquiries.length === 0 ? (
                  <EmptyState icon={Inbox} message="No enquiries yet." description="Enquiries from visitors will appear here when they contact businesses." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[160px]">Visitor</TableHead>
                        <TableHead className="min-w-[140px]">Business</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="min-w-[200px]">Message</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="w-[60px]">Chat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enquiries.map((eq) => {
                        const st = STATUS_STYLES[eq.status] || STATUS_STYLES.OPEN;
                        const StIcon = st.icon;
                        return (
                          <TableRow key={eq.id} className="cursor-pointer even:bg-muted/30 hover:bg-muted/50 transition-colors"
                            onClick={() => setView('business-detail', eq.businessId)}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{eq.visitor?.name || eq.name}</p>
                                <p className="text-xs text-muted-foreground">{eq.visitor?.email || eq.email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-sm">{eq.business?.name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`${st.class} gap-1 text-[11px]`}>
                                <StIcon className="h-3 w-3" /> {eq.status.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{eq.message}</TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {new Date(eq.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setChatEnquiry(eq);
                                  setChatOpen(true);
                                }}
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Businesses Tab */}
          <TabsContent value="businesses" className="mt-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">All Businesses</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto max-h-96">
                {businesses.length === 0 ? (
                  <EmptyState icon={Building2} message="No businesses listed yet." description="Businesses will appear here once they are registered." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Verified</TableHead>
                        <TableHead>Featured</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {businesses.map((biz) => (
                        <TableRow key={biz.id} className="cursor-pointer even:bg-muted/30 hover:bg-muted/50 transition-colors" onClick={() => setView('business-detail', biz.id)}>
                          <TableCell className="font-medium">{biz.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{biz.type}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{biz.category?.name || '-'}</TableCell>
                          <TableCell>
                            <Switch
                              checked={biz.isVerified}
                              onCheckedChange={(v) => { handleVerify(biz.id, v); }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={biz.isFeatured}
                              onCheckedChange={(v) => { handleFeature(biz.id, v); }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="mt-6">
            <CategoryManager categories={categories} onRefresh={refresh} onDelete={handleDeleteCategory} />
          </TabsContent>

          {/* Localities Tab */}
          <TabsContent value="localities" className="mt-6">
            <LocalityManager localities={localities} onRefresh={refresh} onDelete={handleDeleteLocality} />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <SiteSettingsPage />
          </TabsContent>
        </Tabs>
      </div>

      <ChatPanel
        enquiry={chatEnquiry}
        open={chatOpen}
        onOpenChange={setChatOpen}
      />
    </div>
  );
}

function EnhancedStatCard({ icon: Icon, label, value, trend, trendUp, gradient }: {
  icon: React.ElementType; label: string; value: number; trend: string; trendUp: boolean; gradient: string;
}) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-md">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-[0.06] -translate-y-8 translate-x-8`} />
      <CardContent className="p-5 relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <p className={`text-xs mt-2 flex items-center gap-1 ${trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} {trend} this month
        </p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon: Icon, message, description }: { icon: React.ElementType; message: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 rounded-full bg-muted w-fit mb-4">
        <Icon className="h-10 w-10 text-muted-foreground/40" />
      </div>
      <p className="text-muted-foreground font-medium">{message}</p>
      {description && <p className="text-sm text-muted-foreground/70 mt-1 max-w-xs">{description}</p>}
    </div>
  );
}

function CategoryManager({ categories, onRefresh, onDelete }: {
  categories: Category[]; onRefresh: () => void; onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Building2');
  const [editingId, setEditingId] = useState<string | null>(null);

  const iconOptions = ['Building2', 'Utensils', 'Hotel', 'Hospital', 'GraduationCap', 'ShoppingBag', 'Landmark', 'Train', 'Plane', 'Droplets', 'TreePine', 'Car', 'Dumbbell', 'MapPin', 'Star'];

  const handleSubmit = async () => {
    if (!name.trim()) return;
    try {
      if (editingId) {
        await api.put(`/api/categories/${editingId}`, { name, icon });
        toast.success('Category updated');
      } else {
        await api.post('/api/categories', { name, icon });
        toast.success('Category created');
      }
      setName(''); setIcon('Building2'); setEditingId(null); setOpen(false); onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id); setName(cat.name); setIcon(cat.icon || 'Building2'); setOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Categories</CardTitle>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); setName(''); } }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> Add Category</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? 'Edit' : 'Add'} Category</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /></div>
              <div>
                <Label>Icon</Label>
                <Select value={icon} onValueChange={setIcon}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{iconOptions.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={handleSubmit} className="w-full">{editingId ? 'Update' : 'Create'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <EmptyState icon={FolderTree} message="No categories yet." description="Create categories to organize businesses." />
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 group transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{cat.name}</span>
                  <span className="text-xs text-muted-foreground">({cat._count?.businesses || 0})</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(cat)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(cat.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LocalityManager({ localities, onRefresh, onDelete }: {
  localities: Locality[]; onRefresh: () => void; onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    try {
      if (editingId) {
        await api.put(`/api/localities/${editingId}`, { name });
        toast.success('Locality updated');
      } else {
        await api.post('/api/localities', { name });
        toast.success('Locality created');
      }
      setName(''); setEditingId(null); setOpen(false); onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const startEdit = (loc: Locality) => {
    setEditingId(loc.id); setName(loc.name); setOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Localities</CardTitle>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); setName(''); } }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> Add Locality</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? 'Edit' : 'Add'} Locality</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /></div>
              <Button onClick={handleSubmit} className="w-full">{editingId ? 'Update' : 'Create'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {localities.length === 0 ? (
          <EmptyState icon={Map} message="No localities yet." description="Add localities to help users find nearby businesses." />
        ) : (
          <div className="space-y-2">
            {localities.map((loc) => (
              <div key={loc.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 group transition-colors">
                <div className="flex items-center gap-3">
                  <Map className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{loc.name}</span>
                  <span className="text-xs text-muted-foreground">({loc._count?.businesses || 0})</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(loc)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(loc.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PendingApprovalsSection({ businesses, onRefresh }: { businesses: BusinessWithRelations[]; onRefresh: () => void }) {
  const { setView } = useAppStore();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const pendingBusinesses = businesses.filter((b) => b.status === 'PENDING');

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await api.put(`/api/businesses/${id}`, { status: 'APPROVED', isActive: true });
      toast.success('Business approved! It is now live.');
      onRefresh();
    } catch {
      toast.error('Failed to approve business');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setActionLoading(id);
    try {
      await api.put(`/api/businesses/${id}`, { status: 'REJECTED', rejectionReason: rejectReason.trim() });
      toast.success('Business rejected. The owner will be notified.');
      setRejectingId(null);
      setRejectReason('');
      onRefresh();
    } catch {
      toast.error('Failed to reject business');
    } finally {
      setActionLoading(null);
    }
  };

  if (pendingBusinesses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Pending Approvals
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <div className="p-4 rounded-full bg-emerald-100 dark:bg-emerald-900/20 w-fit mx-auto mb-4">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-muted-foreground font-medium">All caught up!</p>
          <p className="text-sm text-muted-foreground/70 mt-1">No pending businesses to review.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" /> Pending Approvals
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ml-1">
            {pendingBusinesses.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {pendingBusinesses.map((biz) => (
            <div key={biz.id} className="p-4 rounded-xl border border-border/50 hover:border-amber-300 dark:hover:border-amber-700 transition-colors bg-amber-50/30 dark:bg-amber-900/5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3
                      className="font-semibold text-base cursor-pointer hover:text-primary transition-colors"
                      onClick={() => setView('business-detail', biz.id)}
                    >
                      {biz.name}
                    </h3>
                    <Badge variant="outline" className="text-[10px]">{biz.type}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FolderTree className="h-3.5 w-3.5" />
                      {biz.category?.name || '-'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Map className="h-3.5 w-3.5" />
                      {biz.locality?.name || '-'}
                    </span>
                    {biz.owner && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {biz.owner.name} ({biz.owner.email})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Submitted {new Date(biz.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleApprove(biz.id)}
                    disabled={actionLoading === biz.id}
                  >
                    {actionLoading === biz.id && rejectingId !== biz.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <><Check className="h-4 w-4 mr-1" /> Approve</>
                    )}
                  </Button>
                  {rejectingId === biz.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Rejection reason..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="h-9 w-48"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleReject(biz.id);
                          if (e.key === 'Escape') { setRejectingId(null); setRejectReason(''); }
                        }}
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(biz.id)}
                        disabled={actionLoading === biz.id}
                      >
                        {actionLoading === biz.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Confirm'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setRejectingId(null); setRejectReason(''); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setRejectingId(biz.id)}
                      disabled={actionLoading === biz.id}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}