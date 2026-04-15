import { CHILIZ_ZERO_ADDRESS, CHZ_TOTAL_SUPPLY } from "@/lib/constants";
import { getOrSetCache } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import type {
  BurnSortBy,
  BurnListResponse,
  BurnRecord,
  SortOrder,
  BurnStats,
  ChartPayload,
} from "@/types/burn";

const LIST_CACHE_TTL = 30_000;
const STATS_CACHE_TTL = 45_000;
const CHARTS_CACHE_TTL = 60_000;
const LATEST_CACHE_TTL = 20_000;

function getDbQueryTimeoutMs(): number {
  const raw = process.env.BURN_DB_QUERY_TIMEOUT_MS;
  const parsed = Number.parseInt(raw ?? "", 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 8_000;
  }

  return Math.min(parsed, 30_000);
}

async function withDbTimeout<T>(operation: Promise<T>): Promise<T> {
  const timeoutMs = getDbQueryTimeoutMs();
  let settled = false;

  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error("DB_QUERY_TIMEOUT"));
    }, timeoutMs);
  });

  const observedOperation = operation.then(
    (value) => {
      settled = true;
      return value;
    },
    (error) => {
      settled = true;
      throw error;
    },
  );

  try {
    return await Promise.race([observedOperation, timeoutPromise]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }

    // If timeout wins, the underlying Prisma promise can reject later.
    // Attach a sink so Node/Next does not treat it as an unhandled rejection.
    if (!settled) {
      observedOperation.catch(() => undefined);
    }
  }
}

function isDbTransientError(error: unknown): boolean {
  const asRecord = error as {
    code?: string;
    message?: string;
    meta?: {
      driverAdapterError?: {
        message?: string;
        cause?: {
          kind?: string;
        };
      };
    };
  };

  const code = String(asRecord?.code ?? "");
  const topMessage = String(asRecord?.message ?? "");
  const adapterMessage = String(asRecord?.meta?.driverAdapterError?.message ?? "");
  const adapterCauseKind = String(asRecord?.meta?.driverAdapterError?.cause?.kind ?? "");

  if (code === "P1001" || code === "ECONNREFUSED" || code === "ETIMEDOUT") {
    return true;
  }

  if (code === "P1017") {
    return (
      topMessage.includes("Server has closed the connection") ||
      adapterMessage.includes("ConnectionClosed") ||
      adapterCauseKind === "ConnectionClosed"
    );
  }

  if (code === "P2010") {
    return (
      topMessage.includes("Can't reach database server") ||
      adapterMessage.includes("DatabaseNotReachable") ||
      adapterCauseKind === "DatabaseNotReachable"
    );
  }

  return (
    topMessage.includes("Can't reach database server") ||
    topMessage.includes("Server has closed the connection") ||
    topMessage.includes("DB_QUERY_TIMEOUT") ||
    topMessage.includes("timed out") ||
    adapterMessage.includes("DatabaseNotReachable") ||
    adapterMessage.includes("ConnectionClosed")
  );
}

function getBurnDataStartDate(): Date | null {
  const raw = process.env.BURN_DATA_START_DATE;
  if (!raw) {
    return null;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function baseWhere(minDate = getBurnDataStartDate()) {
  if (!minDate) {
    return {};
  }

  return {
    timestamp: {
      gte: minDate,
    },
  };
}

type BurnDbRecord = {
  txHash: string;
  amountRaw: string;
  amountChz: { toNumber: () => number };
  timestamp: Date;
  blockNumber: number;
  fromAddress: string;
  usdValue: { toNumber: () => number } | null;
  burnType: "TOKEN_BURN" | "TREASURY_BURN" | "MANUAL_BURN";
};

function mapBurnRecord(row: BurnDbRecord): BurnRecord {
  return {
    txHash: row.txHash,
    blockNumber: row.blockNumber,
    timestamp: row.timestamp.toISOString(),
    from: row.fromAddress,
    to: CHILIZ_ZERO_ADDRESS,
    amountRaw: row.amountRaw,
    amountChz: Number(row.amountChz.toNumber().toFixed(8)),
    usdValue: Number((row.usdValue?.toNumber() ?? 0).toFixed(8)),
    gasFeeChz: 0,
    burnType: row.burnType,
  };
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, Math.floor(value)));
}

function monthBoundsUtc(now = new Date()): { start: Date; end: Date } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
  return { start, end };
}

function sortToOrderBy(sortBy: BurnSortBy, sortOrder: SortOrder) {
  if (sortBy === "amountChz") {
    return { amountChz: sortOrder } as const;
  }

  if (sortBy === "blockNumber") {
    return { blockNumber: sortOrder } as const;
  }

  return { timestamp: sortOrder } as const;
}

