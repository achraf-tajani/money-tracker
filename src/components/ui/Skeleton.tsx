import { cn } from '@/lib/utils';

/**
 * Skeleton Component
 * Loading placeholder with shimmer animation
 */
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-slate-800/50',
        className
      )}
      {...props}
    />
  );
}
