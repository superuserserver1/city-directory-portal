import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'city-directory-secret-key-2024';
const PORT = 3003;

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

const io = new Server(PORT, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  },
});

// JWT authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    (socket.data as Record<string, unknown>).userId = decoded.userId;
    (socket.data as Record<string, unknown>).email = decoded.email;
    (socket.data as Record<string, unknown>).role = decoded.role;
    next();
  } catch {
    return next(new Error('Invalid or expired token'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.data.userId as string;
  const role = socket.data.role as string;
  console.log(`[Chat] User connected: ${userId} (${role})`);

  // Join an enquiry room
  socket.on('join-enquiry', (enquiryId: string) => {
    const room = `enquiry:${enquiryId}`;
    socket.join(room);
    console.log(`[Chat] User ${userId} joined room ${room}`);
  });

  // Leave an enquiry room
  socket.on('leave-enquiry', (enquiryId: string) => {
    const room = `enquiry:${enquiryId}`;
    socket.leave(room);
    console.log(`[Chat] User ${userId} left room ${room}`);
  });

  // Send a message to an enquiry room
  socket.on('send-message', (data: { enquiryId: string; content: string }) => {
    const { enquiryId, content } = data;
    const room = `enquiry:${enquiryId}`;
    const messagePayload = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      senderId: userId,
      content,
      createdAt: new Date().toISOString(),
      enquiryId,
    };
    io.to(room).emit('new-message', messagePayload);
    console.log(`[Chat] Message in ${room} from ${userId}: ${content.slice(0, 50)}`);
  });

  // Typing indicator
  socket.on('typing', (data: { enquiryId: string; isTyping: boolean }) => {
    const { enquiryId, isTyping } = data;
    const room = `enquiry:${enquiryId}`;
    socket.to(room).emit('typing', {
      userId,
      isTyping,
      enquiryId,
    });
  });

  // Disconnect
  socket.on('disconnect', (reason) => {
    console.log(`[Chat] User ${userId} disconnected: ${reason}`);
  });
});

console.log(`[Chat] Socket.IO chat service running on port ${PORT}`);