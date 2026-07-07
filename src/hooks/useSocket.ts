'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  enquiryId: string;
}

interface TypingPayload {
  userId: string;
  isTyping: boolean;
  enquiryId: string;
}

type MessageCallback = (message: SocketMessage) => void;
type TypingCallback = (payload: TypingPayload) => void;

const SOCKET_URL = '/?XTransformPort=3003';
const MAX_BACKOFF = 30000;
const INITIAL_BACKOFF = 1000;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef(INITIAL_BACKOFF);
  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef<{
    message: Set<MessageCallback>;
    typing: Set<TypingCallback>;
  }>({
    message: new Set(),
    typing: new Set(),
  });
  // Ref to hold the connect function so scheduleReconnect can call it without circular deps
  const connectFnRef = useRef<() => void>(() => {});

  const getToken = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('citydir_token');
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimerRef.current) return;

    const delay = backoffRef.current;
    console.log(`[Socket] Reconnecting in ${delay}ms...`);
    backoffRef.current = Math.min(backoffRef.current * 1.5, MAX_BACKOFF);

    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      connectFnRef.current();
    }, delay);
  }, []);

  const connect = useCallback(() => {
    const token = getToken();
    if (!token || socketRef.current?.connected) return;

    // Clean up existing socket if any
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: false, // We handle reconnection ourselves
      timeout: 5000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected');
      setIsConnected(true);
      backoffRef.current = INITIAL_BACKOFF;
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);

      // If not a deliberate disconnect, schedule reconnect
      if (reason !== 'io server disconnect' && reason !== 'io client disconnect') {
        scheduleReconnect();
      }
    });

    socket.on('connect_error', (error) => {
      console.warn('[Socket] Connection error:', error.message);
      setIsConnected(false);

      if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
        console.warn('[Socket] Auth failed, will not retry until new token');
        return;
      }

      scheduleReconnect();
    });

    socket.on('new-message', (message: SocketMessage) => {
      listenersRef.current.message.forEach((cb) => cb(message));
    });

    socket.on('typing', (payload: TypingPayload) => {
      listenersRef.current.typing.forEach((cb) => cb(payload));
    });

    socketRef.current = socket;
  }, [getToken, scheduleReconnect]);

  // Keep the ref updated in an effect
  useEffect(() => {
    connectFnRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    backoffRef.current = INITIAL_BACKOFF;
  }, []);

  const joinEnquiry = useCallback((enquiryId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-enquiry', enquiryId);
    }
  }, []);

  const leaveEnquiry = useCallback((enquiryId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-enquiry', enquiryId);
    }
  }, []);

  const sendMessage = useCallback((enquiryId: string, content: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('send-message', { enquiryId, content });
    }
  }, []);

  const emitTyping = useCallback((enquiryId: string, isTyping: boolean) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing', { enquiryId, isTyping });
    }
  }, []);

  const onMessage = useCallback((callback: MessageCallback) => {
    listenersRef.current.message.add(callback);
    return () => {
      listenersRef.current.message.delete(callback);
    };
  }, []);

  const onTyping = useCallback((callback: TypingCallback) => {
    listenersRef.current.typing.add(callback);
    return () => {
      listenersRef.current.typing.delete(callback);
    };
  }, []);

  // Auto-connect when token is available
  useEffect(() => {
    const token = getToken();
    if (token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, getToken]);

  return {
    isConnected,
    joinEnquiry,
    leaveEnquiry,
    sendMessage,
    emitTyping,
    onMessage,
    onTyping,
    reconnect: connect,
  };
}