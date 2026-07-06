import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractUserFromRequest, isAdmin, isBusinessOwner } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = extractUserFromRequest(request);
    if (error) return error;

    const { id } = await params;
    const product = await db.product.findUnique({
      where: { id },
      include: { business: { select: { ownerId: true } } },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (!isAdmin(user!.role) && product.business.ownerId !== user!.userId) {
      return NextResponse.json({ error: 'You can only edit products of your own businesses' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, price, image, type, isActive } = body;

    const updated = await db.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(image !== undefined && { image }),
        ...(type !== undefined && { type }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ product: updated });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    console.error('Update product error:', error);
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

    const { id } = await params;
    const product = await db.product.findUnique({
      where: { id },
      include: { business: { select: { ownerId: true } } },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (!isAdmin(user!.role) && product.business.ownerId !== user!.userId) {
      return NextResponse.json({ error: 'You can only delete products of your own businesses' }, { status: 403 });
    }

    await db.product.delete({ where: { id } });

    return NextResponse.json({ message: 'Product deleted' });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}