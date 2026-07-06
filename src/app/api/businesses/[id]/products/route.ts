import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractUserFromRequest, isAdmin, isBusinessOwner } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const products = await db.product.findMany({
      where: { businessId: id, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = extractUserFromRequest(request);
    if (error) return error;
    if (!isAdmin(user!.role) && !isBusinessOwner(user!.role)) {
      return NextResponse.json({ error: 'Admin or business owner access required' }, { status: 403 });
    }

    const { id: businessId } = await params;

    const business = await db.business.findUnique({ where: { id: businessId } });
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    if (!isAdmin(user!.role) && business.ownerId !== user!.userId) {
      return NextResponse.json({ error: 'You can only add products to your own businesses' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, price, image, type, isActive } = body;

    if (!name) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    const product = await db.product.create({
      data: {
        name,
        description: description || null,
        price: price || null,
        image: image || null,
        type: type || 'PRODUCT',
        isActive: isActive !== undefined ? isActive : true,
        businessId,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}