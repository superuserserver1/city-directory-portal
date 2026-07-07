import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractUserFromRequest, isAdmin, isBusinessOwner } from '@/lib/auth';
import { generateRequestId, safeErrorResponse } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const { user, error } = extractUserFromRequest(request);
    if (error) return error;

    let enquiries;

    if (isAdmin(user!.role)) {
      enquiries = await db.enquiry.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          business: { select: { id: true, name: true, slug: true } },
          visitor: { select: { id: true, name: true, email: true } },
          _count: { select: { messages: true } },
        },
      });
    } else if (isBusinessOwner(user!.role)) {
      const businesses = await db.business.findMany({
        where: { ownerId: user!.userId },
        select: { id: true },
      });
      const businessIds = businesses.map(b => b.id);

      enquiries = await db.enquiry.findMany({
        where: { businessId: { in: businessIds } },
        orderBy: { createdAt: 'desc' },
        include: {
          business: { select: { id: true, name: true, slug: true } },
          visitor: { select: { id: true, name: true, email: true } },
          _count: { select: { messages: true } },
        },
      });
    } else {
      enquiries = await db.enquiry.findMany({
        where: { visitorId: user!.userId },
        orderBy: { createdAt: 'desc' },
        include: {
          business: { select: { id: true, name: true, slug: true } },
          visitor: { select: { id: true, name: true, email: true } },
          _count: { select: { messages: true } },
        },
      });
    }

    return NextResponse.json({ enquiries });
  } catch (error) {
    console.error(`Get enquiries error [${requestId}]:`, error);
    return NextResponse.json(safeErrorResponse(requestId), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const { user, error } = extractUserFromRequest(request);
    if (error) return error;

    const body = await request.json();
    const { businessId, name, email, phone, message } = body;

    if (!businessId || typeof businessId !== 'string') {
      return NextResponse.json({ error: 'Business ID is required', requestId }, { status: 400 });
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required', requestId }, { status: 400 });
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: 'Message is too long (max 5000 characters)', requestId }, { status: 400 });
    }

    const business = await db.business.findUnique({ where: { id: businessId } });
    if (!business) {
      return NextResponse.json({ error: 'Business not found', requestId }, { status: 404 });
    }

    const enquiry = await db.enquiry.create({
      data: {
        businessId,
        visitorId: user!.userId,
        name: name ? sanitizeString(name, 100) : user!.email,
        email: email ? sanitizeString(email, 254) : user!.email,
        phone: phone ? sanitizeString(phone, 20) : null,
        message: sanitizeString(message, 5000),
        status: 'OPEN',
      },
    });

    return NextResponse.json({ enquiry }, { status: 201 });
  } catch (error) {
    console.error(`Create enquiry error [${requestId}]:`, error);
    return NextResponse.json(safeErrorResponse(requestId), { status: 500 });
  }
}