import { NextResponse } from "next/server";

import { getLatestBurn } from "@/services/burns";

export async function GET() {
  const latest = await getLatestBurn();

  return NextResponse.json(
    {
      data: latest,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
      },
    },
  );
}
