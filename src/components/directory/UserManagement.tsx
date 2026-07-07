'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  UserPlus, Search, Pencil, Trash2, Key, Shield, Briefcase, Eye,
  Users, Mail, Phone, Calendar, Building2, MessageSquare, Star,
  Heart, Loader2, X, Check, Filter,
} from 'lucide-react';

interface UserWithCounts {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'BUSINESS_OWNER' | 'VISITOR';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    businesses: number;
    enquiries: number;
    reviews: number;
    favorites: number;
  };
}

const ROLE_CONFIG = {
  ADMIN: { label: 'Admin', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: Shield },
  BUSINESS_OWNER: { label: 'Business Owner', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: Briefcase },
  VISITOR: { label: 'Visitor', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400', icon: Eye },
};

export function UserManagement() {
  const { user: currentUser } = useAppStore();
  const [users, setUsers] = useState<UserWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [total, setTotal] = useState(0);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserWithCounts | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [saving, setSaving] = useState(false);

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('VISITOR');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);

  // Password reset dialog
  const [pwResetOpen, setPwResetOpen] = useState(false);
  const [pwResetUser, setPwResetUser] = useState<UserWithCounts | null>(null);
  const [pwResetValue, setPwResetValue] = useState('');
  const [pwResetting, setPwResetting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const res = await api.get<{ users: UserWithCounts[]; total: number }>(`/api/users?${params}`);
      setUsers(res.users);
      setTotal(res.total);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // --- Edit user ---
  const openEdit = (u: UserWithCounts) => {
    setEditUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditPhone(u.phone || '');
    setEditRole(u.role);
    setEditPassword('');
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editUser || !editName.trim() || !editEmail.trim()) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = { name: editName.trim(), email: editEmail.trim(), phone: editPhone.trim() || null, role: editRole };
      if (editPassword) body.password = editPassword;
      const res = await api.put<{ user: UserWithCounts }>(`/api/users/${editUser.id}`, body);
      toast.success(`User "${editName}" updated`);
      setEditOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  // --- Create user ---
  const handleCreate = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPassword) {
      toast.error('Name, email, and password are required');
      return;
    }
    setCreating(true);
    try {
      await api.post('/api/users', {
        name: newName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim() || undefined,
        role: newRole,
        password: newPassword,
      });
      toast.success(`User "${newName}" created`);
      setCreateOpen(false);
      setNewName(''); setNewEmail(''); setNewPhone(''); setNewRole('VISITOR'); setNewPassword('');
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  // --- Delete user ---
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/users/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  // --- Admin password reset ---
  const openPwReset = (u: UserWithCounts) => {
    setPwResetUser(u);
    setPwResetValue('');
    setPwResetOpen(true);
  };

  const handlePwReset = async () => {
    if (!pwResetUser || pwResetValue.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setPwResetting(true);
    try {
      await api.put(`/api/users/${pwResetUser.id}`, { password: pwResetValue });
      toast.success(`Password reset for "${pwResetUser.name}"`);
      setPwResetOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setPwResetting(false);
    }
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const getAvatarColor = (name: string) => {
    const colors = ['from-teal-500 to-emerald-600', 'from-violet-500 to-purple-600', 'from-amber-500 to-orange-600', 'from-rose-500 to-pink-600', 'from-cyan-500 to-blue-600'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            User Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{total} total user{total !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 shadow-md">
          <UserPlus className="h-4 w-4" /> Create User
        </Button>
      </div>

      {/* Search & Filter */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="BUSINESS_OWNER">Business Owner</SelectItem>
                  <SelectItem value="VISITOR">Visitor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[300px]">User</TableHead>
                <TableHead className="hidden md:table-cell">Role</TableHead>
                <TableHead className="hidden lg:table-cell">Stats</TableHead>
                <TableHead className="hidden sm:table-cell">Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-10 w-10 text-muted-foreground/30" />
                      <p className="text-muted-foreground font-medium">No users found</p>
                      {search && <p className="text-sm text-muted-foreground/70">Try a different search term</p>}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => {
                  const rc = ROLE_CONFIG[u.role];
                  const RoleIcon = rc.icon;
                  return (
                    <TableRow key={u.id} className="group hover:bg-muted/30 transition-colors">
                      {/* User info */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${getAvatarColor(u.name)} flex items-center justify-center shrink-0 shadow-sm`}>
                            <span className="text-white text-sm font-semibold">{getInitials(u.name)}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{u.name}</p>
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                              <Mail className="h-3 w-3 shrink-0" /> {u.email}
                            </p>
                            {u.phone && (
                              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                <Phone className="h-3 w-3 shrink-0" /> {u.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Role */}
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary" className={`gap-1 ${rc.color}`}>
                          <RoleIcon className="h-3 w-3" /> {rc.label}
                        </Badge>
                      </TableCell>

                      {/* Stats */}
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex gap-2 flex-wrap">
                          {u._count.businesses > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                              <Building2 className="h-3 w-3" /> {u._count.businesses}
                            </span>
                          )}
                          {u._count.enquiries > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                              <MessageSquare className="h-3 w-3" /> {u._count.enquiries}
                            </span>
                          )}
                          {u._count.reviews > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 px-2 py-0.5 rounded-full">
                              <Star className="h-3 w-3" /> {u._count.reviews}
                            </span>
                          )}
                          {u._count.favorites > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-full">
                              <Heart className="h-3 w-3" /> {u._count.favorites}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Joined */}
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit user" onClick={() => openEdit(u)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Reset password" onClick={() => openPwReset(u)}>
                            <Key className="h-4 w-4" />
                          </Button>
                          {u.id !== currentUser?.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete user">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete <strong>{u.name}</strong>? This action cannot be undone. All their data including businesses, enquiries, and reviews will be permanently removed.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(u.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ===== Edit User Dialog ===== */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details. Leave password empty to keep current password.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Full Name *</Label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} className="pl-9" placeholder="Full name" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="pl-9" placeholder="Email address" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="edit-phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="pl-9" placeholder="Phone number" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="BUSINESS_OWNER">Business Owner</SelectItem>
                  <SelectItem value="VISITOR">Visitor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-pw">New Password (leave empty to keep current)</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="edit-pw" type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} className="pl-9" placeholder="New password (min 6 chars)" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving || !editName.trim() || !editEmail.trim()} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Create User Dialog ===== */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>Add a new user to the system.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-name">Full Name *</Label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="new-name" value={newName} onChange={(e) => setNewName(e.target.value)} className="pl-9" placeholder="Full name" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="pl-9" placeholder="Email address" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-phone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="new-phone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="pl-9" placeholder="Phone number" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="BUSINESS_OWNER">Business Owner</SelectItem>
                  <SelectItem value="VISITOR">Visitor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-pw">Password *</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="new-pw" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pl-9" placeholder="Password (min 6 chars)" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !newName.trim() || !newEmail.trim() || !newPassword} className="gap-1.5">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Password Reset Dialog ===== */}
      <Dialog open={pwResetOpen} onOpenChange={setPwResetOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-500" /> Reset Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{pwResetUser?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="reset-pw">New Password *</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="reset-pw" type="password" value={pwResetValue} onChange={(e) => setPwResetValue(e.target.value)} className="pl-9" placeholder="Enter new password (min 6 chars)" autoFocus />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPwResetOpen(false)}>Cancel</Button>
            <Button onClick={handlePwReset} disabled={pwResetting || pwResetValue.length < 6} className="gap-1.5">
              {pwResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}