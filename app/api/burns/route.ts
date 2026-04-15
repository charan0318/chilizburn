import { NextRequest, NextResponse } from "next/server";

import { listBurns } from "@/services/burns";
import type { BurnSortBy, SortOrder } from "@/types/burn";

function normalizeSortBy(input: string | null): BurnSortBy {
  if (input === "amountChz" || input === "blockNumber") {
    return input;
  }

  return "timestamp";
}

function normalizeSortOrder(input: string | null): SortOrder {
  if (input === "asc") {
    return "asc";
  }

  return "desc";
}

export async function GET(request: NextRequest) {
  const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const pageSize = Number(request.nextUrl.searchParams.get("pageSize") ?? "20");
  const sortBy = normalizeSortBy(request.nextUrl.searchParams.get("sortBy"));
  const sortOrder = normalizeSortOrder(request.nextUrl.searchParams.get("sortOrder"));

  const burns = await listBurns(page, pageSize, sortBy, sortOrder);

  return NextResponse.json(burns, {
    headers: {
      "Cache-Control": "public, s-maxage=20, stale-while-revalidate=40",
    },
  });
}
