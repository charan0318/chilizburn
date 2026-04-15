import cron from "node-cron";

import { runBurnIngestion } from "./ingest-burns.mjs";

const schedule = process.env.BURN_CRON_SCHEDULE ?? "*/10 * * * *";

let isRunning = false;

async function runJob() {
  if (isRunning) {
    console.log("[cron] Previous burn ingestion run still active, skipping this tick.");
    return;
  }

  isRunning = true;
  try {
    console.log(`[cron] Running burn ingestion at ${new Date().toISOString()}`);
    await runBurnIngestion();
  } catch (error) {
    console.error("[cron] Burn ingestion run failed", error);
  } finally {
    isRunning = false;
  }
}

console.log(`[cron] Burn ingestion scheduler started. Schedule: ${schedule}`);
await runJob();
cron.schedule(schedule, runJob);
