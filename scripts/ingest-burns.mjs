import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const CHZ_DECIMALS = 18n;

function shouldPreferDirectUrl() {
  if (process.env.PRISMA_PREFER_DIRECT === "true") {
    return true;
  }

  if (process.env.PRISMA_PREFER_DIRECT === "false") {
    return false;
  }

  return process.env.NODE_ENV !== "production";
}

const connectionString = shouldPreferDirectUrl()
  ? process.env.DIRECT_URL ?? process.env.DATABASE_URL
  : process.env.DATABASE_URL ?? process.env.DIRECT_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL is required for burn ingestion");
}

const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

function getEnv(name, fallback = undefined) {
  const value = process.env[name];
  if (value === undefined || value === "") {
    return fallback;
  }

  return value;
}

function toInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBool(value, fallback = false) {
  if (value === undefined) {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientDbError(error) {
  const code = String(error?.code ?? "");
  const message = String(error?.message ?? "");

  if (["P1001", "P1017", "P2010", "ETIMEDOUT", "ECONNREFUSED"].includes(code)) {
    return true;
  }

  return (
    message.includes("Can't reach database server") ||
    message.includes("Server has closed the connection") ||
    message.includes("timed out")
  );
}

function isUniqueViolation(error) {
  return String(error?.code ?? "") === "P2002";
}

async function runPrismaWithRetry(operation, options = {}) {
  const retries = options.retries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 450;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isTransientDbError(error) || attempt === retries) {
        throw error;
      }

      const delay = baseDelayMs * 2 ** attempt + Math.floor(Math.random() * 200);
      await sleep(delay);
    }
  }

  throw new Error("Unreachable Prisma retry state");
}

async function fetchWithRetry(url, init = {}, options = {}) {
  const retries = options.retries ?? 5;
  const baseDelayMs = options.baseDelayMs ?? 750;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const response = await fetch(url, init);
    if (response.ok) {
      return response;
    }

    const retriable = response.status === 429 || response.status >= 500;
    if (!retriable || attempt === retries) {
      const body = await response.text();
      throw new Error(`Request failed (${response.status}): ${body.slice(0, 300)}`);
    }

    const delay = baseDelayMs * 2 ** attempt + Math.floor(Math.random() * 250);
    await sleep(delay);
  }

  throw new Error("Unreachable retry state");
}

function decimalFromRaw(rawValue, decimals = CHZ_DECIMALS) {
  const raw = BigInt(rawValue);
  const divisor = 10n ** decimals;
  const whole = raw / divisor;
  const fraction = raw % divisor;

  if (fraction === 0n) {
    return whole.toString();
  }

  const padded = fraction.toString().padStart(Number(decimals), "0");
  const trimmed = padded.replace(/0+$/, "");
  return `${whole.toString()}.${trimmed}`;
}

function parseDecimals(value, fallback = CHZ_DECIMALS) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return BigInt(parsed);
}

