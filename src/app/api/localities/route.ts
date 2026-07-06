import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractUserFromRequest, isAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const localities = await db.locality.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { businesses: { where: { isActive: true } } },
        },
      },
    });

    return NextResponse.json({ localities });
  } catch (error) {
    console.error('Get localities error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = extractUserFromRequest(request);
    if (error) return error;
    if (!isAdmin(user!.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, description, isActive, order } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const existing = await db.locality.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'Locality with this slug already exists' }, { status: 409 });
    }

    const locality = await db.locality.create({
      data: {
        name,
        slug,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
        order: order || 0,
      },
    });

    return NextResponse.json({ locality }, { status: 201 });
  } catch (error) {
    console.error('Create locality error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}