import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractUserFromRequest, isAdmin, isBusinessOwner } from '@/lib/auth';
import { generateRequestId, safeErrorResponse, sanitizeString } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  try {
    const { id } = await params;

    const products = await db.product.findMany({
      where: { businessId: id, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error(`Get products error [${requestId}]:`, error);
    return NextResponse.json(safeErrorResponse(requestId), { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  try {
    const { user, error } = extractUserFromRequest(request);
    if (error) return error;
    if (!isAdmin(user!.role) && !isBusinessOwner(user!.role)) {
      return NextResponse.json({ error: 'Admin or business owner access required', requestId }, { status: 403 });
    }

    const { id: businessId } = await params;

    const business = await db.business.findUnique({ where: { id: businessId } });
    if (!business) {
      return NextResponse.json({ error: 'Business not found', requestId }, { status: 404 });
    }

    if (!isAdmin(user!.role) && business.ownerId !== user!.userId) {
      return NextResponse.json({ error: 'You can only add products to your own businesses', requestId }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, price, priceUnit, image, images, type, isActive } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Product name is required', requestId }, { status: 400 });
    }

    // Validate images is a JSON-stringifiable array if provided
    let imagesJson = '[]';
    if (images !== undefined) {
      if (Array.isArray(images)) {
        imagesJson = JSON.stringify(images);
      } else if (typeof images === 'string') {
        // Validate it's valid JSON
        try {
          JSON.parse(images);
          imagesJson = images;
        } catch {
          return NextResponse.json({ error: 'images must be a valid JSON array or array of strings', requestId }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: 'images must be an array or JSON string', requestId }, { status: 400 });
      }
    }

    const product = await db.product.create({
      data: {
        name: sanitizeString(name, 200),
        description: description ? sanitizeString(description, 1000) : null,
        price: price ? sanitizeString(price, 50) : null,
        priceUnit: priceUnit ? sanitizeString(priceUnit, 50) : null,
        image: image || null,
        images: imagesJson,
        type: type || 'PRODUCT',
        isActive: isActive !== undefined ? isActive : true,
        businessId,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error(`Create product error [${requestId}]:`, error);
    return NextResponse.json(safeErrorResponse(requestId), { status: 500 });
  }
}