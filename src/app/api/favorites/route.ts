import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractUserFromRequest } from '@/lib/auth';
import { generateRequestId, safeErrorResponse } from '@/lib/validation';

export async function GET(req: NextRequest) {
  const requestId = generateRequestId();
  try {
    const { user, error } = extractUserFromRequest(req);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (businessId) {
      const favorite = await db.favorite.findUnique({
        where: { userId_businessId: { userId: user!.userId, businessId } },
      });
      return NextResponse.json({ isFavorited: !!favorite });
    }

    const favorites = await db.favorite.findMany({
      where: { userId: user!.userId },
      include: {
        business: {
          include: { category: true, locality: true, _count: { select: { products: true, enquiries: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ favorites });
  } catch (err) {
    console.error(`Favorites error [${requestId}]:`, err);
    return NextResponse.json(safeErrorResponse(requestId), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  try {
    const { user, error } = extractUserFromRequest(req);
    if (error) return error;

    const { businessId } = await req.json();
    if (!businessId) return NextResponse.json({ error: 'Business ID required', requestId }, { status: 400 });

    const existing = await db.favorite.findUnique({
      where: { userId_businessId: { userId: user!.userId, businessId } },
    });

    if (existing) {
      await db.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ isFavorited: false });
    }

    await db.favorite.create({ data: { userId: user!.userId, businessId } });
    return NextResponse.json({ isFavorited: true });
  } catch (err) {
    console.error(`Favorites POST error [${requestId}]:`, err);
    return NextResponse.json(safeErrorResponse(requestId), { status: 500 });
  }
}