import { Skeleton } from "@/components/ui/skeleton";

export default function BurnsLoading() {
  return (
    <section className="space-y-5">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-5 w-80 max-w-full" />
      <Skeleton className="h-96 w-full" />
    </section>
  );
}
