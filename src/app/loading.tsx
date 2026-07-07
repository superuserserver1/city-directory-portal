import { ViewTransitionLoader } from '@/components/directory/PageLoader';

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="h-16 border-b bg-background/80 backdrop-blur-sm" />
      <main className="flex-1 flex items-center justify-center">
        <ViewTransitionLoader isLoading size="lg" />
      </main>
    </div>
  );
}