import { ViewTransitionLoader } from '@/components/directory/PageLoader';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <ViewTransitionLoader isLoading size="lg" message="Loading business..." />
    </div>
  );
}