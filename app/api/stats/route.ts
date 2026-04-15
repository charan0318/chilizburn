import { NextResponse } from "next/server";

import { getStats } from "@/services/burns";

export async function GET() {
  const stats = await getStats();

  return NextResponse.json(
    {
      data: stats,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    },
  );
}
