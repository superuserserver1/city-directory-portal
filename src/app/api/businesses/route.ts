import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractUserFromRequest, isAdmin, isBusinessOwner } from '@/lib/auth';
import { generateRequestId, safeErrorResponse, isPrismaUniqueError, sanitizeString, validateName, validateEmail, validatePhone } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId');
    const localityId = searchParams.get('localityId');
    const type = searchParams.get('type');
    const isFeatured = searchParams.get('isFeatured');
    const statusFilter = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 100);

    // Determine user role for access control
    const { user } = extractUserFromRequest(request);
    const userRole = user?.role;
    const userId = user?.userId;

    const where: Record<string, unknown> = { isActive: true };

    // Role-based status filtering
    if (isAdmin(userRole)) {
      // Admin can see everything, optional status filter
      if (statusFilter) {
        where.status = statusFilter;
      }
    } else if (isBusinessOwner(userRole) && userId) {
      // Business owner can see their own PENDING + all APPROVED
      if (statusFilter) {
        where.status = statusFilter;
      } else {
        where.OR = [
          { status: 'APPROVED' },
          { status: 'PENDING', ownerId: userId },
        ];
      }
    } else {
      // Visitors only see APPROVED
      where.status = 'APPROVED';
    }

    if (search) {
      const searchClause = {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
        ],
      };
      if (where.OR && Array.isArray(where.OR)) {
        // Merge search into existing OR (for business owners)
        // We need a more complex where clause
        const existingOr = where.OR;
        delete where.OR;
        where.AND = [
          { OR: existingOr },
          searchClause,
        ];
      } else {
        where.OR = searchClause.OR;
      }
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
          owner: {
            select: { id: true, name: true, email: true },
          },
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
    console.error(`Get businesses error [${requestId}]:`, error);
    return NextResponse.json(safeErrorResponse(requestId), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const { user, error } = extractUserFromRequest(request);
    if (error) return error;
    if (!isAdmin(user!.role) && !isBusinessOwner(user!.role)) {
      return NextResponse.json({ error: 'Admin or business owner access required', requestId }, { status: 403 });
    }

    const body = await request.json();
    const {
      name, slug, description, aboutUs, type, address, phone, email, website,
      lat, lng, logo, coverImage, rating, isVerified, isFeatured,
      categoryId, localityId, ownerId,
      facebook, instagram, twitter, youtube, whatsapp, googleMaps,
      hours, images,
    } = body;

    // Validate required fields
    const nameCheck = validateName(name);
    if (!nameCheck.valid) {
      return NextResponse.json({ error: nameCheck.error, requestId }, { status: 400 });
    }

    if (!slug || typeof slug !== 'string' || slug.trim().length < 2) {
      return NextResponse.json({ error: 'Slug is required (min 2 characters)', requestId }, { status: 400 });
    }
    if (!categoryId || typeof categoryId !== 'string') {
      return NextResponse.json({ error: 'Category ID is required', requestId }, { status: 400 });
    }
    if (!localityId || typeof localityId !== 'string') {
      return NextResponse.json({ error: 'Locality ID is required', requestId }, { status: 400 });
    }

    // Validate optional email
    if (email) {
      const emailCheck = validateEmail(email);
      if (!emailCheck.valid) {
        return NextResponse.json({ error: emailCheck.error, requestId }, { status: 400 });
      }
    }

    // Validate optional phone
    if (phone) {
      const phoneCheck = validatePhone(phone);
      if (!phoneCheck.valid) {
        return NextResponse.json({ error: phoneCheck.error, requestId }, { status: 400 });
      }
    }

    // Determine status based on role
    const isOwnerCreating = !isAdmin(user!.role);
    const businessStatus = isOwnerCreating ? 'PENDING' : 'APPROVED';
    const businessIsActive = isOwnerCreating ? false : true;

    const sanitizedName = sanitizeString(name, 200);
    const sanitizedSlug = sanitizeString(slug, 200);
    const sanitizedDescription = description ? sanitizeString(description, 2000) : null;
    const sanitizedAboutUs = aboutUs ? sanitizeString(aboutUs, 5000) : null;
    const sanitizedAddress = address ? sanitizeString(address, 500) : null;
    const sanitizedPhone = phone ? sanitizeString(phone, 20) : null;
    const sanitizedEmail = email ? sanitizeString(email, 254) : null;
    const sanitizedWebsite = website ? sanitizeString(website, 500) : null;
    const sanitizedFacebook = facebook ? sanitizeString(facebook, 500) : null;
    const sanitizedInstagram = instagram ? sanitizeString(instagram, 500) : null;
    const sanitizedTwitter = twitter ? sanitizeString(twitter, 500) : null;
    const sanitizedYoutube = youtube ? sanitizeString(youtube, 500) : null;
    const sanitizedWhatsapp = whatsapp ? sanitizeString(whatsapp, 50) : null;
    const sanitizedGoogleMaps = googleMaps ? sanitizeString(googleMaps, 1000) : null;

    const existing = await db.business.findUnique({ where: { slug: sanitizedSlug } });
    if (existing) {
      return NextResponse.json({ error: 'Business with this slug already exists', requestId }, { status: 409 });
    }

    const business = await db.business.create({
      data: {
        name: sanitizedName,
        slug: sanitizedSlug,
        description: sanitizedDescription,
        aboutUs: sanitizedAboutUs,
        type: type || 'BUSINESS',
        address: sanitizedAddress,
        phone: sanitizedPhone,
        email: sanitizedEmail,
        website: sanitizedWebsite,
        lat: lat || null,
        lng: lng || null,
        logo: logo || null,
        coverImage: coverImage || null,
        rating: rating || 0,
        isVerified: isVerified || false,
        isFeatured: isFeatured || false,
        isActive: businessIsActive,
        status: businessStatus,
        categoryId,
        localityId,
        ownerId: ownerId || user!.userId,
        facebook: sanitizedFacebook,
        instagram: sanitizedInstagram,
        twitter: sanitizedTwitter,
        youtube: sanitizedYoutube,
        whatsapp: sanitizedWhatsapp,
        googleMaps: sanitizedGoogleMaps,
      },
    });

    // Create business hours if provided
    if (Array.isArray(hours) && hours.length > 0) {
      await db.businessHour.createMany({
        data: hours.map((h: { day: number; openTime?: string; closeTime?: string; isClosed?: boolean }) => ({
          businessId: business.id,
          day: h.day,
          openTime: h.openTime || null,
          closeTime: h.closeTime || null,
          isClosed: h.isClosed !== undefined ? h.isClosed : false,
        })),
      });
    }

    // Create business images if provided
    if (Array.isArray(images) && images.length > 0) {
      await db.businessImage.createMany({
        data: images.map((img: { url: string; caption?: string; order?: number }, idx: number) => ({
          businessId: business.id,
          url: sanitizeString(img.url, 1000),
          caption: img.caption ? sanitizeString(img.caption, 200) : null,
          order: img.order !== undefined ? img.order : idx,
        })),
      });
    }

    // Fetch the complete business with relations
    const createdBusiness = await db.business.findUnique({
      where: { id: business.id },
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true } },
        locality: { select: { id: true, name: true, slug: true } },
        owner: { select: { id: true, name: true, email: true } },
        images: { orderBy: { order: 'asc' } },
        hours: { orderBy: { day: 'asc' } },
      },
    });

    return NextResponse.json({ business: createdBusiness }, { status: 201 });
  } catch (error) {
    console.error(`Create business error [${requestId}]:`, error);
    if (isPrismaUniqueError(error)) {
      return NextResponse.json({ error: 'A record with this identifier already exists', requestId }, { status: 409 });
    }
    return NextResponse.json(safeErrorResponse(requestId), { status: 500 });
  }
}