import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    if (!q || q.length < 2) return NextResponse.json({ results: [] });

    const businesses = await db.business.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { name: { contains: q } },
              { description: { contains: q } },
            ],
          },
        ],
      },
      select: {
        id: true, name: true, slug: true, type: true, rating: true,
        category: { select: { name: true } },
        locality: { select: { name: true } },
      },
      take: 8,
      orderBy: { isFeatured: 'desc' },
    });

    const results = businesses.map((b) => ({
      id: b.id,
      name: b.name,
      type: b.type,
      rating: b.rating,
      category: b.category.name,
      locality: b.locality.name,
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}