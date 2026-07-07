import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractUserFromRequest, isAdmin } from '@/lib/auth';
import { generateRequestId, safeErrorResponse, isPrismaNotFoundError, sanitizeString } from '@/lib/validation';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  try {
    const { user, error } = extractUserFromRequest(request);
    if (error) return error;
    if (!isAdmin(user!.role)) {
      return NextResponse.json({ error: 'Admin access required', requestId }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, reason } = body;

    const existing = await db.business.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Business not found', requestId }, { status: 404 });
    }

    if (existing.status === 'APPROVED' && status !== 'REJECTED') {
      return NextResponse.json({ error: 'Business is already approved', requestId }, { status: 400 });
    }

    const action = status === 'REJECTED' ? 'REJECTED' : 'APPROVED';
    const sanitizedReason = reason ? sanitizeString(reason, 1000) : null;

    const business = await db.business.update({
      where: { id },
      data: {
        status: action,
        isActive: action === 'APPROVED',
        rejectionReason: action === 'REJECTED' ? sanitizedReason : null,
      },
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true } },
        locality: { select: { id: true, name: true, slug: true } },
        owner: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    return NextResponse.json({
      message: action === 'APPROVED' ? 'Business approved' : 'Business rejected',
      business,
    });
  } catch (error) {
    console.error(`Approve/reject business error [${requestId}]:`, error);
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ error: 'Business not found', requestId }, { status: 404 });
    }
    return NextResponse.json(safeErrorResponse(requestId), { status: 500 });
  }
}