function asIsoDate(secondsOrIso) {
  if (!secondsOrIso) {
    return null;
  }

  if (typeof secondsOrIso === "string" && secondsOrIso.includes("T")) {
    const date = new Date(secondsOrIso);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  const timestamp = Number(secondsOrIso);
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return new Date(timestamp * 1000).toISOString();
}

function isSuccessfulTx(tx) {
  const isError = String(tx.isError ?? "0");
  const receiptStatus = String(tx.txreceipt_status ?? "1");
  const status = tx.status;

  if (isError === "1") {
    return false;
  }

  if (receiptStatus === "0") {
    return false;
  }

  if (status === false || status === "0x0") {
    return false;
  }

  return true;
}

function validateCandidate(candidate) {
  const errors = [];

  if (!/^0x[0-9a-fA-F]{64}$/.test(candidate.txHash)) {
    errors.push("Invalid tx hash");
  }

  if (!/^0x[0-9a-fA-F]{40}$/.test(candidate.fromAddress)) {
    errors.push("Invalid from address");
  }

  if (!candidate.timestamp || Number.isNaN(Date.parse(candidate.timestamp))) {
    errors.push("Invalid timestamp");
  }

  if (!/^\d+$/.test(candidate.amountRaw)) {
    errors.push("amount_raw must be an integer string");
  }

  if (!/^\d+(\.\d+)?$/.test(candidate.amountChz)) {
    errors.push("amount_chz must be decimal-like string");
  }

  if (!Number.isInteger(candidate.blockNumber) || candidate.blockNumber < 0) {
    errors.push("Invalid block number");
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

const priceCache = new Map();

function formatCoinGeckoDate(iso) {
  const date = new Date(iso);
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = date.getUTCFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

async function fetchChzPriceUsd(isoTimestamp) {
  const dateKey = isoTimestamp.slice(0, 10);
  if (priceCache.has(dateKey)) {
    return priceCache.get(dateKey);
  }

  const coingeckoBase = getEnv("COINGECKO_BASE_URL", "https://api.coingecko.com/api/v3");
  const historyDate = formatCoinGeckoDate(isoTimestamp);
  const historyUrl = `${coingeckoBase}/coins/chiliz/history?date=${historyDate}&localization=false`;

  try {
    const response = await fetchWithRetry(historyUrl, {}, { retries: 4, baseDelayMs: 800 });
    const payload = await response.json();
    const price = payload?.market_data?.current_price?.usd;

    if (typeof price === "number" && Number.isFinite(price)) {
      priceCache.set(dateKey, price);
      return price;
    }
  } catch {
    // Fallback below
  }

  try {
    const spotUrl = `${coingeckoBase}/simple/price?ids=chiliz&vs_currencies=usd`;
    const response = await fetchWithRetry(spotUrl, {}, { retries: 2, baseDelayMs: 700 });
    const payload = await response.json();
    const spot = payload?.chiliz?.usd;

    if (typeof spot === "number" && Number.isFinite(spot)) {
      priceCache.set(dateKey, spot);
      return spot;
    }
  } catch {
    // Return null if both requests fail
  }

  priceCache.set(dateKey, null);
  return null;
}

function normalizeBlockscoutTx(tx) {
  if (!tx || typeof tx !== "object") {
    return null;
  }

  const to = String(tx.to ?? "").toLowerCase();
  if (to !== ZERO_ADDRESS) {
    return null;
  }

  if (!isSuccessfulTx(tx)) {
    return null;
  }

  const amountRaw = String(tx.value ?? "0");
  if (!/^\d+$/.test(amountRaw) || amountRaw === "0") {
    return null;
  }

  const timestamp = asIsoDate(tx.timeStamp ?? tx.timestamp);
  if (!timestamp) {
    return null;
  }

  const fromAddress = String(tx.from ?? "");
  const txHash = String(tx.hash ?? tx.tx_hash ?? "");
  const blockNumber = Number(tx.blockNumber ?? tx.block_number ?? 0);
  const amountChz = decimalFromRaw(amountRaw);

  return {
    txHash,
    amountRaw,
    amountChz,
    timestamp,
    blockNumber,
    fromAddress,
    usdValue: null,
    burnType: "TOKEN_BURN",
  };
}

function normalizeBlockscoutTokenTx(tx) {
  if (!tx || typeof tx !== "object") {
    return null;
  }

  const to = String(tx.to ?? "").toLowerCase();
  if (to !== ZERO_ADDRESS) {
    return null;
  }

  if (!isSuccessfulTx(tx)) {
    return null;
  }

  const amountRaw = String(tx.value ?? "0");
  if (!/^\d+$/.test(amountRaw) || amountRaw === "0") {
    return null;
  }

  const timestamp = asIsoDate(tx.timeStamp ?? tx.timestamp);
  if (!timestamp) {
    return null;
  }

  const fromAddress = String(tx.from ?? "");
  const txHash = String(tx.hash ?? tx.tx_hash ?? "");
  const blockNumber = Number(tx.blockNumber ?? tx.block_number ?? 0);
  const tokenDecimals = parseDecimals(tx.tokenDecimal, CHZ_DECIMALS);
  const amountChz = decimalFromRaw(amountRaw, tokenDecimals);

  return {
    txHash,
    amountRaw,
    amountChz,
    timestamp,
    blockNumber,
    fromAddress,
    usdValue: null,
    burnType: "TOKEN_BURN",
  };
}

async function fetchFromBlockscout(config) {
  const rawBase = config.blockscoutApiUrl;
  if (!rawBase) {
    throw new Error("CHILIZ_BLOCKSCOUT_API_URL is required for Blockscout ingestion");
  }

  const cleaned = rawBase.replace(/\/$/, "");
  const candidates = new Set();

  if (cleaned.endsWith("/api")) {
    candidates.add(cleaned);
  } else {
    candidates.add(`${cleaned}/api`);
    candidates.add(cleaned);
  }

  if (cleaned.includes("scan.chiliz.com")) {
    candidates.add("https://scan-api.chiliz.com/api");
    candidates.add("https://explorer.chiliz.com/api");
  }

  let selectedBase = null;

  for (const candidate of candidates) {
    try {
      const probeUrl = new URL(candidate);
      probeUrl.searchParams.set("module", "block");
      probeUrl.searchParams.set("action", "eth_block_number");

      const probeResponse = await fetchWithRetry(
        probeUrl.toString(),
        {},
        { retries: 1, baseDelayMs: config.rateLimitDelayMs },
      );
      const probePayload = await probeResponse.json();

      if (probePayload && (probePayload.result || probePayload.status !== undefined)) {
        selectedBase = candidate;
        break;
      }
    } catch {
      // Try next candidate endpoint.
    }
  }

  if (!selectedBase) {
    throw new Error("Could not resolve a valid Blockscout API base URL from CHILIZ_BLOCKSCOUT_API_URL");
  }

  const transactions = [];

  for (let page = 1; page <= config.maxPages; page += 1) {
    const url = new URL(selectedBase);
    url.searchParams.set("module", "account");
    url.searchParams.set("action", config.blockscoutAction);
    url.searchParams.set("address", ZERO_ADDRESS);
    url.searchParams.set("page", String(page));
    url.searchParams.set("offset", String(config.batchSize));
    url.searchParams.set("sort", "desc");

    if (config.blockscoutAction === "tokentx" && config.chzTokenContract) {
      url.searchParams.set("contractaddress", config.chzTokenContract);
    }

    if (config.blockscoutApiKey) {
      url.searchParams.set("apikey", config.blockscoutApiKey);
    }

    const response = await fetchWithRetry(url.toString(), {}, { retries: 5, baseDelayMs: config.rateLimitDelayMs });
    const payload = await response.json();
    const rows = Array.isArray(payload?.result) ? payload.result : [];

    if (rows.length === 0) {
      break;
    }

    for (const row of rows) {
      const normalized =
        config.blockscoutAction === "tokentx"
          ? normalizeBlockscoutTokenTx(row)
          : normalizeBlockscoutTx(row);
      if (normalized) {
        transactions.push(normalized);
      }
    }

    await sleep(config.rateLimitDelayMs);
  }

  return transactions;
}

async function rpcRequest(rpcUrl, method, params) {
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method,
    params,
  };

  const response = await fetchWithRetry(
    rpcUrl,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    { retries: 4, baseDelayMs: 700 },
  );

  const body = await response.json();
  if (body.error) {
    throw new Error(`RPC error (${method}): ${JSON.stringify(body.error)}`);
  }

  return body.result;
}

function hexToInt(hex) {
  return Number.parseInt(String(hex), 16);
}

function hexWeiToDecimal(hexWei) {
  return decimalFromRaw(BigInt(hexWei).toString());
}

async function fetchFromRpc(config) {
  const rpcUrl = config.rpcUrl;
  if (!rpcUrl) {
    throw new Error("CHILIZ_RPC_URL is required for RPC ingestion");
  }

  const latestHex = await rpcRequest(rpcUrl, "eth_blockNumber", []);
  const latest = hexToInt(latestHex);
  const maxBlockSeen = await prisma.burn.aggregate({ _max: { blockNumber: true } });
  const stored = maxBlockSeen._max.blockNumber === null ? null : Number(maxBlockSeen._max.blockNumber);

  const fromBlock = stored !== null ? stored + 1 : Math.max(0, latest - config.rpcLookbackBlocks);
  const toBlock = latest;

  const candidates = [];

  for (let start = fromBlock; start <= toBlock; start += config.rpcBatchBlocks) {
    const end = Math.min(start + config.rpcBatchBlocks - 1, toBlock);

    for (let blockNumber = start; blockNumber <= end; blockNumber += 1) {
      const blockHex = `0x${blockNumber.toString(16)}`;
      const block = await rpcRequest(rpcUrl, "eth_getBlockByNumber", [blockHex, true]);

      if (!block?.transactions?.length) {
        continue;
      }

      for (const tx of block.transactions) {
        if (!tx?.to || String(tx.to).toLowerCase() !== ZERO_ADDRESS) {
          continue;
        }

        if (!tx.value || BigInt(tx.value) === 0n) {
          continue;
        }

        const receipt = await rpcRequest(rpcUrl, "eth_getTransactionReceipt", [tx.hash]);
        if (!receipt || receipt.status !== "0x1") {
          continue;
        }

        const amountRaw = BigInt(tx.value).toString();
        const normalized = {
          txHash: String(tx.hash),
          amountRaw,
          amountChz: hexWeiToDecimal(tx.value),
          timestamp: asIsoDate(hexToInt(block.timestamp)),
          blockNumber,
          fromAddress: String(tx.from),
          usdValue: null,
          burnType: "TOKEN_BURN",
        };

        candidates.push(normalized);
      }
    }

    await sleep(config.rateLimitDelayMs);
  }

  return candidates;
}

async function upsertBurn(candidate, dryRun) {
  const validation = validateCandidate(candidate);
  if (!validation.ok) {
    return { status: "invalid", reason: validation.errors.join("; ") };
  }

  const priceUsd = await fetchChzPriceUsd(candidate.timestamp);
  const usdValue =
    typeof priceUsd === "number"
      ? (Number(candidate.amountChz) * priceUsd).toFixed(8)
      : null;

  const payload = {
    txHash: candidate.txHash.toLowerCase(),
    amountRaw: candidate.amountRaw,
    amountChz: candidate.amountChz,
    timestamp: new Date(candidate.timestamp),
    blockNumber: candidate.blockNumber,
    fromAddress: candidate.fromAddress.toLowerCase(),
    usdValue,
    burnType: candidate.burnType,
  };

  if (dryRun) {
    return { status: "dry-run", payload };
  }

  const updated = await runPrismaWithRetry(() =>
    prisma.burn.updateMany({
      where: { txHash: payload.txHash },
      data: payload,
    })
  );

  if (updated.count > 0) {
    return { status: "updated" };
  }

  try {
    await runPrismaWithRetry(() => prisma.burn.create({ data: payload }));
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }

    await runPrismaWithRetry(() =>
      prisma.burn.updateMany({
        where: { txHash: payload.txHash },
        data: payload,
      })
    );

    return { status: "updated" };
  }

  return { status: "inserted" };
}

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return {
    dryRun: args.has("--dry-run"),
  };
}

function readConfig() {
  return {
    source: getEnv("BURN_SOURCE", "blockscout").toLowerCase(),
    blockscoutAction: getEnv("BURN_BLOCKSCOUT_ACTION", "txlist").toLowerCase(),
    blockscoutApiUrl: getEnv("CHILIZ_BLOCKSCOUT_API_URL"),
    blockscoutApiKey: getEnv("CHILIZ_BLOCKSCOUT_API_KEY"),
    chzTokenContract: getEnv("CHZ_TOKEN_CONTRACT")?.toLowerCase(),
    rpcUrl: getEnv("CHILIZ_RPC_URL"),
    batchSize: toInt(getEnv("BURN_BATCH_SIZE"), 100),
    maxPages: toInt(getEnv("BURN_MAX_PAGES_PER_RUN"), 5),
    rateLimitDelayMs: toInt(getEnv("BURN_RATE_LIMIT_DELAY_MS"), 800),
    rpcBatchBlocks: toInt(getEnv("BURN_RPC_BATCH_BLOCKS"), 150),
    rpcLookbackBlocks: toInt(getEnv("BURN_RPC_LOOKBACK_BLOCKS"), 1500),
    logVerbose: toBool(getEnv("BURN_VERBOSE"), true),
  };
}

function printSummary(summary) {
  console.log("\nBurn ingestion summary");
  console.log(`source      : ${summary.source}`);
  console.log(`fetched     : ${summary.fetched}`);
  console.log(`inserted    : ${summary.inserted}`);
  console.log(`updated     : ${summary.updated}`);
  console.log(`skipped     : ${summary.skipped}`);
  console.log(`invalid     : ${summary.invalid}`);
  console.log(`dryRun      : ${summary.dryRun}`);
  console.log(`durationMs  : ${summary.durationMs}`);
}

export async function runBurnIngestion(options = {}) {
  const started = Date.now();
  const args = parseArgs(process.argv);
  const config = readConfig();
  const dryRun = options.dryRun ?? args.dryRun;

  const summary = {
    source: config.source,
    fetched: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    invalid: 0,
    dryRun,
    durationMs: 0,
  };

  try {
    const source = config.source;
    let candidates = [];

    if (source === "blockscout") {
      if (!["txlist", "tokentx"].includes(config.blockscoutAction)) {
        throw new Error("BURN_BLOCKSCOUT_ACTION must be either 'txlist' or 'tokentx'");
      }
      candidates = await fetchFromBlockscout(config);
    } else if (source === "rpc") {
      candidates = await fetchFromRpc(config);
    } else {
      throw new Error("BURN_SOURCE must be either 'blockscout' or 'rpc'");
    }

    summary.fetched = candidates.length;

    for (const candidate of candidates) {
      try {
        const result = await upsertBurn(candidate, dryRun);

        if (result.status === "inserted") {
          summary.inserted += 1;
        } else if (result.status === "updated") {
          summary.updated += 1;
        } else if (result.status === "invalid") {
          summary.invalid += 1;
          if (config.logVerbose) {
            console.warn(`[invalid] ${candidate.txHash}: ${result.reason}`);
          }
        } else {
          summary.skipped += 1;
        }
      } catch (error) {
        summary.skipped += 1;
        console.warn(`[skip] ${candidate.txHash}: ${error.message}`);
      }
    }
  } finally {
    summary.durationMs = Date.now() - started;
    printSummary(summary);
    await prisma.$disconnect();
  }

  return summary;
}

const isEntryPoint = process.argv[1] && process.argv[1].endsWith("ingest-burns.mjs");

if (isEntryPoint) {
  runBurnIngestion().catch(async (error) => {
    console.error("Burn ingestion failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
}