export async function listBurns(
  page = 1,
  pageSize = 20,
  sortBy: BurnSortBy = "timestamp",
  sortOrder: SortOrder = "desc",
): Promise<BurnListResponse> {
  const safePage = clampInt(page, 1, 10_000);
  const safePageSize = clampInt(pageSize, 1, 100);
  const cacheKey = `burns:list:${safePage}:${safePageSize}:${sortBy}:${sortOrder}`;

  try {
    return await getOrSetCache(cacheKey, LIST_CACHE_TTL, async () => {
      const skip = (safePage - 1) * safePageSize;
      const orderBy = sortToOrderBy(sortBy, sortOrder);
      const minDate = getBurnDataStartDate();
      const where = baseWhere(minDate);

      let [total, rows] = await withDbTimeout(Promise.all([
        prisma.burn.count({ where }),
        prisma.burn.findMany({
          where,
          skip,
          take: safePageSize,
          orderBy,
        }),
      ]));

      if (minDate && total === 0) {
        [total, rows] = await withDbTimeout(Promise.all([
          prisma.burn.count({}),
          prisma.burn.findMany({
            skip,
            take: safePageSize,
            orderBy,
          }),
        ]));
      }

      return {
        data: rows.map((row: unknown) => mapBurnRecord(row as BurnDbRecord)),
        total,
        page: safePage,
        pageSize: safePageSize,
      };
    });
  } catch (error) {
    if (isDbTransientError(error)) {
      return { data: [], total: 0, page: safePage, pageSize: safePageSize };
    }

    throw error;
  }
}

export async function getLatestBurn(): Promise<BurnRecord | null> {
  try {
    return await getOrSetCache("burns:latest", LATEST_CACHE_TTL, async () => {
      const minDate = getBurnDataStartDate();
      let latest = await withDbTimeout(prisma.burn.findFirst({
        where: baseWhere(minDate),
        orderBy: { timestamp: "desc" },
      }));

      if (!latest && minDate) {
        latest = await withDbTimeout(prisma.burn.findFirst({
          orderBy: { timestamp: "desc" },
        }));
      }

      return latest ? mapBurnRecord(latest as unknown as BurnDbRecord) : null;
    });
  } catch (error) {
    if (isDbTransientError(error)) {
      return null;
    }

    throw error;
  }
}

export async function getBurnByHash(hash: string): Promise<BurnRecord | null> {
  const normalized = hash.toLowerCase();

  const burn = await withDbTimeout(prisma.burn.findFirst({
    where: { txHash: normalized },
  })) as BurnDbRecord | null;

  const minDate = getBurnDataStartDate();
  if (!burn || (minDate && burn.timestamp < minDate)) {
    return null;
  }

  return mapBurnRecord(burn as unknown as BurnDbRecord);
}

export async function getStats(): Promise<BurnStats> {
  try {
    return await getOrSetCache("burns:stats", STATS_CACHE_TTL, async () => {
      const { start, end } = monthBoundsUtc();
      const minDate = getBurnDataStartDate();
      const where = baseWhere(minDate);

      let [aggregate, latest, monthlyAggregate] = await withDbTimeout(Promise.all([
        prisma.burn.aggregate({
          where,
          _sum: { amountChz: true },
          _count: { txHash: true },
        }),
        prisma.burn.findFirst({
          where,
          orderBy: { timestamp: "desc" },
          select: { amountChz: true },
        }),
        prisma.burn.aggregate({
          where: {
            timestamp: {
              gte: minDate && start <= minDate ? minDate : start,
              lt: end,
            },
          },
          _sum: { amountChz: true },
        }),
      ]));

      const filteredCount = aggregate._count.txHash ?? 0;
      if (minDate && filteredCount === 0) {
        [aggregate, latest, monthlyAggregate] = await withDbTimeout(Promise.all([
          prisma.burn.aggregate({
            _sum: { amountChz: true },
            _count: { txHash: true },
          }),
          prisma.burn.findFirst({
            orderBy: { timestamp: "desc" },
            select: { amountChz: true },
          }),
          prisma.burn.aggregate({
            where: {
              timestamp: {
                gte: start,
                lt: end,
              },
            },
            _sum: { amountChz: true },
          }),
        ]));
      }

      const totalBurned = Number((aggregate._sum.amountChz?.toNumber() ?? 0).toFixed(8));
      const monthlyBurnTotal = Number((monthlyAggregate._sum.amountChz?.toNumber() ?? 0).toFixed(8));
      const latestBurnAmount = Number((latest?.amountChz?.toNumber() ?? 0).toFixed(8));
      const burnCount = aggregate._count.txHash ?? 0;

      return {
        totalBurned,
        latestBurnAmount,
        monthlyBurnTotal,
        burnCount,
        percentOfSupplyBurned: Number(((totalBurned / CHZ_TOTAL_SUPPLY) * 100).toFixed(8)),
      };
    });
  } catch (error) {
    if (isDbTransientError(error)) {
      return {
        totalBurned: 0,
        latestBurnAmount: 0,
        monthlyBurnTotal: 0,
        burnCount: 0,
        percentOfSupplyBurned: 0,
      };
    }

    throw error;
  }
}

