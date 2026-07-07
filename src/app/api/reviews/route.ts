import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractUserFromRequest } from '@/lib/auth';
import { generateRequestId, safeErrorResponse, sanitizeString } from '@/lib/validation';

export async function GET(req: NextRequest) {
  const requestId = generateRequestId();
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return NextResponse.json({ error: 'Business ID required', requestId }, { status: 400 });

    const [reviews, stats] = await Promise.all([
      db.review.findMany({
        where: { businessId },
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      db.review.aggregate({
        where: { businessId },
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    let userReviewId: string | null = null;
    try {
      const authResult = extractUserFromRequest(req);
      if (authResult.user) {
        const userReview = await db.review.findUnique({
          where: { userId_businessId: { userId: authResult.user.userId, businessId } },
        });
        userReviewId = userReview?.id || null;
      }
    } catch {
      // Not authenticated - skip user review check
    }

    return NextResponse.json({
      reviews,
      averageRating: stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : 0,
      totalReviews: stats._count,
      userReviewId,
    });
  } catch (err) {
    console.error(`Reviews GET error [${requestId}]:`, err);
    return NextResponse.json(safeErrorResponse(requestId), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  try {
    const { user, error } = extractUserFromRequest(req);
    if (error) return error;

    const body = await req.json();
    const { businessId, rating, comment } = body;

    if (!businessId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating (1-5) and business ID required', requestId }, { status: 400 });
    }

    if (comment && typeof comment === 'string' && comment.length > 500) {
      return NextResponse.json({ error: 'Comment too long (max 500 chars)', requestId }, { status: 400 });
    }

    const existing = await db.review.findUnique({
      where: { userId_businessId: { userId: user!.userId, businessId } },
    });

    if (existing) {
      return NextResponse.json({ error: 'You have already reviewed this business', requestId }, { status: 409 });
    }

    const review = await db.review.create({
      data: { userId: user!.userId, businessId, rating: Math.round(rating), comment: comment ? sanitizeString(comment, 500) : undefined },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    const aggStats = await db.review.aggregate({
      where: { businessId },
      _avg: { rating: true },
    });

    await db.business.update({
      where: { id: businessId },
      data: { rating: Math.round((aggStats._avg.rating || 0) * 10) / 10 },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    console.error(`Reviews POST error [${requestId}]:`, err);
    return NextResponse.json(safeErrorResponse(requestId), { status: 500 });
  }
}