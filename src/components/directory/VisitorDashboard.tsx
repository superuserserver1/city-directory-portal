'use client';

import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/store/app-store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  MessageSquare, Clock, Eye, CheckCircle2, Send, ArrowLeft,
  Building2, Inbox, ChevronRight,
} from 'lucide-react';
import type { EnquiryWithRelations, Message } from '@/types';

const STATUS_STYLES: Record<string, { class: string; icon: React.ElementType; label: string }> = {
  OPEN: { class: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Open' },
  IN_PROGRESS: { class: 'bg-amber-100 text-amber-700', icon: Eye, label: 'In Progress' },
  CLOSED: { class: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, label: 'Closed' },
};

export function VisitorDashboard() {
  const { user, setView } = useAppStore();
  const [enquiries, setEnquiries] = useState<EnquiryWithRelations[]>([]);
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryWithRelations | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const refresh = async () => {
    try {
      const res = await api.get<{ enquiries: EnquiryWithRelations[] }>('/api/enquiries');
      setEnquiries(res.enquiries || []);
    } catch {
      toast.error('Failed to load enquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const openEnquiry = async (eq: EnquiryWithRelations) => {
    setSelectedEnquiry(eq);
    try {
      const data = await api.get<{ enquiry: EnquiryWithRelations & { messages: Message[] } }>(`/api/enquiries/${eq.id}`);
      setMessages(data.enquiry?.messages || []);
    } catch {
      toast.error('Failed to load messages');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedEnquiry) return;
    setSendingMsg(true);
    try {
      const res = await api.post<{ message: Message }>(`/api/enquiries/${selectedEnquiry.id}/messages`, { content: newMsg });
      setMessages((prev) => [...prev, res.message]);
      setNewMsg('');
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSendingMsg(false);
    }
  };

  const totalEnq = enquiries.length;
  const openEnq = enquiries.filter((e) => e.status === 'OPEN').length;
  const inProgress = enquiries.filter((e) => e.status === 'IN_PROGRESS').length;

  return (
    <div className="animate-fade-in">
      <div className="gradient-hero py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-white">
            <Button variant="secondary" size="sm" className="bg-white/90" onClick={() => setView('home')}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Home
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold">My Enquiries</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard icon={MessageSquare} label="Total Enquiries" value={totalEnq} color="primary" />
          <StatCard icon={Clock} label="Open" value={openEnq} color="blue" />
          <StatCard icon={Eye} label="In Progress" value={inProgress} color="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Enquiries List */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Inbox className="h-5 w-5" /> Conversations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 rounded-lg" />
                    ))}
                  </div>
                ) : enquiries.length === 0 ? (
                  <div className="p-8 text-center">
                    <Inbox className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground">No enquiries yet.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setView('browse')}>
                      Browse & Enquire
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[600px]">
                    <div className="divide-y">
                      {enquiries.map((eq) => {
                        const st = STATUS_STYLES[eq.status] || STATUS_STYLES.OPEN;
                        const StIcon = st.icon;
                        const isSelected = selectedEnquiry?.id === eq.id;
                        return (
                          <button
                            key={eq.id}
                            className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                              isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'
                            }`}
                            onClick={() => openEnquiry(eq)}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <Building2 className="h-4 w-4 text-primary shrink-0" />
                                <p className="font-medium text-sm truncate">{eq.business?.name || 'Unknown'}</p>
                              </div>
                              <Badge variant="secondary" className={`${st.class} gap-1 text-[10px] shrink-0`}>
                                <StIcon className="h-3 w-3" /> {st.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 ml-6">{eq.message}</p>
                            <p className="text-[10px] text-muted-foreground/60 ml-6 mt-1">
                              {new Date(eq.createdAt).toLocaleDateString()} · {new Date(eq.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="flex flex-col h-[600px]">
              {selectedEnquiry ? (
                <>
                  {/* Chat Header */}
                  <CardHeader className="pb-3 border-b shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{selectedEnquiry.business?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {selectedEnquiry.messages?.length || messages.length} messages
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className={`${STATUS_STYLES[selectedEnquiry.status]?.class} gap-1 text-[10px]`}>
                        {selectedEnquiry.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="flex-1 overflow-hidden p-0">
                    {/* Original Enquiry */}
                    <div className="mx-4 mt-4 mb-3 p-3 bg-muted/50 rounded-xl text-sm border border-border/50">
                      <p className="font-medium text-xs text-muted-foreground mb-1">Original Enquiry</p>
                      <p>{selectedEnquiry.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        {new Date(selectedEnquiry.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <ScrollArea className="h-[380px] px-4">
                      <div className="space-y-3 pb-4">
                        {messages.length === 0 ? (
                          <div className="text-center py-8">
                            <MessageSquare className="h-10 w-10 mx-auto mb-2 text-muted-foreground/20" />
                            <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
                          </div>
                        ) : (
                          messages.map((msg) => {
                            const isMe = msg.senderId === user?.id;
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
                          })
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                  </CardContent>

                  {/* Input */}
                  <div className="p-4 border-t shrink-0">
                    <div className="flex gap-2">
                      <Input
                        value={newMsg}
                        onChange={(e) => setNewMsg(e.target.value)}
                        placeholder="Type your message..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        disabled={sendingMsg}
                      />
                      <Button
                        onClick={sendMessage}
                        size="icon"
                        disabled={!newMsg.trim() || sendingMsg}
                        className="shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div>
                    <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
                      <MessageSquare className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">Select a Conversation</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Choose an enquiry from the list to view messages and chat with the business owner.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    blue: 'bg-blue-500/10 text-blue-600',
    amber: 'bg-amber-500/10 text-amber-600',
  };
  return (
    <Card className="border-border/50">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorMap[color] || colorMap.primary}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}