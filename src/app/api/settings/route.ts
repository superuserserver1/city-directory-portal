import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractUserFromRequest, isAdmin } from '@/lib/auth';
import { sanitizeString, generateRequestId, safeErrorResponse, validateEmail, validatePhone } from '@/lib/validation';
import { invalidate } from '@/lib/cache';

export async function GET() {
  try {
    let settings = await db.siteSettings.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await db.siteSettings.create({ data: {} });
    }
    return NextResponse.json({ settings });
  } catch (error) {
    const rid = generateRequestId();
    console.error(`Get settings error [${rid}]:`, error);
    return NextResponse.json(safeErrorResponse(rid), { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const { user, error } = extractUserFromRequest(request);
    if (error) return error;
    if (!isAdmin(user!.role)) {
      return NextResponse.json({ error: 'Admin access required', requestId }, { status: 403 });
    }

    const body = await request.json();
    const {
      cityName, siteName, tagline, heroTitle, heroSubtitle, heroCtaText,
      contactEmail, contactPhone, facebookUrl, instagramUrl, twitterUrl, websiteUrl,
      footerText, copyrightText, primaryColor, accentColor, logoUrl, faviconUrl,
    } = body;

    // Validate required fields
    if (cityName && (typeof cityName !== 'string' || cityName.trim().length < 2 || cityName.trim().length > 100)) {
      return NextResponse.json({ error: 'City name must be 2-100 characters', requestId }, { status: 400 });
    }
    if (siteName && (typeof siteName !== 'string' || siteName.trim().length < 2 || siteName.trim().length > 50)) {
      return NextResponse.json({ error: 'Site name must be 2-50 characters', requestId }, { status: 400 });
    }

    // Validate optional fields
    if (contactEmail) {
      const emailResult = validateEmail(contactEmail);
      if (!emailResult.valid) {
        return NextResponse.json({ error: 'Invalid contact email', requestId }, { status: 400 });
      }
    }
    if (contactPhone) {
      const phoneResult = validatePhone(contactPhone);
      if (!phoneResult.valid) {
        return NextResponse.json({ error: 'Invalid phone number', requestId }, { status: 400 });
      }
    }

    // Validate color format (hex)
    const validateColor = (color: string | undefined, name: string) => {
      if (color && color.trim() !== '') {
        const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
        if (!hexRegex.test(color.trim())) {
          return NextResponse.json({ error: `${name} must be a valid hex color (e.g., #0d9488)`, requestId }, { status: 400 });
        }
      }
      return null;
    };
    const colorErr = validateColor(primaryColor, 'Primary color') || validateColor(accentColor, 'Accent color');
    if (colorErr) return colorErr;

    const data: Record<string, unknown> = {
      cityName: cityName ? sanitizeString(cityName, 100) : undefined,
      siteName: siteName ? sanitizeString(siteName, 50) : undefined,
      tagline: tagline !== undefined ? sanitizeString(tagline, 200) : undefined,
      heroTitle: heroTitle !== undefined ? sanitizeString(heroTitle, 300) : undefined,
      heroSubtitle: heroSubtitle !== undefined ? sanitizeString(heroSubtitle, 500) : undefined,
      heroCtaText: heroCtaText !== undefined ? sanitizeString(heroCtaText, 100) : undefined,
      contactEmail: contactEmail ? contactEmail.trim().toLowerCase() : null,
      contactPhone: contactPhone ? sanitizeString(contactPhone, 20) : null,
      facebookUrl: facebookUrl !== undefined ? (facebookUrl ? sanitizeString(facebookUrl, 500) : null) : undefined,
      instagramUrl: instagramUrl !== undefined ? (instagramUrl ? sanitizeString(instagramUrl, 500) : null) : undefined,
      twitterUrl: twitterUrl !== undefined ? (twitterUrl ? sanitizeString(twitterUrl, 500) : null) : undefined,
      websiteUrl: websiteUrl !== undefined ? (websiteUrl ? sanitizeString(websiteUrl, 500) : null) : undefined,
      footerText: footerText !== undefined ? sanitizeString(footerText, 500) : undefined,
      copyrightText: copyrightText !== undefined ? sanitizeString(copyrightText, 100) : undefined,
      primaryColor: primaryColor !== undefined ? (primaryColor ? primaryColor.trim() : '') : undefined,
      accentColor: accentColor !== undefined ? (accentColor ? accentColor.trim() : '') : undefined,
      logoUrl: logoUrl !== undefined ? (logoUrl ? sanitizeString(logoUrl, 500) : null) : undefined,
      faviconUrl: faviconUrl !== undefined ? (faviconUrl ? sanitizeString(faviconUrl, 500) : null) : undefined,
    };

    // Remove undefined keys
    for (const key of Object.keys(data)) {
      if (data[key] === undefined) delete data[key];
    }

    const settings = await db.siteSettings.upsert({
      where: { id: 'default' },
      update: data,
      create: { ...data, id: 'default' },
    });

    // Invalidate settings cache
    invalidate('settings');

    return NextResponse.json({ settings, message: 'Settings updated successfully' });
  } catch (error) {
    console.error(`Update settings error [${requestId}]:`, error);
    return NextResponse.json(safeErrorResponse(requestId), { status: 500 });
  }
}