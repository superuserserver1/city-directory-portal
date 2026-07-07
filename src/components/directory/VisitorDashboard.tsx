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
  Building2, Inbox, ChevronRight, TrendingUp, TrendingDown,
  Compass, MessageCircle,
} from 'lucide-react';
import { ChatPanel } from './ChatPanel';
import type { EnquiryWithRelations, Message } from '@/types';

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

export function VisitorDashboard() {
  const { user, setView } = useAppStore();
  const [enquiries, setEnquiries] = useState<EnquiryWithRelations[]>([]);
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryWithRelations | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [chatEnquiry, setChatEnquiry] = useState<EnquiryWithRelations | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
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

  const statCardData = [
    { icon: MessageSquare, label: 'Total Enquiries', value: totalEnq, trend: '+3', trendUp: true, gradient: 'from-teal-500 to-emerald-500' },
    { icon: Clock, label: 'Open', value: openEnq, trend: '-1', trendUp: false, gradient: 'from-emerald-500 to-teal-600' },
    { icon: Eye, label: 'In Progress', value: inProgress, trend: '+1', trendUp: true, gradient: 'from-teal-600 to-cyan-600' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="gradient-hero py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-white mb-6">
            <Button variant="secondary" size="sm" className="bg-white/90" onClick={() => setView('home')}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Home
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold">My Enquiries</h1>
          </div>
          {/* Welcome Banner */}
          <div className="rounded-2xl p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />
            <div className="relative flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Welcome back, {user?.name || 'Visitor'}!</h2>
                <p className="text-white/70 mt-1">Track your enquiries, chat with businesses, and discover new places.</p>
              </div>
              <div className="hidden sm:block">
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm">
                  <Compass className="h-10 w-10 text-white/80" />
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
                    <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
                      <Inbox className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                    <p className="text-muted-foreground font-medium">No enquiries yet.</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">Start a conversation with a business!</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setView('browse')}>
                      <Compass className="h-3.5 w-3.5 mr-1.5" /> Browse & Enquire
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
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <Building2 className="h-4 w-4 text-primary shrink-0" />
                                <p className="font-medium text-sm truncate">{eq.business?.name || 'Unknown'}</p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Badge variant="secondary" className={`${st.class} gap-1 text-[10px]`}>
                                  <StIcon className="h-3 w-3" /> {st.label}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setChatEnquiry(eq);
                                    setChatOpen(true);
                                  }}
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                </Button>
                              </div>
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
                        {(() => { const StIcon = STATUS_STYLES[selectedEnquiry.status]?.icon; return StIcon ? <StIcon className="h-3 w-3" /> : null; })()}
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
                      <ChatMessages messages={messages} userId={user?.id || ''} messagesEndRef={messagesEndRef} />
                    </ScrollArea>
                  </CardContent>

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