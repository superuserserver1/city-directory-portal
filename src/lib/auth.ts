import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

// Generate a secure fallback secret at module load time (at least 32 chars)
function generateFallbackSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  const array = new Uint8Array(48);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  for (let i = 0; i < array.length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

const JWT_SECRET = process.env.JWT_SECRET || generateFallbackSecret();
const JWT_EXPIRES_IN = '7d';

// In-memory token version store (keyed by userId).
// Incremented on password change to invalidate existing tokens.
// Note: This resets on server restart. For production, use a persistent store.
const tokenVersions = new Map<string, number>();

/**
 * Get the current token version for a user.
 */
export function getTokenVersion(userId: string): number {
  return tokenVersions.get(userId) || 0;
}

/**
 * Increment the token version for a user (invalidates all existing tokens).
 */
export function invalidateUserTokens(userId: string): void {
  const current = tokenVersions.get(userId) || 0;
  tokenVersions.set(userId, current + 1);
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  tokenVersion?: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: JWTPayload): string {
  const version = getTokenVersion(payload.userId);
  const tokenPayload: JWTPayload & { tokenVersion: number } = {
    ...payload,
    tokenVersion: version,
  };
  return jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload & { tokenVersion?: number };
    // Check token version to detect invalidated tokens
    const currentVersion = getTokenVersion(decoded.userId);
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion < currentVersion) {
      return null; // Token has been invalidated
    }
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

export function extractUserFromRequest(request: NextRequest): { user: JWTPayload | null; error: Response | null } {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      user: null,
      error: new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return {
      user: null,
      error: new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  return { user: payload, error: null };
}

export async function getDbUser(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return user;
}

export function isAdmin(role: string): boolean {
  return role === 'ADMIN';
}

export function isBusinessOwner(role: string): boolean {
  return role === 'BUSINESS_OWNER';
}