import { db } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { BusinessPageClient } from './BusinessPageClient';

interface Props {
  params: Promise<{ category: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const business = await db.business.findUnique({
      where: { slug },
      include: {
        category: true,
        locality: true,
      },
    });

    if (!business) {
      return { title: 'Business Not Found' };
    }

    const title = `${business.name} - ${business.category.name} in ${business.locality.name}`;
    const description = business.description
      ? `${business.description.slice(0, 160)}${business.description.length > 160 ? '...' : ''}`
      : `Find ${business.name} in ${business.locality.name}. Contact details, products, services, and reviews. Visit ${business.name} today!`;

    return {
      title,
      description,
      keywords: [
        business.name,
        business.category.name,
        business.locality.name,
        `${business.name} ${business.locality.name}`,
        `${business.category.name} in ${business.locality.name}`,
        'city directory',
        'local business',
      ],
      openGraph: {
        title,
        description,
        siteName: 'CityDir',
        type: 'article',
        locale: 'en_IN',
        ...(business.logo && { images: [{ url: business.logo, width: 1200, height: 630, alt: business.name }] }),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(business.logo && { images: [business.logo] }),
      },
      alternates: {
        canonical: `/${business.category.slug}/${slug}`,
      },
    };
  } catch {
    return { title: 'Business Not Found' };
  }
}

export default async function CategorySlugPage({ params }: Props) {
  const { category, slug } = await params;

  let business;
  try {
    business = await db.business.findUnique({
      where: { slug },
      include: {
        category: true,
        locality: true,
      },
    });
  } catch {
    notFound();
  }

  if (!business || !business.isActive) {
    notFound();
  }

  // Redirect to the correct category URL if it doesn't match
  if (business.category.slug !== category) {
    redirect(`/${business.category.slug}/${business.slug}`);
  }

  return (
    <BusinessPageClient
      businessId={business.id}
      slug={business.slug}
      categorySlug={business.category.slug}
      businessName={business.name}
      category={business.category.name}
      locality={business.locality.name}
    />
  );
}