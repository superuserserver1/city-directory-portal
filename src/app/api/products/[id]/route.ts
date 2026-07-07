import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractUserFromRequest, isAdmin, isBusinessOwner } from '@/lib/auth';
import { generateRequestId, safeErrorResponse, isPrismaNotFoundError, sanitizeString } from '@/lib/validation';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  try {
    const { user, error } = extractUserFromRequest(request);
    if (error) return error;

    const { id } = await params;
    const product = await db.product.findUnique({
      where: { id },
      include: { business: { select: { ownerId: true } } },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found', requestId }, { status: 404 });
    }

    if (!isAdmin(user!.role) && product.business.ownerId !== user!.userId) {
      return NextResponse.json({ error: 'You can only edit products of your own businesses', requestId }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, price, image, type, isActive } = body;

    const updated = await db.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: sanitizeString(name, 200) }),
        ...(description !== undefined && { description: sanitizeString(description, 1000) }),
        ...(price !== undefined && { price: sanitizeString(price, 50) }),
        ...(image !== undefined && { image }),
        ...(type !== undefined && { type }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ product: updated });
  } catch (error) {
    console.error(`Update product error [${requestId}]:`, error);
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ error: 'Product not found', requestId }, { status: 404 });
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
    const product = await db.product.findUnique({
      where: { id },
      include: { business: { select: { ownerId: true } } },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found', requestId }, { status: 404 });
    }

    if (!isAdmin(user!.role) && product.business.ownerId !== user!.userId) {
      return NextResponse.json({ error: 'You can only delete products of your own businesses', requestId }, { status: 403 });
    }

    await db.product.delete({ where: { id } });

    return NextResponse.json({ message: 'Product deleted' });
  } catch (error) {
    console.error(`Delete product error [${requestId}]:`, error);
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ error: 'Product not found', requestId }, { status: 404 });
    }
    return NextResponse.json(safeErrorResponse(requestId), { status: 500 });
  }
}