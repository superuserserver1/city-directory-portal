import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractUserFromRequest, isAdmin, isBusinessOwner } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const business = await db.business.findUnique({
      where: { id },
      include: {
        category: true,
        locality: true,
        owner: {
          select: { id: true, name: true, email: true, phone: true, avatar: true },
        },
        products: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { enquiries: true },
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json({ business });
  } catch (error) {
    console.error('Get business error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = extractUserFromRequest(request);
    if (error) return error;

    const { id } = await params;
    const body = await request.json();

    const existing = await db.business.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    if (!isAdmin(user!.role) && existing.ownerId !== user!.userId) {
      return NextResponse.json({ error: 'You can only edit your own businesses' }, { status: 403 });
    }

    const {
      name, slug, description, type, address, phone, email, website,
      lat, lng, logo, coverImage, rating, isVerified, isFeatured,
      isActive, categoryId, localityId,
    } = body;

    const business = await db.business.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(website !== undefined && { website }),
        ...(lat !== undefined && { lat }),
        ...(lng !== undefined && { lng }),
        ...(logo !== undefined && { logo }),
        ...(coverImage !== undefined && { coverImage }),
        ...(rating !== undefined && { rating }),
        ...(isVerified !== undefined && { isVerified }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(isActive !== undefined && { isActive }),
        ...(categoryId !== undefined && { categoryId }),
        ...(localityId !== undefined && { localityId }),
      },
    });

    return NextResponse.json({ business });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }
    console.error('Update business error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = extractUserFromRequest(request);
    if (error) return error;
    if (!isAdmin(user!.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    await db.business.delete({ where: { id } });

    return NextResponse.json({ message: 'Business deleted' });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }
    console.error('Delete business error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}