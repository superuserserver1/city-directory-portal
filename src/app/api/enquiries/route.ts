import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractUserFromRequest, isAdmin, isBusinessOwner } from '@/lib/auth';

export async function GET(request: NextRequest) {
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
    console.error('Get enquiries error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = extractUserFromRequest(request);
    if (error) return error;

    const body = await request.json();
    const { businessId, name, email, phone, message } = body;

    if (!businessId || !message) {
      return NextResponse.json({ error: 'Business ID and message are required' }, { status: 400 });
    }

    const business = await db.business.findUnique({ where: { id: businessId } });
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const enquiry = await db.enquiry.create({
      data: {
        businessId,
        visitorId: user!.userId,
        name: name || user!.email,
        email: email || user!.email,
        phone: phone || null,
        message,
        status: 'OPEN',
      },
    });

    return NextResponse.json({ enquiry }, { status: 201 });
  } catch (error) {
    console.error('Create enquiry error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}