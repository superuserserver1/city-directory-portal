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
    const { id } = await params;

    const hours = await db.businessHour.findMany({
      where: { businessId: id },
      orderBy: { day: 'asc' },
    });

    return NextResponse.json({ hours });
  } catch (error) {
    console.error(`Get business hours error [${requestId}]:`, error);
    return NextResponse.json(safeErrorResponse(requestId), { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  try {
    const { user, error } = extractUserFromRequest(request);
    if (error) return error;
    if (!isAdmin(user!.role) && !isBusinessOwner(user!.role)) {
      return NextResponse.json({ error: 'Admin or business owner access required', requestId }, { status: 403 });
    }

    const { id: businessId } = await params;

    const business = await db.business.findUnique({ where: { id: businessId } });
    if (!business) {
      return NextResponse.json({ error: 'Business not found', requestId }, { status: 404 });
    }

    if (!isAdmin(user!.role) && business.ownerId !== user!.userId) {
      return NextResponse.json({ error: 'You can only edit hours for your own businesses', requestId }, { status: 403 });
    }

    const body = await request.json();
    const { hours } = body;

    if (!Array.isArray(hours)) {
      return NextResponse.json({ error: 'hours array is required', requestId }, { status: 400 });
    }

    // Validate each hour entry
    for (const h of hours) {
      if (typeof h.day !== 'number' || h.day < 0 || h.day > 6) {
        return NextResponse.json({ error: 'Each hour entry must have a valid day (0-6)', requestId }, { status: 400 });
      }
      if (!h.isClosed && (!h.openTime || !h.closeTime)) {
        return NextResponse.json({ error: `Day ${h.day} must have openTime and closeTime if not closed`, requestId }, { status: 400 });
      }
      // Validate time format HH:MM
      if (h.openTime && !/^\d{2}:\d{2}$/.test(h.openTime)) {
        return NextResponse.json({ error: `Invalid openTime format for day ${h.day}, use HH:MM`, requestId }, { status: 400 });
      }
      if (h.closeTime && !/^\d{2}:\d{2}$/.test(h.closeTime)) {
        return NextResponse.json({ error: `Invalid closeTime format for day ${h.day}, use HH:MM`, requestId }, { status: 400 });
      }
    }

    // Delete existing hours and recreate (atomic replacement)
    await db.businessHour.deleteMany({ where: { businessId } });

    await db.businessHour.createMany({
      data: hours.map((h: { day: number; openTime?: string; closeTime?: string; isClosed?: boolean }) => ({
        businessId,
        day: h.day,
        openTime: h.isClosed ? null : (sanitizeString(h.openTime, 5) || null),
        closeTime: h.isClosed ? null : (sanitizeString(h.closeTime, 5) || null),
        isClosed: h.isClosed !== undefined ? h.isClosed : false,
      })),
    });

    const updatedHours = await db.businessHour.findMany({
      where: { businessId },
      orderBy: { day: 'asc' },
    });

    return NextResponse.json({
      message: 'Business hours updated',
      hours: updatedHours,
    });
  } catch (error) {
    console.error(`Update business hours error [${requestId}]:`, error);
    return NextResponse.json(safeErrorResponse(requestId), { status: 500 });
  }
}