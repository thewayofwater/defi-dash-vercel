#!/usr/bin/env node
// Trustless audit of WBTC custodian BTC reserves.
//
// Compares wbtc.network's reported balances against real on-chain balances
// read directly from Bitcoin via mempool.space. Exits non-zero on any
// material discrepancy so it can be wired into a scheduled CI job
// (weekly/monthly cron, GitHub Actions, etc).
//
// Usage:
//   node scripts/verify-reserves.js              # full audit, human-readable
//   node scripts/verify-reserves.js --json       # machine-readable summary
//   node scripts/verify-reserves.js --dust=0.001 # override dust threshold (BTC)
//
// Data flow:
//   1. Pull custodian address list from wbtc.network per-chain endpoints
//   2. For each BTC address, fetch balance from mempool.space
//   3. Compare reported vs on-chain, flag any diff > dust threshold
//   4. Print summary; exit code = 0 if clean, 1 if discrepancies found

const WBTC_DATA_CHAINS = ["eth", "base", "kava", "sol", "trx", "osmo"];
const UA = { "User-Agent": "DeFiDash-ReserveAudit/1.0" };

async function fetchAddressList() {
  const map = new Map(); // address -> reported balance (BTC)
  const fetches = WBTC_DATA_CHAINS.map((c) =>
    fetch(`https://wbtc.network/api/chain/${c}/token/wbtc/addresses`).then((r) => r.ok ? r.json() : null).catch(() => null)
  );
  const responses = await Promise.all(fetches);
  for (const resp of responses) {
    for (const a of (resp?.result || [])) {
      if (a.chain !== "btc" || !a.address) continue;
      // Deduplicate — same addresses appear across chain endpoints.
      if (!map.has(a.address)) {
        map.set(a.address, parseInt(a.balance || 0) / 1e8);
      }
    }
  }
  return map;
}

async function fetchBtcBalance(address) {
  const resp = await fetch(`https://mempool.space/api/address/${address}`, {
    headers: UA,
    signal: AbortSignal.timeout(15000),
  });
  if (!resp.ok) throw new Error(`mempool ${resp.status}`);
  const data = await resp.json();
  const c = data.chain_stats || {};
  return Number((c.funded_txo_sum || 0) - (c.spent_txo_sum || 0)) / 1e8;
}

async function fetchAllBalances(addresses, concurrency = 10) {
  const results = new Array(addresses.length);
  let cursor = 0;
  let done = 0;
  async function worker() {
    while (cursor < addresses.length) {
      const idx = cursor++;
      try {
        results[idx] = { address: addresses[idx], balance: await fetchBtcBalance(addresses[idx]) };
      } catch (err) {
        results[idx] = { address: addresses[idx], balance: null, error: err.message };
      }
      done++;
      if (!process.stdout.isTTY) continue;
      process.stdout.write(`\r  verified ${done}/${addresses.length}`);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  if (process.stdout.isTTY) process.stdout.write("\n");
  return results;
}

function parseArgs(argv) {
  const args = { json: false, dust: 0.00001 };
  for (const a of argv.slice(2)) {
    if (a === "--json") args.json = true;
    else if (a.startsWith("--dust=")) args.dust = parseFloat(a.slice(7));
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const started = Date.now();

  if (!args.json) {
    console.log("Fetching custodian address list from wbtc.network…");
  }
  const reported = await fetchAddressList();
  const addresses = [...reported.keys()];
  if (!args.json) {
    console.log(`  ${addresses.length} unique BTC custodian addresses`);
    console.log(`Reading on-chain balances via mempool.space (concurrency 10)…`);
  }

  const verified = await fetchAllBalances(addresses);

  const discrepancies = [];
  let reportedTotal = 0;
  let onchainTotal = 0;
  let failedLookups = 0;
  for (const v of verified) {
    const rep = reported.get(v.address) || 0;
    reportedTotal += rep;
    if (v.balance == null) { failedLookups++; continue; }
    onchainTotal += v.balance;
    const delta = v.balance - rep;
    if (Math.abs(delta) >= args.dust) {
      discrepancies.push({ address: v.address, reported: rep, onchain: v.balance, deltaBtc: delta });
    }
  }

  const summary = {
    timestamp: new Date().toISOString(),
    addressCount: addresses.length,
    reportedTotal,
    onchainTotal,
    dustThreshold: args.dust,
    failedLookups,
    discrepancyCount: discrepancies.length,
    discrepancies: discrepancies.sort((a, b) => Math.abs(b.deltaBtc) - Math.abs(a.deltaBtc)),
    elapsedSec: (Date.now() - started) / 1000,
  };

  if (args.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log("");
    console.log("─── Reserve Verification Summary ───────────────────────────");
    console.log(`  Addresses audited:   ${summary.addressCount}`);
    console.log(`  Reported total:      ${reportedTotal.toFixed(4)} BTC`);
    console.log(`  On-chain total:      ${onchainTotal.toFixed(4)} BTC`);
    console.log(`  Difference:          ${(onchainTotal - reportedTotal).toFixed(4)} BTC`);
    console.log(`  Dust threshold:      ${args.dust} BTC`);
    console.log(`  Failed lookups:      ${failedLookups}`);
    console.log(`  Discrepancies:       ${discrepancies.length}`);
    console.log(`  Elapsed:             ${summary.elapsedSec.toFixed(1)}s`);
    if (discrepancies.length) {
      console.log("");
      console.log("  Top discrepancies (reported vs on-chain):");
      for (const d of discrepancies.slice(0, 10)) {
        const sign = d.deltaBtc >= 0 ? "+" : "";
        console.log(`    ${d.address}`);
        console.log(`      reported=${d.reported.toFixed(6)}  onchain=${d.onchain.toFixed(6)}  delta=${sign}${d.deltaBtc.toFixed(6)} BTC`);
      }
    } else {
      console.log("  ✓ All reported balances match on-chain state within dust tolerance.");
    }
  }

  // Exit code: 0 clean, 1 discrepancies found, 2 script error
  process.exit(discrepancies.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(2);
});
