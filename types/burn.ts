export type BurnType = "TOKEN_BURN" | "TREASURY_BURN" | "MANUAL_BURN";

export interface BurnRecord {
  txHash: string;
  blockNumber: number;
  timestamp: string;
  from: string;
  to: string;
  amountRaw: string;
  amountChz: number;
  usdValue: number;
  gasFeeChz: number;
  burnType: BurnType;
}

export interface BurnStats {
  totalBurned: number;
  latestBurnAmount: number;
  monthlyBurnTotal: number;
  burnCount: number;
  percentOfSupplyBurned: number;
}

export type BurnSortBy = "timestamp" | "amountChz" | "blockNumber";
export type SortOrder = "asc" | "desc";

export interface MonthlyBurnPoint {
  month: string;
  burned: number;
}

export interface BurnPricePoint {
  date: string;
  burned: number;
  price: number;
}

export interface ChartPayload {
  cumulative: Array<{ date: string; total: number }>;
  monthly: MonthlyBurnPoint[];
  burnVsPrice: BurnPricePoint[];
}

export interface BurnListResponse {
  data: BurnRecord[];
  total: number;
  page: number;
  pageSize: number;
}
