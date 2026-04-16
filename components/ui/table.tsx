"use client";

import { useMemo, useState } from "react";
import { Info } from "lucide-react";

import type { BurnRecord } from "@/types/burn";

interface BurnsTableProps {
  burns: BurnRecord[];
  showControls?: boolean;
}

type SortKey = "date" | "amount" | "usd";

export function BurnsTable({ burns, showControls = true }: BurnsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const sortedBurns = useMemo(() => {
    if (!showControls) return burns;
    
    const next = [...burns];
    next.sort((a, b) => {
      let result = 0;

      if (sortKey === "date") {
        result = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sortKey === "amount") {
        result = a.amountChz - b.amountChz;
      } else {
        result = a.usdValue - b.usdValue;
      }

      return sortDir === "asc" ? result : -result;
    });

    return next;
  }, [burns, sortDir, sortKey, showControls]);

  return (
    <div className="space-y-3">
      {showControls ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSortKey("date")}
            className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
              sortKey === "date"
                ? "border-rose-400/40 bg-rose-500/15 text-rose-200"
                : "border-white/10 bg-white/[0.02] text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Sort by Date
          </button>
          <button
            type="button"
            onClick={() => setSortKey("amount")}
            className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
              sortKey === "amount"
                ? "border-rose-400/40 bg-rose-500/15 text-rose-200"
                : "border-white/10 bg-white/[0.02] text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Sort by Amount
          </button>
          <button
            type="button"
            onClick={() => setSortKey("usd")}
            className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
              sortKey === "usd"
                ? "border-rose-400/40 bg-rose-500/15 text-rose-200"
                : "border-white/10 bg-white/[0.02] text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Sort by USD Value
          </button>
          <button
            type="button"
            onClick={() => setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))}
            className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:text-zinc-100"
          >
            Order: {sortDir.toUpperCase()}
          </button>
        </div>
      ) : null}

      <div className="md:hidden space-y-2">
        {sortedBurns.map((burn) => (
          <article
            key={burn.txHash}
            className="rounded-xl border border-white/10 bg-[#0b111a]/90 p-3 shadow-[0_10px_20px_rgba(0,0,0,0.3)]"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                {new Date(burn.timestamp).toLocaleDateString()}
              </p>
              <a
                href={`https://scan.chiliz.com/tx/${burn.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-md border border-rose-500/30 px-2 py-1 font-mono text-xs text-rose-300"
              >
                TX
              </a>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Amount</p>
                <p className="mt-1 font-mono text-sm text-zinc-100">{burn.amountChz.toLocaleString()} CHZ</p>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">USD Value</p>
                  <div
                    onMouseEnter={() => setTooltipVisible(true)}
                    onMouseLeave={() => setTooltipVisible(false)}
                    className="relative"
                  >
                    <Info className="h-3 w-3 text-rose-500/60 cursor-help hover:text-rose-400 transition-colors" />
                    {tooltipVisible && (
                      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-rose-950/95 border border-rose-500/50 rounded px-2 py-1 text-[10px] text-rose-100 whitespace-nowrap z-50 pointer-events-none shadow-lg font-medium">
                        Approx. USD value at burn time
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-1 font-mono text-sm text-zinc-100">${burn.usdValue.toLocaleString()}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/10 bg-[#0b111a]/90 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
        <table className="min-w-[740px] w-full border-collapse text-left text-sm text-zinc-300">
          <thead className="sticky top-0 z-10 bg-[#0e1622] text-xs uppercase tracking-[0.14em] text-zinc-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Amount (CHZ)</th>
              <th className="px-4 py-3 relative">
                <div className="inline-flex items-center gap-2">
                  <span>USD Value</span>
                  <div
                    onMouseEnter={() => setTooltipVisible(true)}
                    onMouseLeave={() => setTooltipVisible(false)}
                    className="relative"
                  >
                    <Info className="h-3.5 w-3.5 text-rose-500/60 cursor-help hover:text-rose-400 transition-colors" />
                    {tooltipVisible && (
                      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-rose-950/95 border border-rose-500/50 rounded px-3 py-2 text-[11px] text-rose-100 whitespace-nowrap z-50 pointer-events-none shadow-lg font-medium">
                        Approx. USD value at burn time
                      </div>
                    )}
                  </div>
                </div>
              </th>
              <th className="px-4 py-3">TX Link</th>
            </tr>
          </thead>
          <tbody>
            {sortedBurns.map((burn) => (
              <tr
                key={burn.txHash}
                className="border-t border-white/10 transition-colors hover:bg-white/[0.02]"
              >
                <td className="px-4 py-3 text-zinc-400">{new Date(burn.timestamp).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-mono text-zinc-100">{burn.amountChz.toLocaleString()}</td>
                <td className="px-4 py-3 font-mono text-zinc-200">${burn.usdValue.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <a
                    href={`https://scan.chiliz.com/tx/${burn.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-md border border-rose-500/30 px-2 py-1 font-mono text-xs text-rose-300 transition-colors hover:border-rose-400 hover:text-rose-200"
                  >
                    {`${burn.txHash.slice(0, 10)}...${burn.txHash.slice(-8)}`}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
