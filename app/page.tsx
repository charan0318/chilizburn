import { ChartContainer } from "@/components/charts/chart-container";
import { Card } from "@/components/ui/card";
import { BurnsTable } from "@/components/ui/table";
import { getCharts, getStats, listBurns } from "@/services/burns";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [stats, charts, burnPage] = await Promise.all([getStats(), getCharts(), listBurns(1, 5)]);

  return (
    <section className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(130deg,rgba(13,21,34,0.95)_0%,rgba(10,16,25,0.95)_45%,rgba(6,11,18,0.95)_100%)] p-6 md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-rose-500/20 blur-3xl" />
        <p className="text-[11px] uppercase tracking-[0.24em] text-rose-300/80">ChilizBurn Dashboard</p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-zinc-100 md:text-4xl">
          Real-time CHZ burn intelligence for the Chiliz ecosystem.
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          Big numbers first, clean trend context, and transaction-level verification in one screen.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-zinc-300">
            Live Burn Data
          </span>
          <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-200">
            Zero-address verified
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-zinc-300">
            API-driven metrics
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card
          title="Total Burned"
          value={`${stats.totalBurned.toLocaleString()} CHZ`}
          metricHint={`${stats.burnCount.toLocaleString()} burn events tracked`}
        />
        <Card
          title="Latest Burn"
          value={`${stats.latestBurnAmount.toLocaleString()} CHZ`}
          metricHint="Most recent on-chain burn"
        />
        <Card
          title="Monthly Burn"
          value={`${stats.monthlyBurnTotal.toLocaleString()} CHZ`}
          metricHint={`${stats.percentOfSupplyBurned}% of total supply burned`}
        />
      </div>

      <ChartContainer charts={charts} />

      <section className="space-y-3">
        <h2 className="text-xl font-medium text-zinc-100">Latest Burns</h2>
        <BurnsTable burns={burnPage.data} showControls={false} />
      </section>
    </section>
  );
}
