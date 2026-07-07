import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractUserFromRequest, isAdmin } from '@/lib/auth';
import { generateRequestId, safeErrorResponse } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const { user, error } = extractUserFromRequest(request);
    if (error) return error;
    if (!isAdmin(user!.role)) {
      return NextResponse.json({ error: 'Admin access required', requestId }, { status: 403 });
    }

    const [
      totalUsers,
      totalBusinesses,
      totalEnquiries,
      totalCategories,
      totalLocalities,
      pendingBusinesses,
      recentEnquiries,
    ] = await Promise.all([
      db.user.count(),
      db.business.count(),
      db.enquiry.count(),
      db.category.count(),
      db.locality.count(),
      db.business.count({ where: { status: 'PENDING' } }),
      db.enquiry.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          business: { select: { name: true } },
          visitor: { select: { name: true, email: true } },
        },
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalBusinesses,
      totalEnquiries,
      totalCategories,
      totalLocalities,
      pendingBusinesses,
      recentEnquiries,
    });
  } catch (error) {
    console.error(`Get stats error [${requestId}]:`, error);
    return NextResponse.json(safeErrorResponse(requestId), { status: 500 });
  }
}