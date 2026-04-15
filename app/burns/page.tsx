import Link from "next/link";

import { BurnsTable } from "@/components/ui/table";
import { listBurns } from "@/services/burns";
import type { BurnSortBy, SortOrder } from "@/types/burn";

interface BurnsPageProps {
  searchParams: Promise<{ page?: string; sortBy?: BurnSortBy; sortOrder?: SortOrder }>;
}

export default async function BurnsPage({ searchParams }: BurnsPageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const sortBy: BurnSortBy =
    params.sortBy === "amountChz" || params.sortBy === "blockNumber" ? params.sortBy : "timestamp";
  const sortOrder: SortOrder = params.sortOrder === "asc" ? "asc" : "desc";
  const pageSize = 20;
  const result = await listBurns(page, pageSize, sortBy, sortOrder);

  const sorters: Array<{ label: string; value: BurnSortBy }> = [
    { label: "Date", value: "timestamp" },
    { label: "Amount", value: "amountChz" },
    { label: "Block", value: "blockNumber" },
  ];

  const maxPage = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">Burn Feed</h1>
      </div>
      <p className="text-zinc-400">
        Sorted burn events with hash-level traceability and typed classification.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {sorters.map((item) => (
          <Link
            key={item.value}
            href={`/burns?page=1&sortBy=${item.value}&sortOrder=${sortOrder}`}
            className={`rounded-lg border px-3 py-1.5 text-xs ${
              sortBy === item.value
                ? "border-rose-500/40 bg-rose-500/15 text-rose-200"
                : "border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Sort: {item.label}
          </Link>
        ))}

        <Link
          href={`/burns?page=1&sortBy=${sortBy}&sortOrder=${sortOrder === "asc" ? "desc" : "asc"}`}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 hover:text-zinc-100"
        >
          Order: {sortOrder.toUpperCase()}
        </Link>
      </div>

      <BurnsTable burns={result.data} showControls={false} />

      <div className="flex items-center justify-between text-sm text-zinc-400">
        <p>
          Page {result.page} of {maxPage}
        </p>
        <div className="flex gap-2">
          <Link
            href={`/burns?page=${Math.max(1, result.page - 1)}&sortBy=${sortBy}&sortOrder=${sortOrder}`}
            className={`rounded-lg border px-3 py-1 ${
              result.page <= 1
                ? "pointer-events-none border-white/10 text-zinc-600"
                : "border-white/15 text-zinc-300 hover:text-zinc-100"
            }`}
          >
            Previous
          </Link>
          <Link
            href={`/burns?page=${Math.min(maxPage, result.page + 1)}&sortBy=${sortBy}&sortOrder=${sortOrder}`}
            className={`rounded-lg border px-3 py-1 ${
              result.page >= maxPage
                ? "pointer-events-none border-white/10 text-zinc-600"
                : "border-white/15 text-zinc-300 hover:text-zinc-100"
            }`}
          >
            Next
          </Link>
        </div>
      </div>
    </section>
  );
}
