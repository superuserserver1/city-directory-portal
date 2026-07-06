'use client';

import { useEffect, useState, useRef } from 'react';
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
  CheckCircle2, ArrowLeft, Package, Wrench, TrendingUp, TrendingDown,
  Briefcase, Inbox, MessageCircle,
} from 'lucide-react';
import type { Business, BusinessWithRelations, Category, Locality, Product, EnquiryWithRelations, Message } from '@/types';

const STATUS_STYLES: Record<string, { class: string; icon: React.ElementType; label: string }> = {
  OPEN: { class: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400', icon: Clock, label: 'Open' },
  IN_PROGRESS: { class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Eye, label: 'In Progress' },
  CLOSED: { class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2, label: 'Closed' },
};

function formatDateSeparator(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = (today.getTime() - msgDay.getTime()) / (1000 * 60 * 60 * 24);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

function groupMessagesByDate(messages: Message[]) {
  const groups: { date: string; messages: Message[] }[] = [];
  let currentGroup: { date: string; messages: Message[] } | null = null;

  for (const msg of messages) {
    const dateKey = new Date(msg.createdAt).toDateString();
    if (!currentGroup || currentGroup.date !== dateKey) {
      currentGroup = { date: dateKey, messages: [msg] };
      groups.push(currentGroup);
    } else {
      currentGroup.messages.push(msg);
    }
  }
  return groups;
}

function ChatMessages({ messages, userId, messagesEndRef }: { messages: Message[]; userId: string; messagesEndRef: React.RefObject<HTMLDivElement | null> }) {
  const groups = groupMessagesByDate(messages);

  if (messages.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="h-10 w-10 mx-auto mb-2 text-muted-foreground/20" />
        <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {groups.map((group) => (
        <div key={group.date}>
          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-[11px] text-muted-foreground font-medium">{formatDateSeparator(group.date)}</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>
          <div className="space-y-3">
            {group.messages.map((msg) => {
              const isMe = msg.senderId === userId;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] sm:max-w-[70%] px-4 py-2.5 text-sm leading-relaxed ${
                    isMe
                      ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md shadow-sm'
                      : 'bg-muted rounded-2xl rounded-bl-md'
                  }`}>
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1.5 ${
                      isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'
                    }`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground/50 inline-block" />
          <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground/50 inline-block" />
          <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground/50 inline-block" />
        </div>
      </div>
    </div>
  );
}

function MessageInput({ value, onChange, onSend, disabled, sendingMsg }: {
  value: string; onChange: (v: string) => void; onSend: () => void; disabled: boolean; sendingMsg: boolean;
}) {
  const maxChars = 500;
  const charCount = value.length;
  const isOverLimit = charCount > maxChars;

  return (
    <div className="p-4 border-t shrink-0">
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value.slice(0, maxChars))}
            placeholder="Type your message..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!isOverLimit) onSend();
              }
            }}
            disabled={disabled || sendingMsg}
            className="pr-12"
          />
          <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] ${
            isOverLimit ? 'text-destructive' : charCount > maxChars * 0.8 ? 'text-amber-500' : 'text-muted-foreground/50'
          }`}>
            {charCount}/{maxChars}
          </span>
        </div>
        <Button
          onClick={onSend}
          size="icon"
          disabled={!value.trim() || isOverLimit || sendingMsg}
          className="shrink-0 rounded-xl"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function OwnerDashboard() {
  const { user, setView } = useAppStore();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryWithRelations | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openEnquiry = async (eq: EnquiryWithRelations) => {
    setSelectedEnquiry(eq);
    try {
      const data = await api.get<{ enquiry: EnquiryWithRelations & { messages: Message[] } }>(`/api/enquiries/${eq.id}`);
      setMessages(data.enquiry?.messages || []);
    } catch { toast.error('Failed to load messages'); }
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedEnquiry) return;
    setSendingMsg(true);
    try {
      const res = await api.post<{ message: Message }>(`/api/enquiries/${selectedEnquiry.id}/messages`, { content: newMsg });
      setMessages((prev) => [...prev, res.message]);
      setNewMsg('');
    } catch { toast.error('Failed to send'); } finally {
      setSendingMsg(false);
    }
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
  const closedEnq = enquiries.filter((e) => e.status === 'CLOSED').length;

  const statCardData = [
    { icon: Building2, label: 'My Businesses', value: businesses.length, trend: '+2', trendUp: true, gradient: 'from-teal-500 to-emerald-500' },
    { icon: MessageSquare, label: 'Total Enquiries', value: totalEnq, trend: '+5', trendUp: true, gradient: 'from-emerald-500 to-teal-600' },
    { icon: Clock, label: 'Open', value: openEnquiries, trend: '-1', trendUp: false, gradient: 'from-teal-600 to-cyan-600' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="gradient-hero py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-white mb-6">
            <Button variant="secondary" size="sm" className="bg-white/90" onClick={() => setView('home')}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Home
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold">My Dashboard</h1>
          </div>
          {/* Welcome Banner */}
          <div className="rounded-2xl p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />
            <div className="relative flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Welcome back, {user?.name || 'Owner'}!</h2>
                <p className="text-white/70 mt-1">Manage your businesses, respond to enquiries, and grow your reach.</p>
              </div>
              <div className="hidden sm:block">
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm">
                  <Briefcase className="h-10 w-10 text-white/80" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 mb-8 stagger-children">
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
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="p-4 rounded-full bg-muted w-fit mb-4">
                          <Inbox className="h-10 w-10 text-muted-foreground/40" />
                        </div>
                        <p className="text-muted-foreground font-medium">No enquiries received yet.</p>
                        <p className="text-sm text-muted-foreground/70 mt-1">Enquiries from visitors will appear here.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {enquiries.map((eq) => {
                          const st = STATUS_STYLES[eq.status] || STATUS_STYLES.OPEN;
                          const StIcon = st.icon;
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
                                  <StIcon className="h-3 w-3" /> {st.label}
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
                      <div className="mb-4 p-3 bg-muted rounded-xl text-sm border border-border/50">
                        <p className="font-medium text-xs text-muted-foreground mb-1">Original Enquiry</p>
                        <p>{selectedEnquiry.message}</p>
                        <p className="text-xs text-muted-foreground mt-1.5">{new Date(selectedEnquiry.createdAt).toLocaleString()}</p>
                      </div>
                      {/* Messages */}
                      <ScrollArea className="flex-1 max-h-[350px]">
                        <ChatMessages messages={messages} userId={user?.id || ''} messagesEndRef={messagesEndRef} />
                      </ScrollArea>
                      {/* Input */}
                      <MessageInput
                        value={newMsg}
                        onChange={setNewMsg}
                        onSend={sendMessage}
                        disabled={!selectedEnquiry}
                        sendingMsg={sendingMsg}
                      />
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-center">
                      <div>
                        <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
                          <MessageCircle className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                        <h3 className="text-lg font-semibold mb-1">Select an Enquiry</h3>
                        <p className="text-sm text-muted-foreground max-w-xs">
                          Choose an enquiry from the list to view and respond to visitor messages.
                        </p>
                      </div>
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
              <Card><CardContent className="py-12 text-center">
                <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
                  <Building2 className="h-10 w-10 text-muted-foreground/40" />
                </div>
                <p className="text-muted-foreground font-medium">No businesses listed yet.</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Add your first business to get started.</p>
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
              {business.isVerified && <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Verified</Badge>}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setView('business-detail', business.id)}>
            View
          </Button>
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowProducts(!showProducts)}>
            <Package className="h-3.5 w-3.5 mr-1" /> {showProducts ? 'Hide' : 'Products'}
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