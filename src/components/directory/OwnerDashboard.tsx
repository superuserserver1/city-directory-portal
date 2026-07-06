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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Building2, MessageSquare, Plus, Pencil, Trash2, Send, Clock, Eye,
  CheckCircle2, ArrowLeft, Package, Wrench,
} from 'lucide-react';
import type { Business, BusinessWithRelations, Category, Locality, Product, EnquiryWithRelations, Message } from '@/types';

const STATUS_STYLES: Record<string, { class: string; icon: React.ElementType }> = {
  OPEN: { class: 'bg-blue-100 text-blue-700', icon: Clock },
  IN_PROGRESS: { class: 'bg-amber-100 text-amber-700', icon: Eye },
  CLOSED: { class: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
};

export function OwnerDashboard() {
  const { user, setView } = useAppStore();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryWithRelations | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');

  const fetchData = async () => {
    const [b, eq] = await Promise.all([
      api.get<{ businesses: Business[] }>('/api/businesses?limit=100'),
      api.get<{ enquiries: EnquiryWithRelations[] }>('/api/enquiries'),
    ]);
    return { b, eq };
  };

  useEffect(() => {
    let cancelled = false;
    fetchData()
      .then(({ b, eq }) => {
        if (!cancelled) {
          setBusinesses((b.businesses || []).filter((biz) => biz.ownerId === user?.id));
          setEnquiries(eq.enquiries || []);
          setLoading(false);
        }
      })
      .catch(() => { if (!cancelled) { toast.error('Failed to load'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [user?.id]);

  const refresh = () => {
    setLoading(true);
    fetchData()
      .then(({ b, eq }) => {
        setBusinesses((b.businesses || []).filter((biz) => biz.ownerId === user?.id));
        setEnquiries(eq.enquiries || []);
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  const openEnquiry = async (eq: EnquiryWithRelations) => {
    setSelectedEnquiry(eq);
    try {
      const data = await api.get<{ enquiry: EnquiryWithRelations & { messages: Message[] } }>(`/api/enquiries/${eq.id}`);
      setMessages(data.enquiry?.messages || []);
    } catch { toast.error('Failed to load messages'); }
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedEnquiry) return;
    try {
      const res = await api.post<{ message: Message }>(`/api/enquiries/${selectedEnquiry.id}/messages`, { content: newMsg });
      setMessages((prev) => [...prev, res.message]);
      setNewMsg('');
    } catch { toast.error('Failed to send'); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/api/enquiries/${id}`, { status });
      toast.success('Status updated');
      refresh();
      if (selectedEnquiry?.id === id) {
        setSelectedEnquiry((prev) => prev ? { ...prev, status: status as EnquiryWithRelations['status'] } : null);
      }
    } catch { toast.error('Failed to update'); }
  };

  const openEnquiries = enquiries.filter((e) => e.status === 'OPEN').length;
  const totalEnq = enquiries.length;

  return (
    <div className="animate-fade-in">
      <div className="gradient-hero py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-white">
            <Button variant="secondary" size="sm" className="bg-white/90" onClick={() => setView('home')}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Home
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold">My Dashboard</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard icon={Building2} label="My Businesses" value={businesses.length} />
          <StatCard icon={MessageSquare} label="Total Enquiries" value={totalEnq} />
          <StatCard icon={Clock} label="Open" value={openEnquiries} />
        </div>

        <Tabs defaultValue="enquiries" className="w-full">
          <TabsList className="flex-wrap h-auto gap-1 bg-muted p-1 rounded-lg">
            <TabsTrigger value="enquiries" className="gap-1.5"><MessageSquare className="h-4 w-4" /> Enquiries</TabsTrigger>
            <TabsTrigger value="businesses" className="gap-1.5"><Building2 className="h-4 w-4" /> My Businesses</TabsTrigger>
          </TabsList>

          <TabsContent value="enquiries" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enquiries List */}
              <Card>
                <CardHeader><CardTitle className="text-lg">Enquiries ({enquiries.length})</CardTitle></CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[500px]">
                    {enquiries.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No enquiries received yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {enquiries.map((eq) => {
                          const st = STATUS_STYLES[eq.status] || STATUS_STYLES.OPEN;
                          return (
                            <div
                              key={eq.id}
                              className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                                selectedEnquiry?.id === eq.id ? 'border-primary bg-primary/5' : 'border-border/50'
                              }`}
                              onClick={() => openEnquiry(eq)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-medium text-sm">{eq.visitor?.name || eq.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{eq.message}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{new Date(eq.createdAt).toLocaleString()}</p>
                                </div>
                                <Badge variant="secondary" className={`${st.class} gap-1 text-[10px] shrink-0`}>
                                  {eq.status.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Chat Area */}
              <Card className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {selectedEnquiry ? `Chat with ${selectedEnquiry.visitor?.name || selectedEnquiry.name}` : 'Select an enquiry'}
                    </CardTitle>
                    {selectedEnquiry && (
                      <Select
                        value={selectedEnquiry.status}
                        onValueChange={(v) => updateStatus(selectedEnquiry.id, v)}
                      >
                        <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPEN">Open</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="CLOSED">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  {selectedEnquiry ? (
                    <>
                      {/* Original Enquiry */}
                      <div className="mb-4 p-3 bg-muted rounded-lg text-sm">
                        <p className="font-medium">{selectedEnquiry.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(selectedEnquiry.createdAt).toLocaleString()}</p>
                      </div>
                      {/* Messages */}
                      <ScrollArea className="flex-1 max-h-[350px]">
                        <div className="space-y-3">
                          {messages.map((msg) => {
                            const isMe = msg.senderId === user?.id;
                            return (
                              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                                  isMe ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'
                                }`}>
                                  <p>{msg.content}</p>
                                  <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                      {/* Input */}
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Input
                          value={newMsg} onChange={(e) => setNewMsg(e.target.value)}
                          placeholder="Type a message..." onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <Button onClick={sendMessage} size="icon" disabled={!newMsg.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                      Select an enquiry to start chatting
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="businesses" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">My Businesses ({businesses.length})</h2>
              <BusinessFormDialog categories={[]} localities={[]} onRefresh={refresh} />
            </div>
            {businesses.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No businesses listed yet.</p>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {businesses.map((biz) => (
                  <BusinessManagementCard key={biz.id} business={biz} onRefresh={refresh} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div>
        <div>
          <p className="text-xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function BusinessManagementCard({ business, onRefresh }: { business: Business; onRefresh: () => void }) {
  const { setView } = useAppStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [showProducts, setShowProducts] = useState(false);

  useEffect(() => {
    if (showProducts) {
      api.get<{ products: Product[] }>(`/api/businesses/${business.id}/products`).then((r) => setProducts(r.products || [])).catch(() => {});
    }
  }, [showProducts, business.id]);

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.del(`/api/products/${id}`);
      toast.success('Product deleted');
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch { toast.error('Failed'); }
  };

  return (
    <Card className="border-border/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{business.name}</h3>
            <div className="flex gap-1.5 mt-1.5">
              <Badge variant="outline" className="text-[10px]">{business.type}</Badge>
              {business.isVerified && <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700">Verified</Badge>}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setView('business-detail', business.id)}>
            View
          </Button>
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowProducts(!showProducts)}>
            <Package className="h-3.5 w-3.5 mr-1" /> {showProducts ? 'Hide' : 'Products'} ({business.id ? '' : ''})
          </Button>
          <ProductFormDialog businessId={business.id} onAdd={(p) => setProducts((prev) => [...prev, p])} />
        </div>

        {showProducts && (
          <div className="mt-4 border-t pt-4 space-y-2 max-h-48 overflow-y-auto">
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground">No products yet. Add one!</p>
            ) : (
              products.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 group">
                  <div className="flex items-center gap-2 min-w-0">
                    {p.type === 'SERVICE' ? <Wrench className="h-4 w-4 text-primary shrink-0" /> : <Package className="h-4 w-4 text-primary shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      {p.price && <p className="text-xs text-primary font-semibold">{p.price}</p>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={() => deleteProduct(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BusinessFormDialog({ categories, localities, onRefresh }: { categories: Category[]; localities: Locality[]; onRefresh: () => void }) {
  const { user } = useAppStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('BUSINESS');
  const [categoryId, setCategoryId] = useState('');
  const [localityId, setLocalityId] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [cats, setCats] = useState(categories);
  const [locs, setLocs] = useState(localities);

  useEffect(() => {
    if (open && cats.length === 0) {
      api.get<{ categories: Category[] }>('/api/categories').then((r) => setCats(r.categories || [])).catch(() => {});
      api.get<{ localities: Locality[] }>('/api/localities').then((r) => setLocs(r.localities || [])).catch(() => {});
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!name.trim() || !categoryId || !localityId) { toast.error('Fill required fields'); return; }
    setLoading(true);
    try {
      await api.post('/api/businesses', { name, description, type, categoryId, localityId, address, phone, email, ownerId: user?.id });
      toast.success('Business created!');
      setOpen(false); setName(''); setDescription(''); setAddress(''); setPhone(''); setEmail('');
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> Add Business</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add New Business</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-2">
          <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /></div>
          <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" rows={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUSINESS">Business</SelectItem>
                  <SelectItem value="AMENITY">Amenity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Locality *</Label>
            <Select value={localityId} onValueChange={setLocalityId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{locs.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" /></div>
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" /></div>
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Business'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProductFormDialog({ businessId, onAdd }: { businessId: string; onAdd: (p: Product) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState('PRODUCT');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const p = await api.post<Product>(`/api/businesses/${businessId}/products`, { name, description, price, type });
      toast.success('Product added!');
      onAdd(p);
      setOpen(false); setName(''); setDescription(''); setPrice('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> Product</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Product / Service</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-2">
          <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /></div>
          <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Price</Label><Input value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1" placeholder="e.g. ₹500" /></div>
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRODUCT">Product</SelectItem>
                  <SelectItem value="SERVICE">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}