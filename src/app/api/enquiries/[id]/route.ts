import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractUserFromRequest, isAdmin, isBusinessOwner } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = extractUserFromRequest(request);
    if (error) return error;

    const { id } = await params;

    const enquiry = await db.enquiry.findUnique({
      where: { id },
      include: {
        business: true,
        visitor: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        messages: {
          include: {
            sender: { select: { id: true, name: true, email: true, role: true, avatar: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!enquiry) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
    }

    // Visitors can only see their own enquiries, owners their business enquiries
    if (
      !isAdmin(user!.role) &&
      enquiry.visitorId !== user!.userId &&
      enquiry.business.ownerId !== user!.userId
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ enquiry });
  } catch (error) {
    console.error('Get enquiry error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = extractUserFromRequest(request);
    if (error) return error;

    const { id } = await params;
    const enquiry = await db.enquiry.findUnique({
      where: { id },
      include: { business: { select: { ownerId: true } } },
    });

    if (!enquiry) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
    }

    const canUpdate =
      isAdmin(user!.role) ||
      enquiry.business.ownerId === user!.userId ||
      enquiry.visitorId === user!.userId;

    if (!canUpdate) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !['OPEN', 'IN_PROGRESS', 'CLOSED'].includes(status)) {
      return NextResponse.json({ error: 'Valid status is required (OPEN, IN_PROGRESS, CLOSED)' }, { status: 400 });
    }

    const updated = await db.enquiry.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ enquiry: updated });
  } catch (error) {
    console.error('Update enquiry error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}