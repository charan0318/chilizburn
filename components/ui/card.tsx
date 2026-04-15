import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface CardProps {
  title: string;
  value?: string;
  description?: string;
  metricHint?: string;
  children?: ReactNode;
  className?: string;
}

export function Card({ title, value, description, metricHint, children, className }: CardProps) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(160deg,rgba(17,23,34,0.95)_0%,rgba(10,15,24,0.95)_45%,rgba(8,12,19,0.95)_100%)] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-rose-500/15 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
      <p className="relative text-[11px] uppercase tracking-[0.2em] text-zinc-500">{title}</p>
      {value ? (
        <p className="relative mt-4 font-mono text-3xl font-semibold tracking-tight text-zinc-100 md:text-4xl">
          {value}
        </p>
      ) : null}
      {metricHint ? <p className="relative mt-2 text-xs text-rose-400/90">{metricHint}</p> : null}
      {description ? <p className="relative mt-2 text-sm text-zinc-400">{description}</p> : null}
      {children}
    </article>
  );
}
