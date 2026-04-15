import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-[linear-gradient(90deg,#131a24_0%,#1a2230_50%,#131a24_100%)] bg-[length:200%_100%]",
        className,
      )}
    />
  );
}
