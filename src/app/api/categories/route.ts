import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractUserFromRequest, isAdmin } from '@/lib/auth';
import { generateRequestId, safeErrorResponse, isPrismaUniqueError, sanitizeString } from '@/lib/validation';

export async function GET() {
  const requestId = generateRequestId();
  try {
    const categories = await db.category.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { businesses: { where: { isActive: true } } },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error(`Get categories error [${requestId}]:`, error);
    return NextResponse.json(safeErrorResponse(requestId), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const { user, error } = extractUserFromRequest(request);
    if (error) return error;
    if (!isAdmin(user!.role)) {
      return NextResponse.json({ error: 'Admin access required', requestId }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, icon, description, isActive, order } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required', requestId }, { status: 400 });
    }
    if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
      return NextResponse.json({ error: 'Slug is required', requestId }, { status: 400 });
    }

    const existing = await db.category.findUnique({ where: { slug: slug.trim() } });
    if (existing) {
      return NextResponse.json({ error: 'Category with this slug already exists', requestId }, { status: 409 });
    }

    const category = await db.category.create({
      data: {
        name: sanitizeString(name, 100),
        slug: sanitizeString(slug, 100),
        icon: icon || null,
        description: description ? sanitizeString(description, 500) : null,
        isActive: isActive !== undefined ? isActive : true,
        order: order || 0,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error(`Create category error [${requestId}]:`, error);
    if (isPrismaUniqueError(error)) {
      return NextResponse.json({ error: 'Category with this slug already exists', requestId }, { status: 409 });
    }
    return NextResponse.json(safeErrorResponse(requestId), { status: 500 });
  }
}