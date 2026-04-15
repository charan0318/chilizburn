import { NextResponse } from "next/server";

import { getCharts } from "@/services/burns";

export async function GET() {
  const charts = await getCharts();

  return NextResponse.json(
    {
      data: {
        cumulative: charts.cumulative,
        monthly: charts.monthly,
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=45, stale-while-revalidate=90",
      },
    },
  );
}
