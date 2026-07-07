import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractUserFromRequest, isAdmin, isBusinessOwner } from '@/lib/auth';
import { generateRequestId, safeErrorResponse, sanitizeString } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  try {
    const { user, error } = extractUserFromRequest(request);
    if (error) return error;

    const { id } = await params;

    const enquiry = await db.enquiry.findUnique({
      where: { id },
      include: { business: { select: { ownerId: true } } },
    });

    if (!enquiry) {
      return NextResponse.json({ error: 'Enquiry not found', requestId }, { status: 404 });
    }

    if (
      !isAdmin(user!.role) &&
      enquiry.visitorId !== user!.userId &&
      enquiry.business.ownerId !== user!.userId
    ) {
      return NextResponse.json({ error: 'Access denied', requestId }, { status: 403 });
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
    console.error(`Get messages error [${requestId}]:`, error);
    return NextResponse.json(safeErrorResponse(requestId), { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  try {
    const { user, error } = extractUserFromRequest(request);
    if (error) return error;

    const { id } = await params;

    const enquiry = await db.enquiry.findUnique({
      where: { id },
      include: { business: { select: { ownerId: true } } },
    });

    if (!enquiry) {
      return NextResponse.json({ error: 'Enquiry not found', requestId }, { status: 404 });
    }

    const isParticipant =
      enquiry.visitorId === user!.userId ||
      enquiry.business.ownerId === user!.userId ||
      isAdmin(user!.role);

    if (!isParticipant) {
      return NextResponse.json({ error: 'You are not a participant in this enquiry', requestId }, { status: 403 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Message content is required', requestId }, { status: 400 });
    }

    if (content.length > 10000) {
      return NextResponse.json({ error: 'Message content is too long (max 10000 characters)', requestId }, { status: 400 });
    }

    const message = await db.message.create({
      data: {
        content: sanitizeString(content, 10000),
        enquiryId: id,
        senderId: user!.userId,
      },
      include: {
        sender: { select: { id: true, name: true, email: true, role: true, avatar: true } },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error(`Create message error [${requestId}]:`, error);
    return NextResponse.json(safeErrorResponse(requestId), { status: 500 });
  }
}