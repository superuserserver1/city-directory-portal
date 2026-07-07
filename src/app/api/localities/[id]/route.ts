import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractUserFromRequest, isAdmin } from '@/lib/auth';
import { generateRequestId, safeErrorResponse, isPrismaNotFoundError, isPrismaUniqueError } from '@/lib/validation';

export async function PUT(
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
    const { name, slug, description, isActive, order } = body;

    const locality = await db.locality.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(order !== undefined && { order }),
      },
    });

    return NextResponse.json({ locality });
  } catch (error) {
    console.error(`Update locality error [${requestId}]:`, error);
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ error: 'Locality not found', requestId }, { status: 404 });
    }
    if (isPrismaUniqueError(error)) {
      return NextResponse.json({ error: 'Locality with this slug already exists', requestId }, { status: 409 });
    }
    return NextResponse.json(safeErrorResponse(requestId), { status: 500 });
  }
}

export async function DELETE(
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
    await db.locality.delete({ where: { id } });

    return NextResponse.json({ message: 'Locality deleted' });
  } catch (error) {
    console.error(`Delete locality error [${requestId}]:`, error);
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ error: 'Locality not found', requestId }, { status: 404 });
    }
    return NextResponse.json(safeErrorResponse(requestId), { status: 500 });
  }
}