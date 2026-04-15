"use client";

import { useMemo, useState } from "react";
import { motion, Variants } from "framer-motion";
import { Flame, TrendingUp, CalendarDays, Activity } from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  TooltipProps,
} from "recharts";

import type { ChartPayload } from "@/types/burn";

interface ChartContainerProps {
  charts: ChartPayload;
}

type RangeOption = "30D" | "90D" | "1Y" | "ALL";

function filterByRange<T extends { date?: string; month?: string }>(data: T[], range: RangeOption): T[] {
  if (range === "ALL") {
    return data;
  }

  const maxDateValue = data
    .map((item) => item.date ?? `${item.month}-01`)
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => b - a)[0];

  if (!maxDateValue) {
    return data;
  }

  const days = range === "30D" ? 30 : range === "90D" ? 90 : 365;
  const min = maxDateValue - days * 24 * 60 * 60 * 1000;

  return data.filter((item) => {
    const raw = item.date ?? `${item.month}-01`;
    const value = new Date(raw).getTime();
    return Number.isFinite(value) && value >= min;
  });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="relative z-50 overflow-hidden rounded-xl border border-white/10 bg-black/40 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-xl before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-b before:from-white/5 before:to-transparent">
        <div className="mb-2 flex items-center gap-2 border-b border-white/10 pb-2">
          <CalendarDays className="h-4 w-4 text-rose-500" />
          <p className="text-sm font-medium text-zinc-300">{label}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-500/20">
            <Flame className="h-4 w-4 text-rose-500" />
          </div>
          <div className="flex flex-col">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">{payload[0].name}</p>
            <p className="text-sm font-bold text-white">
              {Number(payload[0].value).toLocaleString()} <span className="text-rose-500 font-normal">CHZ</span>
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 }
  },
};

export function ChartContainer({ charts }: ChartContainerProps) {
  const [range, setRange] = useState<RangeOption>("90D");
  
  const filteredCumulative = useMemo(
    () => filterByRange(charts.cumulative, range),
    [charts.cumulative, range],
  );
  
  const filteredMonthly = useMemo(
    () => filterByRange(charts.monthly, range),
    [charts.monthly, range]
  );
  
  const hasCumulativeData = filteredCumulative.length > 0;
  const hasMonthlyData = filteredMonthly.length > 0;

  return (
    <motion.section 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={cardVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/20">
            <Activity className="h-4 w-4 text-rose-500" />
          </div>
          <h2 className="text-lg font-semibold text-white">Burn Analytics</h2>
        </div>
        
        <div className="flex items-center rounded-xl border border-white/5 bg-black/40 p-1 backdrop-blur-md">
          {(["30D", "90D", "1Y", "ALL"] as RangeOption[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              className={`relative rounded-lg px-4 py-1.5 text-xs font-medium transition-all duration-300 ${
                range === option
                  ? "text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {range === option && (
                <motion.div
                  layoutId="activeRange"
                  className="absolute inset-0 rounded-lg bg-rose-600/20 border border-rose-500/30"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative z-10">{option}</span>
            </button>
          ))}
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cumulative Chart Card */}
        <motion.div 
          variants={cardVariants}
          className="group relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/50 p-6 shadow-2xl backdrop-blur-xl transition-colors hover:border-white/15"
        >
          {/* Ambient Glow */}
          <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-rose-500/10 blur-[100px] transition-opacity duration-500 group-hover:opacity-75" />
          
          <div className="relative mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-400">Total Supply Burned</p>
              <h3 className="mt-1 text-2xl font-bold tracking-tight text-white">
                Cumulative Burn
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10">
              <TrendingUp className="h-5 w-5 text-rose-500" />
            </div>
          </div>

          <div className="relative h-[280px] w-full" style={{ display: "block", minWidth: 0 }}>
            {hasCumulativeData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredCumulative} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                    <filter id="glow" height="300%" width="300%" x="-100%" y="-100%">
                      <feGaussianBlur stdDeviation="4" result="blurred" />
                      <feMerge>
                        <feMergeNode in="blurred" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  
                  <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#ffffff" strokeOpacity={0.05} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#52525b" 
                    tick={{ fill: '#71717a', fontSize: 12 }} 
                    tickLine={false} 
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#52525b" 
                    tick={{ fill: '#71717a', fontSize: 12 }} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 1e6).toFixed(1)}M`}
                    dx={-10}
                  />
                  <Tooltip cursor={{ stroke: 'rgba(244,63,94,0.2)', strokeWidth: 2, strokeDasharray: '4 4' }} content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Cumulative Total"
                    stroke="#f43f5e"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    filter="url(#glow)"
                    activeDot={{ r: 6, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }}
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5">
                <p className="text-sm text-zinc-500">No cumulative data available</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Monthly Chart Card */}
        <motion.div 
          variants={cardVariants}
          className="group relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/50 p-6 shadow-2xl backdrop-blur-xl transition-colors hover:border-white/15"
        >
          {/* Ambient Glow */}
          <div className="absolute -right-32 -bottom-32 h-64 w-64 rounded-full bg-rose-500/10 blur-[100px] transition-opacity duration-500 group-hover:opacity-75" />

          <div className="relative mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-400">Pace of Deflation</p>
              <h3 className="mt-1 text-2xl font-bold tracking-tight text-white">
                Monthly Burn
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10">
              <Flame className="h-5 w-5 text-rose-500" />
            </div>
          </div>

          <div className="relative h-[280px] w-full" style={{ display: "block", minWidth: 0 }}>
            {hasMonthlyData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredMonthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBurned" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#9f1239" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#ffffff" strokeOpacity={0.05} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#52525b" 
                    tick={{ fill: '#71717a', fontSize: 12 }} 
                    tickLine={false} 
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#52525b" 
                    tick={{ fill: '#71717a', fontSize: 12 }} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 1e6).toFixed(1)}M`}
                    dx={-10}
                  />
                  <Tooltip cursor={{ fill: 'rgba(244,63,94,0.05)' }} content={<CustomTooltip />} />
                  <Bar 
                    dataKey="burned" 
                    name="Burned Amount"
                    fill="url(#colorBurned)" 
                    radius={[6, 6, 6, 6]} 
                    animationDuration={1000}
                    maxBarSize={40}
                  >
                    {filteredMonthly.map((entry, index) => (
                      <Cell key={`cell-${index}`} className="hover:opacity-80 transition-opacity duration-300" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5">
                <p className="text-sm text-zinc-500">No monthly data available</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
