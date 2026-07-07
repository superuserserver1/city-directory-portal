import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractUserFromRequest, isAdmin, isBusinessOwner } from '@/lib/auth';
import { generateRequestId, safeErrorResponse, isPrismaNotFoundError, sanitizeString } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  try {
    const { id } = await params;

    // Determine user role for access control
    const { user } = extractUserFromRequest(request);
    const userRole = user?.role;
    const userId = user?.userId;

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
        images: {
          orderBy: { order: 'asc' },
        },
        hours: {
          orderBy: { day: 'asc' },
        },
        _count: {
          select: { enquiries: true, reviews: true, favorites: true },
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found', requestId }, { status: 404 });
    }

    // Access control: non-approved businesses are only visible to owner or admin
    if (business.status !== 'APPROVED') {
      if (!isAdmin(userRole) && !(isBusinessOwner(userRole) && business.ownerId === userId)) {
        return NextResponse.json({ error: 'Business not found', requestId }, { status: 404 });
      }
    }

    return NextResponse.json({ business });
  } catch (error) {
    console.error(`Get business error [${requestId}]:`, error);
    return NextResponse.json(safeErrorResponse(requestId), { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  try {
    const { user, error } = extractUserFromRequest(request);
    if (error) return error;

    const { id } = await params;
    const body = await request.json();

    const existing = await db.business.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Business not found', requestId }, { status: 404 });
    }

    if (!isAdmin(user!.role) && existing.ownerId !== user!.userId) {
      return NextResponse.json({ error: 'You can only edit your own businesses', requestId }, { status: 403 });
    }

    const {
      name, slug, description, aboutUs, type, address, phone, email, website,
      lat, lng, logo, coverImage, rating, isVerified, isFeatured,
      isActive, categoryId, localityId,
      facebook, instagram, twitter, youtube, whatsapp, googleMaps,
      status, rejectionReason,
    } = body;

    // Only admin can change status and rejectionReason
    const updateData: Record<string, unknown> = {
      ...(name !== undefined && { name: sanitizeString(name, 200) }),
      ...(slug !== undefined && { slug: sanitizeString(slug, 200) }),
      ...(description !== undefined && { description: description ? sanitizeString(description, 2000) : null }),
      ...(aboutUs !== undefined && { aboutUs: aboutUs ? sanitizeString(aboutUs, 5000) : null }),
      ...(type !== undefined && { type }),
      ...(address !== undefined && { address: address ? sanitizeString(address, 500) : null }),
      ...(phone !== undefined && { phone: phone ? sanitizeString(phone, 20) : null }),
      ...(email !== undefined && { email: email ? sanitizeString(email, 254) : null }),
      ...(website !== undefined && { website: website ? sanitizeString(website, 500) : null }),
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
      ...(facebook !== undefined && { facebook: facebook ? sanitizeString(facebook, 500) : null }),
      ...(instagram !== undefined && { instagram: instagram ? sanitizeString(instagram, 500) : null }),
      ...(twitter !== undefined && { twitter: twitter ? sanitizeString(twitter, 500) : null }),
      ...(youtube !== undefined && { youtube: youtube ? sanitizeString(youtube, 500) : null }),
      ...(whatsapp !== undefined && { whatsapp: whatsapp ? sanitizeString(whatsapp, 50) : null }),
      ...(googleMaps !== undefined && { googleMaps: googleMaps ? sanitizeString(googleMaps, 1000) : null }),
    };

    // Admin-only fields
    if (isAdmin(user!.role)) {
      if (status !== undefined) {
        updateData.status = status;
        // Auto-set isActive based on status
        if (status === 'APPROVED') {
          updateData.isActive = true;
          updateData.rejectionReason = null;
        } else if (status === 'REJECTED') {
          updateData.rejectionReason = rejectionReason || null;
        }
      }
      if (rejectionReason !== undefined && status === undefined) {
        updateData.rejectionReason = rejectionReason ? sanitizeString(rejectionReason, 1000) : null;
      }
    }

    const business = await db.business.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true } },
        locality: { select: { id: true, name: true, slug: true } },
        owner: { select: { id: true, name: true, email: true } },
        images: { orderBy: { order: 'asc' } },
        hours: { orderBy: { day: 'asc' } },
      },
    });

    return NextResponse.json({ business });
  } catch (error) {
    console.error(`Update business error [${requestId}]:`, error);
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ error: 'Business not found', requestId }, { status: 404 });
    }
    return NextResponse.json(safeErrorResponse(requestId), { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  try {
    const { user, error } = extractUserFromRequest(request);
    if (error) return error;

    const { id } = await params;

    const existing = await db.business.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Business not found', requestId }, { status: 404 });
    }

    // Allow admin to delete any, or owner to delete their own
    if (!isAdmin(user!.role) && existing.ownerId !== user!.userId) {
      return NextResponse.json({ error: 'You can only delete your own businesses', requestId }, { status: 403 });
    }

    await db.business.delete({ where: { id } });

    return NextResponse.json({ message: 'Business deleted' });
  } catch (error) {
    console.error(`Delete business error [${requestId}]:`, error);
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ error: 'Business not found', requestId }, { status: 404 });
    }
    return NextResponse.json(safeErrorResponse(requestId), { status: 500 });
  }
}