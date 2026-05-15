import { Skeleton } from '@/components/ui/skeleton';

interface BookCardSkeletonProps {
  count?: number;
}

export function BookCardSkeleton({ count = 4 }: BookCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
          <Skeleton className="h-20 w-14 rounded-md" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-4/5" />
            <div className="mt-1 flex items-center gap-2">
              <Skeleton className="h-1.5 flex-1 rounded-full" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
          <Skeleton className="size-5" />
        </div>
      ))}
    </>
  );
}
