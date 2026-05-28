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
  // Split value into number and unit (CHZ)
  const valueParts = value?.split(" CHZ");
  const numberValue = valueParts?.[0];
  const hasUnit = valueParts && valueParts.length > 1;

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(160deg,rgba(17,23,34,0.95)_0%,rgba(10,15,24,0.95)_45%,rgba(8,12,19,0.95)_100%)] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-rose-500/15 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
      <p className="relative text-[11px] uppercase tracking-[0.24em] text-zinc-500 leading-tight">{title}</p>
      {value ? (
        <p className="relative mt-3 font-mono text-3xl font-semibold tracking-tighter text-zinc-100 md:text-4xl leading-tight">
          {numberValue}
          {hasUnit && <span className="text-[1.95rem] md:text-[2.5rem] font-semibold leading-none align-baseline ml-3">CHZ</span>}
        </p>
      ) : null}
      {metricHint ? <p className="relative mt-2.5 text-xs text-rose-400/90 leading-relaxed">{metricHint}</p> : null}
      {description ? <p className="relative mt-2 text-sm text-zinc-400 leading-relaxed">{description}</p> : null}
      {children}
    </article>
  );
}
