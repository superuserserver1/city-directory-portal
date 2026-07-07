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

    const images = await db.businessImage.findMany({
      where: { businessId: id },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ images });
  } catch (error) {
    console.error(`Get business images error [${requestId}]:`, error);
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
    if (!isAdmin(user!.role) && !isBusinessOwner(user!.role)) {
      return NextResponse.json({ error: 'Admin or business owner access required', requestId }, { status: 403 });
    }

    const { id: businessId } = await params;

    const business = await db.business.findUnique({ where: { id: businessId } });
    if (!business) {
      return NextResponse.json({ error: 'Business not found', requestId }, { status: 404 });
    }

    if (!isAdmin(user!.role) && business.ownerId !== user!.userId) {
      return NextResponse.json({ error: 'You can only add images to your own businesses', requestId }, { status: 403 });
    }

    const body = await request.json();
    const { images } = body;

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'images array is required with at least one image', requestId }, { status: 400 });
    }

    // Validate each image
    for (const img of images) {
      if (!img.url || typeof img.url !== 'string' || img.url.trim().length === 0) {
        return NextResponse.json({ error: 'Each image must have a url', requestId }, { status: 400 });
      }
    }

    const created = await db.businessImage.createMany({
      data: images.map((img: { url: string; caption?: string; order?: number }, idx: number) => ({
        businessId,
        url: sanitizeString(img.url, 1000),
        caption: img.caption ? sanitizeString(img.caption, 200) : null,
        order: img.order !== undefined ? img.order : idx,
      })),
    });

    // Return all images for this business
    const allImages = await db.businessImage.findMany({
      where: { businessId },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({
      message: `${created.count} image(s) added`,
      images: allImages,
    }, { status: 201 });
  } catch (error) {
    console.error(`Add business image error [${requestId}]:`, error);
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
    if (!isAdmin(user!.role) && !isBusinessOwner(user!.role)) {
      return NextResponse.json({ error: 'Admin or business owner access required', requestId }, { status: 403 });
    }

    const { id: businessId } = await params;
    const body = await request.json();
    const { imageId } = body;

    if (!imageId || typeof imageId !== 'string') {
      return NextResponse.json({ error: 'imageId is required', requestId }, { status: 400 });
    }

    // Verify ownership
    if (!isAdmin(user!.role)) {
      const business = await db.business.findUnique({ where: { id: businessId } });
      if (!business || business.ownerId !== user!.userId) {
        return NextResponse.json({ error: 'You can only delete images from your own businesses', requestId }, { status: 403 });
      }
    }

    // Verify the image belongs to this business
    const image = await db.businessImage.findFirst({ where: { id: imageId, businessId } });
    if (!image) {
      return NextResponse.json({ error: 'Image not found', requestId }, { status: 404 });
    }

    await db.businessImage.delete({ where: { id: imageId } });

    return NextResponse.json({ message: 'Image deleted' });
  } catch (error) {
    console.error(`Delete business image error [${requestId}]:`, error);
    return NextResponse.json(safeErrorResponse(requestId), { status: 500 });
  }
}