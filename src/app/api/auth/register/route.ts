import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';
import {
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  sanitizeString,
  generateRequestId,
  safeErrorResponse,
  isPrismaUniqueError,
} from '@/lib/validation';

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const body = await request.json();
    const { name, email, password, phone } = body;

    // SECURITY: Role is NEVER accepted from user input. Always VISITOR for public registration.

    // Validate name
    const nameResult = validateName(name);
    if (!nameResult.valid) {
      return NextResponse.json({ error: nameResult.error, requestId }, { status: 400 });
    }

    // Validate email format
    const emailResult = validateEmail(email);
    if (!emailResult.valid) {
      return NextResponse.json({ error: emailResult.error, requestId }, { status: 400 });
    }

    // Validate password strength
    const passwordResult = validatePassword(password);
    if (!passwordResult.valid) {
      return NextResponse.json({ error: passwordResult.error, requestId }, { status: 400 });
    }

    // Validate phone (optional)
    if (phone !== undefined && phone !== null) {
      const phoneResult = validatePhone(phone);
      if (!phoneResult.valid) {
        return NextResponse.json({ error: phoneResult.error, requestId }, { status: 400 });
      }
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedName = sanitizeString(name, 100);
    const sanitizedPhone = phone ? sanitizeString(phone, 20) : null;

    const existingUser = await db.user.findUnique({ where: { email: sanitizedEmail } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists', requestId }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);

    const user = await db.user.create({
      data: {
        name: sanitizedName,
        email: sanitizedEmail,
        password: hashedPassword,
        phone: sanitizedPhone,
        role: 'VISITOR', // Always VISITOR for public registration
      },
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

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({ user, token }, { status: 201 });
  } catch (error) {
    console.error(`Register error [${requestId}]:`, error);
    if (isPrismaUniqueError(error)) {
      return NextResponse.json({ error: 'Email already exists', requestId }, { status: 409 });
    }
    return NextResponse.json(safeErrorResponse(requestId), { status: 500 });
  }
}