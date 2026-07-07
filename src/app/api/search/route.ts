import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const type = searchParams.get('type') || 'all'; // all, products, businesses, amenities, localities
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!q || q.length < 2) {
      return NextResponse.json({ products: [], businesses: [], amenities: [], localities: [], query: q, total: 0 });
    }

    const results: Record<string, unknown[]> = {};

    // 1. Search Products & Services
    if (type === 'all' || type === 'products') {
      const products = await db.product.findMany({
        where: {
          AND: [
            { isActive: true },
            { OR: [
              { name: { contains: q } },
              { description: { contains: q } },
              { price: { contains: q } },
            ]},
          ],
        },
        select: {
          id: true, name: true, description: true, price: true, type: true,
          business: {
            select: {
              id: true, name: true, slug: true, type: true, rating: true, isVerified: true,
              locality: { select: { name: true } },
              category: { select: { name: true } },
            },
          },
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
      results.products = products;
    } else {
      results.products = [];
    }

    // 2. Search Businesses
    if (type === 'all' || type === 'businesses') {
      const businesses = await db.business.findMany({
        where: {
          AND: [
            { isActive: true },
            { type: 'BUSINESS' },
            { OR: [
              { name: { contains: q } },
              { description: { contains: q } },
              { address: { contains: q } },
              { phone: { contains: q } },
              { email: { contains: q } },
            ]},
          ],
        },
        select: {
          id: true, name: true, slug: true, type: true, rating: true, isVerified: true, isFeatured: true,
          address: true, phone: true,
          category: { select: { name: true, icon: true } },
          locality: { select: { name: true } },
          _count: { select: { products: true, reviews: true } },
        },
        take: 15,
        orderBy: [{ isFeatured: 'desc' }, { rating: 'desc' }],
      });
      results.businesses = businesses;
    } else {
      results.businesses = [];
    }

    // 3. Search Amenities (Railway station, Airport, Pool, Park, etc.)
    if (type === 'all' || type === 'amenities') {
      const amenities = await db.business.findMany({
        where: {
          AND: [
            { isActive: true },
            { type: 'AMENITY' },
            { OR: [
              { name: { contains: q } },
              { description: { contains: q } },
              { address: { contains: q } },
            ]},
          ],
        },
        select: {
          id: true, name: true, slug: true, type: true, rating: true, isVerified: true,
          address: true, phone: true,
          category: { select: { name: true, icon: true } },
          locality: { select: { name: true } },
        },
        take: 10,
        orderBy: { name: 'asc' },
      });
      results.amenities = amenities;
    } else {
      results.amenities = [];
    }

    // 4. Search Localities
    if (type === 'all' || type === 'localities') {
      const localities = await db.locality.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { description: { contains: q } },
            { slug: { contains: q } },
          ],
        },
        select: {
          id: true, name: true, slug: true, description: true,
          _count: { select: { businesses: true } },
        },
        take: 10,
        orderBy: { order: 'asc' },
      });
      results.localities = localities;
    } else {
      results.localities = [];
    }

    const total =
      (results.products as unknown[]).length +
      (results.businesses as unknown[]).length +
      (results.amenities as unknown[]).length +
      (results.localities as unknown[]).length;

    return NextResponse.json({ ...results, query: q, total });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}