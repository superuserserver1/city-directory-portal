import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractUserFromRequest, isAdmin, isBusinessOwner } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId');
    const localityId = searchParams.get('localityId');
    const type = searchParams.get('type');
    const isFeatured = searchParams.get('isFeatured');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const where: Record<string, unknown> = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (localityId) where.localityId = localityId;
    if (type) where.type = type;
    if (isFeatured === 'true') where.isFeatured = true;

    const skip = (page - 1) * limit;

    const [businesses, total] = await Promise.all([
      db.business.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        include: {
          category: { select: { id: true, name: true, slug: true, icon: true } },
          locality: { select: { id: true, name: true, slug: true } },
          _count: {
            select: { products: true, enquiries: true },
          },
        },
      }),
      db.business.count({ where }),
    ]);

    return NextResponse.json({
      businesses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get businesses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = extractUserFromRequest(request);
    if (error) return error;
    if (!isAdmin(user!.role) && !isBusinessOwner(user!.role)) {
      return NextResponse.json({ error: 'Admin or business owner access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name, slug, description, type, address, phone, email, website,
      lat, lng, logo, coverImage, rating, isVerified, isFeatured,
      isActive, categoryId, localityId, ownerId,
    } = body;

    if (!name || !slug || !categoryId || !localityId) {
      return NextResponse.json({ error: 'Name, slug, categoryId, and localityId are required' }, { status: 400 });
    }

    const existing = await db.business.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'Business with this slug already exists' }, { status: 409 });
    }

    const business = await db.business.create({
      data: {
        name,
        slug,
        description: description || null,
        type: type || 'BUSINESS',
        address: address || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        lat: lat || null,
        lng: lng || null,
        logo: logo || null,
        coverImage: coverImage || null,
        rating: rating || 0,
        isVerified: isVerified || false,
        isFeatured: isFeatured || false,
        isActive: isActive !== undefined ? isActive : true,
        categoryId,
        localityId,
        ownerId: ownerId || user!.userId,
      },
    });

    return NextResponse.json({ business }, { status: 201 });
  } catch (error) {
    console.error('Create business error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}