'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Send, X, Clock, Eye, CheckCircle2 } from 'lucide-react';
import type { Message, EnquiryWithRelations } from '@/types';

const STATUS_STYLES: Record<string, { class: string; icon: React.ElementType; label: string }> = {
  OPEN: { class: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400', icon: Clock, label: 'Open' },
  IN_PROGRESS: { class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Eye, label: 'In Progress' },
  CLOSED: { class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2, label: 'Closed' },
};

interface ChatPanelMessage extends Message {
  sender?: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
}

interface ChatPanelProps {
  enquiry: EnquiryWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

function groupMessagesByDate(messages: ChatPanelMessage[]) {
  const groups: { date: string; messages: ChatPanelMessage[] }[] = [];
  let currentGroup: { date: string; messages: ChatPanelMessage[] } | null = null;

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

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ChatPanel({ enquiry, open, onOpenChange }: ChatPanelProps) {
  const { user } = useAppStore();
  const [messages, setMessages] = useState<ChatPanelMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!open) return;

    const token = localStorage.getItem('citydir_token');
    if (!token) return;

    const socket = io('/?XTransformPort=3004', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: false,
      timeout: 5000,
    });

    socket.on('connect', () => {
      setConnected(true);
      if (enquiry) {
        socket.emit('join:enquiry', { enquiryId: enquiry.id });
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('chat:new-message', (msg: ChatPanelMessage) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTypingUser(null);
    });

    socket.on('chat:typing', (payload: { userId: string; isTyping: boolean; enquiryId: string }) => {
      if (payload.enquiryId === enquiry?.id && payload.userId !== user?.id) {
        setTypingUser(payload.isTyping ? payload.userId : null);
        if (payload.isTyping) {
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => setTypingUser(null), 3000);
        }
      }
    });

    socket.on('connect_error', (err) => {
      console.warn('[ChatPanel] Connection error:', err.message);
      setConnected(false);
    });

    socketRef.current = socket;

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [open, enquiry?.id, user?.id]);

  // Track previous enquiry ID to reset messages
  const prevEnquiryIdRef = useRef<string | null>(null);
  const currentEnquiryId = enquiry?.id ?? null;

  // Reset messages when enquiry changes (synchronously, not in effect)
  if (prevEnquiryIdRef.current !== currentEnquiryId) {
    prevEnquiryIdRef.current = currentEnquiryId;
    if (currentEnquiryId === null) {
      // Only reset if no enquiry selected
      setMessages((prev) => (prev.length > 0 ? [] : prev));
    }
  }

  // Load messages when enquiry changes
  useEffect(() => {
    if (!enquiry) {
      return;
    }

    let cancelled = false;
    api
      .get<{ messages: ChatPanelMessage[] }>(`/api/enquiries/${enquiry.id}/messages`)
      .then((res) => {
        if (!cancelled) {
          setMessages(res.messages || []);
        }
      })
      .catch(() => {
        // Silently fail - the panel still works for sending
      });

    return () => {
      cancelled = true;
    };
  }, [enquiry?.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  // Emit typing events
  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (socketRef.current?.connected && enquiry) {
        socketRef.current.emit('typing', {
          enquiryId: enquiry.id,
          userId: user?.id,
          isTyping,
        });
      }
    },
    [enquiry, user?.id]
  );

  const handleInputChange = (value: string) => {
    setNewMsg(value);
    emitTyping(true);
  };

  const sendMessage = () => {
    if (!newMsg.trim() || !enquiry || !socketRef.current?.connected) return;

    const content = newMsg.trim();
    setNewMsg('');
    setSendingMsg(true);
    emitTyping(false);

    // Send via socket - the server will persist and broadcast
    socketRef.current.emit('chat:message', {
      enquiryId: enquiry.id,
      content,
      senderId: user?.id,
    });

    // Also send via REST API as fallback / for immediate UI update
    api
      .post<{ message: ChatPanelMessage }>(`/api/enquiries/${enquiry.id}/messages`, {
        content,
      })
      .then((res) => {
        // Avoid duplicate: only add if socket hasn't already added it
        setMessages((prev) => {
          if (prev.some((m) => m.id === res.message.id)) return prev;
          return [...prev, res.message];
        });
      })
      .catch(() => {
        // Socket already handled the broadcast, this is just for DB persistence
      })
      .finally(() => setSendingMsg(false));
  };

  const groups = groupMessagesByDate(messages);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        {enquiry ? (
          <>
            {/* Header */}
            <SheetHeader className="p-4 pb-2 shrink-0 space-y-0">
              <div className="flex items-center justify-between pr-6">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-9 w-9 border">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {getInitials(enquiry.business?.name || 'N/A')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <SheetTitle className="text-base truncate">
                      {enquiry.business?.name || 'Chat'}
                    </SheetTitle>
                    <SheetDescription className="text-xs flex items-center gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          connected ? 'bg-emerald-500' : 'bg-red-400'
                        }`}
                      />
                      {connected ? 'Connected' : 'Disconnected'}
                    </SheetDescription>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={`${STATUS_STYLES[enquiry.status]?.class || ''} gap-1 text-[10px]`}
                >
                  {(() => {
                    const StIcon = STATUS_STYLES[enquiry.status]?.icon;
                    return StIcon ? <StIcon className="h-3 w-3" /> : null;
                  })()}
                  {enquiry.status.replace('_', ' ')}
                </Badge>
              </div>
            </SheetHeader>

            <Separator className="shrink-0" />

            {/* Original Enquiry */}
            <div className="mx-4 mt-3 mb-2 p-3 bg-muted/50 rounded-xl text-sm border border-border/50 shrink-0">
              <p className="font-medium text-xs text-muted-foreground mb-1">Original Enquiry</p>
              <p className="text-sm">{enquiry.message}</p>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {new Date(enquiry.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-hidden px-4">
              <ScrollArea className="h-full">
                <div className="space-y-1 pb-4">
                  {groups.length === 0 && messages.length === 0 && (
                    <div className="text-center py-8">
                      <div className="p-3 rounded-full bg-muted w-fit mx-auto mb-3">
                        <Send className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm text-muted-foreground">No messages yet.</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Start the conversation!
                      </p>
                    </div>
                  )}

                  {groups.map((group) => (
                    <div key={group.date}>
                      <div className="flex items-center gap-3 my-3">
                        <div className="flex-1 h-px bg-border/50" />
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {formatDateSeparator(group.date)}
                        </span>
                        <div className="flex-1 h-px bg-border/50" />
                      </div>
                      <div className="space-y-3">
                        {group.messages.map((msg) => {
                          const isMe = msg.senderId === user?.id;
                          const senderName = msg.sender?.name || 'Unknown';

                          return (
                            <div
                              key={msg.id}
                              className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                              <Avatar className="h-7 w-7 shrink-0 mt-1">
                                <AvatarFallback
                                  className={`text-[10px] font-semibold ${
                                    isMe
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {getInitials(senderName)}
                                </AvatarFallback>
                              </Avatar>
                              <div
                                className={`max-w-[75%] ${
                                  isMe ? 'items-end' : 'items-start'
                                } flex flex-col`}
                              >
                                {!isMe && (
                                  <p className="text-[11px] font-medium text-muted-foreground mb-1 px-1">
                                    {senderName}
                                  </p>
                                )}
                                <div
                                  className={`px-3.5 py-2.5 text-sm leading-relaxed ${
                                    isMe
                                      ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md shadow-sm'
                                      : 'bg-muted rounded-2xl rounded-bl-md'
                                  }`}
                                >
                                  <p>{msg.content}</p>
                                  <p
                                    className={`text-[10px] mt-1.5 ${
                                      isMe
                                        ? 'text-primary-foreground/60'
                                        : 'text-muted-foreground'
                                    }`}
                                  >
                                    {new Date(msg.createdAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {typingUser && (
                    <div className="flex gap-2 items-end">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="text-[10px] font-semibold bg-muted text-muted-foreground">
                          ...
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground/50 inline-block" />
                          <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground/50 inline-block" />
                          <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground/50 inline-block" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t shrink-0">
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMsg}
                    onChange={(e) => handleInputChange(e.target.value.slice(0, 500))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    disabled={!connected || sendingMsg}
                    placeholder={connected ? 'Type a message...' : 'Connecting...'}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/50">
                    {newMsg.length}/500
                  </span>
                </div>
                <Button
                  onClick={sendMessage}
                  size="icon"
                  disabled={!newMsg.trim() || !connected || sendingMsg}
                  className="shrink-0 rounded-xl"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No enquiry selected</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}