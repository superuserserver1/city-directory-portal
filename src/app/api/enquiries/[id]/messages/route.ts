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
      include: { business: { select: { ownerId: true } } },
    });

    if (!enquiry) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
    }

    if (
      !isAdmin(user!.role) &&
      enquiry.visitorId !== user!.userId &&
      enquiry.business.ownerId !== user!.userId
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const messages = await db.message.findMany({
      where: { enquiryId: id },
      include: {
        sender: { select: { id: true, name: true, email: true, role: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
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

    const isParticipant =
      enquiry.visitorId === user!.userId ||
      enquiry.business.ownerId === user!.userId ||
      isAdmin(user!.role);

    if (!isParticipant) {
      return NextResponse.json({ error: 'You are not a participant in this enquiry' }, { status: 403 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const message = await db.message.create({
      data: {
        content: content.trim(),
        enquiryId: id,
        senderId: user!.userId,
      },
      include: {
        sender: { select: { id: true, name: true, email: true, role: true, avatar: true } },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Create message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}