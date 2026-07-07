import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'city-directory-secret-key-2024';
const PORT = 3004;

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

const prisma = new PrismaClient();

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
  console.log(`[ChatService:3004] User connected: ${userId} (${role})`);

  // Join an enquiry room
  socket.on('join:enquiry', async (params: { enquiryId: string }) => {
    const { enquiryId } = params;
    const room = `enquiry:${enquiryId}`;
    socket.join(room);
    console.log(`[ChatService:3004] User ${userId} joined room ${room}`);
  });

  // Send a message to an enquiry room
  socket.on('chat:message', async (params: { enquiryId: string; content: string; senderId: string }) => {
    const { enquiryId, content, senderId } = params;

    if (!content?.trim()) return;
    if (senderId !== userId) return; // Prevent message spoofing

    try {
      // Verify the user is a participant in this enquiry
      const enquiry = await prisma.enquiry.findUnique({
        where: { id: enquiryId },
        include: { business: { select: { ownerId: true } } },
      });

      if (!enquiry) {
        console.warn(`[ChatService:3004] Enquiry not found: ${enquiryId}`);
        return;
      }

      const isParticipant =
        enquiry.visitorId === userId ||
        enquiry.business.ownerId === userId ||
        role === 'ADMIN';

      if (!isParticipant) {
        console.warn(`[ChatService:3004] User ${userId} is not a participant in enquiry ${enquiryId}`);
        return;
      }

      // Save message to database
      const message = await prisma.message.create({
        data: {
          content: content.trim(),
          enquiryId,
          senderId: userId,
        },
        include: {
          sender: {
            select: { id: true, name: true, email: true, role: true, avatar: true },
          },
        },
      });

      // Broadcast to all users in the enquiry room
      const room = `enquiry:${enquiryId}`;
      const messagePayload = {
        id: message.id,
        senderId: message.senderId,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        enquiryId: message.enquiryId,
        sender: message.sender,
      };

      io.to(room).emit('chat:new-message', messagePayload);
      console.log(`[ChatService:3004] Message in ${room} from ${userId}: ${content.slice(0, 50)}`);
    } catch (error) {
      console.error(`[ChatService:3004] Error saving message:`, error);
    }
  });

  // Typing indicator
  socket.on('typing', (params: { enquiryId: string; userId: string; isTyping: boolean }) => {
    const { enquiryId, userId: typingUserId, isTyping } = params;

    if (typingUserId !== userId) return; // Prevent spoofing

    const room = `enquiry:${enquiryId}`;
    socket.to(room).emit('chat:typing', {
      userId,
      isTyping,
      enquiryId,
    });
  });

  // Disconnect
  socket.on('disconnect', (reason) => {
    console.log(`[ChatService:3004] User ${userId} disconnected: ${reason}`);
  });
});

console.log(`[ChatService:3004] Real-time chat service running on port ${PORT}`);