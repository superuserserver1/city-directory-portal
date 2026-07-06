import { NextRequest, NextResponse } from 'next/server';
import { extractUserFromRequest, getDbUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = extractUserFromRequest(request);
    if (error) return error;

    const dbUser = await getDbUser(user!.userId);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: dbUser });
  } catch (error) {
    console.error('Get me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, error } = extractUserFromRequest(request);
    if (error) return error;

    const body = await request.json();
    const { name, phone, avatar } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;

    const updatedUser = await db.user.update({
      where: { id: user!.userId },
      data: updateData,
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

    return NextResponse.json({ user: updatedUser });
  } catch (err) {
    console.error('Update me error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}