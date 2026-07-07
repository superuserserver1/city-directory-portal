import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractUserFromRequest, verifyPassword, hashPassword, invalidateUserTokens } from '@/lib/auth';
import { validatePassword, generateRequestId, safeErrorResponse } from '@/lib/validation';

export async function PUT(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const { user, error } = extractUserFromRequest(request);
    if (error) return error;

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required', requestId }, { status: 400 });
    }

    // Validate new password strength
    const passwordResult = validatePassword(newPassword);
    if (!passwordResult.valid) {
      return NextResponse.json({ error: passwordResult.error, requestId }, { status: 400 });
    }

    // Get user with password hash
    const dbUser = await db.user.findUnique({
      where: { id: user!.userId },
      select: { password: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found', requestId }, { status: 404 });
    }

    const isValid = await verifyPassword(currentPassword, dbUser.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect', requestId }, { status: 401 });
    }

    await db.user.update({
      where: { id: user!.userId },
      data: { password: await hashPassword(newPassword) },
    });

    // Invalidate all existing tokens for this user
    invalidateUserTokens(user!.userId);

    return NextResponse.json({ message: 'Password changed successfully', requestId });
  } catch (error) {
    console.error(`Change password error [${requestId}]:`, error);
    return NextResponse.json(safeErrorResponse(requestId), { status: 500 });
  }
}