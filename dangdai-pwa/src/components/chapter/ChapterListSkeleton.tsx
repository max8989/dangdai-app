import { Skeleton } from '@/components/ui/skeleton';

interface ChapterListSkeletonProps {
  count?: number;
}

export function ChapterListSkeleton({ count = 5 }: ChapterListSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </>
  );
}
