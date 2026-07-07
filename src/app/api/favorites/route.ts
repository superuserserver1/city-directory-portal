import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await extractUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (businessId) {
      const favorite = await db.favorite.findUnique({
        where: { userId_businessId: { userId: user.id, businessId } },
      });
      return NextResponse.json({ isFavorited: !!favorite });
    }

    const favorites = await db.favorite.findMany({
      where: { userId: user.id },
      include: {
        business: {
          include: { category: true, locality: true, _count: { select: { products: true, enquiries: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ favorites });
  } catch (err: unknown) {
    console.error('Favorites error:', err);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await extractUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { businessId } = await req.json();
    if (!businessId) return NextResponse.json({ error: 'Business ID required' }, { status: 400 });

    const existing = await db.favorite.findUnique({
      where: { userId_businessId: { userId: user.id, businessId } },
    });

    if (existing) {
      await db.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ isFavorited: false });
    }

    await db.favorite.create({ data: { userId: user.id, businessId } });
    return NextResponse.json({ isFavorited: true });
  } catch (err: unknown) {
    console.error('Favorites POST error:', err);
    return NextResponse.json({ error: 'Failed to toggle favorite' }, { status: 500 });
  }
}