type CumulativeRow = { date: string; total: string };
type MonthlyRow = { month: string; burned: string };
type BurnPriceRow = { date: string; burned: string; price: string | null };

async function queryChartsForMinDate(minDate: Date | null): Promise<ChartPayload> {
  const cumulativeRows = minDate
    ? await withDbTimeout<CumulativeRow[]>(prisma.$queryRaw<CumulativeRow[]>`
        WITH daily AS (
          SELECT DATE("timestamp") AS day, SUM("amount_chz") AS burned
          FROM burns
          WHERE "timestamp" >= ${minDate}
          GROUP BY DATE("timestamp")
        )
        SELECT TO_CHAR(day, 'YYYY-MM-DD') AS date,
               SUM(burned) OVER (ORDER BY day) :: text AS total
        FROM daily
        ORDER BY day ASC
      `)
    : await withDbTimeout<CumulativeRow[]>(prisma.$queryRaw<CumulativeRow[]>`
        WITH daily AS (
          SELECT DATE("timestamp") AS day, SUM("amount_chz") AS burned
          FROM burns
          GROUP BY DATE("timestamp")
        )
        SELECT TO_CHAR(day, 'YYYY-MM-DD') AS date,
               SUM(burned) OVER (ORDER BY day) :: text AS total
        FROM daily
        ORDER BY day ASC
      `);

  const monthlyRows = minDate
    ? await withDbTimeout<MonthlyRow[]>(prisma.$queryRaw<MonthlyRow[]>`
        SELECT TO_CHAR(DATE_TRUNC('month', "timestamp"), 'YYYY-MM') AS month,
               SUM("amount_chz") :: text AS burned
        FROM burns
        WHERE "timestamp" >= ${minDate}
        GROUP BY DATE_TRUNC('month', "timestamp")
        ORDER BY DATE_TRUNC('month', "timestamp") ASC
      `)
    : await withDbTimeout<MonthlyRow[]>(prisma.$queryRaw<MonthlyRow[]>`
        SELECT TO_CHAR(DATE_TRUNC('month', "timestamp"), 'YYYY-MM') AS month,
               SUM("amount_chz") :: text AS burned
        FROM burns
        GROUP BY DATE_TRUNC('month', "timestamp")
        ORDER BY DATE_TRUNC('month', "timestamp") ASC
      `);

  const burnVsPriceRows = minDate
    ? await withDbTimeout<BurnPriceRow[]>(prisma.$queryRaw<BurnPriceRow[]>`
        SELECT TO_CHAR(DATE("timestamp"), 'YYYY-MM-DD') AS date,
               SUM("amount_chz") :: text AS burned,
               CASE
                 WHEN SUM("amount_chz") = 0 THEN NULL
                 ELSE (SUM(COALESCE("usd_value", 0)) / SUM("amount_chz")) :: text
               END AS price
        FROM burns
        WHERE "timestamp" >= ${minDate}
        GROUP BY DATE("timestamp")
        ORDER BY DATE("timestamp") ASC
      `)
    : await withDbTimeout<BurnPriceRow[]>(prisma.$queryRaw<BurnPriceRow[]>`
        SELECT TO_CHAR(DATE("timestamp"), 'YYYY-MM-DD') AS date,
               SUM("amount_chz") :: text AS burned,
               CASE
                 WHEN SUM("amount_chz") = 0 THEN NULL
                 ELSE (SUM(COALESCE("usd_value", 0)) / SUM("amount_chz")) :: text
               END AS price
        FROM burns
        GROUP BY DATE("timestamp")
        ORDER BY DATE("timestamp") ASC
      `);

  return {
    cumulative: cumulativeRows.map((row: CumulativeRow) => ({
      date: row.date,
      total: Number(Number(row.total).toFixed(8)),
    })),
    monthly: monthlyRows.map((row: MonthlyRow) => ({
      month: row.month,
      burned: Number(Number(row.burned).toFixed(8)),
    })),
    burnVsPrice: burnVsPriceRows.map((row: BurnPriceRow) => ({
      date: row.date,
      burned: Number(Number(row.burned).toFixed(8)),
      price: Number(Number(row.price ?? "0").toFixed(8)),
    })),
  };
}

export async function getCharts(): Promise<ChartPayload> {
  try {
    return await getOrSetCache("burns:charts", CHARTS_CACHE_TTL, async () => {
      const minDate = getBurnDataStartDate();
      let payload = await queryChartsForMinDate(minDate);

      if (
        minDate &&
        payload.cumulative.length === 0 &&
        payload.monthly.length === 0 &&
        payload.burnVsPrice.length === 0
      ) {
        payload = await queryChartsForMinDate(null);
      }

      return payload;
    });
  } catch (error) {
    if (isDbTransientError(error)) {
      return {
        cumulative: [],
        monthly: [],
        burnVsPrice: [],
      };
    }

    throw error;
  }
}
