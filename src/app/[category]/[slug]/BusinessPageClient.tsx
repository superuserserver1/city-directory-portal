'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { AppShell } from '@/components/directory/AppShell';

interface BusinessPageClientProps {
  businessId: string;
  slug: string;
  categorySlug: string;
  businessName: string;
  category: string;
  locality: string;
}

export function BusinessPageClient({ businessId, slug, categorySlug }: BusinessPageClientProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange={false}>
      <AppShell initialBusinessId={businessId} initialSlug={slug} initialCategorySlug={categorySlug} />
      <Toaster position="top-right" richColors closeButton />
    </ThemeProvider>
  );
}