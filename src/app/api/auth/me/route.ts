import { NextRequest, NextResponse } from 'next/server';
import { extractUserFromRequest, getDbUser } from '@/lib/auth';

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