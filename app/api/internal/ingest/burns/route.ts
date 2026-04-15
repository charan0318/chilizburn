import path from "node:path";
import { pathToFileURL } from "node:url";

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.INGESTION_CRON_SECRET;
  if (!secret) {
    return false;
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const xCronSecret = request.headers.get("x-cron-secret") ?? "";

  return bearer === secret || xCronSecret === secret;
}

export async function GET(request: NextRequest) {
  if (!process.env.INGESTION_CRON_SECRET) {
    return NextResponse.json(
      { error: "INGESTION_CRON_SECRET is not configured" },
      { status: 500 },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";

  const moduleUrl = pathToFileURL(path.join(process.cwd(), "scripts", "ingest-burns.mjs")).href;
  const ingestionModule = (await import(moduleUrl)) as {
    runBurnIngestion: (options?: { dryRun?: boolean }) => Promise<unknown>;
  };

  const summary = await ingestionModule.runBurnIngestion({ dryRun });
  return NextResponse.json(summary, { status: 200 });
}
