import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { CATEGORY_MAP, CHAIN_MIN_POOLS } from "../utils/constants";

const POOLS_URL = "https://yields.llama.fi/pools";
const PROTOCOLS_URL = "https://api.llama.fi/protocols";
const MIN_TVL = 1_000_000;
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Per-token matchers for checking individual tokens in a symbol
const TOKEN_MATCHERS = {
  ETH: (tok) => tok.includes("ETH"),
  BTC: (tok) => tok.includes("BTC"),
  USD: null, // handled via stablecoin flag on the pool
  SOL: (tok) => tok.includes("SOL"),
  HYPE: (tok) => {
    if (!tok.includes("HYPE")) return false;
    // Exclude tokens where HYPE is part of HYPER (e.g. MHYPERBTC, MIDASHYPER)
    if (tok.includes("HYPER")) return false;
    return true;
  },
  EUR: (tok) => tok.includes("EUR"),
};

export const ASSET_MATCHERS = [
  { key: "ETH", test: (p) => p.symbol.toUpperCase().includes("ETH") },
  { key: "BTC", test: (p) => p.symbol.toUpperCase().includes("BTC") },
  { key: "USD", test: (p) => {
    if (!p.stablecoin) return false;
    const sym = p.symbol.toUpperCase();
    // Exclude EUR-denominated stablecoins (EURC, EURS, EURE, etc.)
    if (sym.includes("EUR")) return false;
    // Exclude mislabeled SOL staking tokens (e.g. LANTERNSOL)
    if (sym.endsWith("SOL")) return false;
    return true;
  }},
  { key: "SOL", test: (p) => p.symbol.toUpperCase().includes("SOL") },
  { key: "HYPE", test: (p) => {
    const sym = p.symbol.toUpperCase();
    if (!sym.includes("HYPE") || p.stablecoin === true) return false;
    if (sym.includes("HYPER")) return false;
    return true;
  }},
  { key: "EUR", test: (p) => p.symbol.toUpperCase().includes("EUR") },
];

function isSameAssetPair(pool, assetKey) {
  // For USD, use the same test as ASSET_MATCHERS
  if (assetKey === "USD") {
    const usdMatcher = ASSET_MATCHERS.find((a) => a.key === "USD");
    return usdMatcher.test(pool);
  }
  const tokenTest = TOKEN_MATCHERS[assetKey];
  if (!tokenTest) return false;
  const tokens = pool.symbol.toUpperCase().split("-");
  return tokens.length > 1 && tokens.every((tok) => tokenTest(tok));
}

// Projects whose pools are all USD-denominated regardless of symbol
const FORCE_USD_PROJECTS = new Set(["fraxlend"]);

function filterByAsset(pools, assetKey) {
  const matcher = ASSET_MATCHERS.find((a) => a.key === assetKey);
  if (!matcher) return [];
  return pools.filter((p) => {
    // Fraxlend symbols show collateral, not lend asset — always USD
    if (FORCE_USD_PROJECTS.has(p.project)) return assetKey === "USD";
    if (p.exposure === "single" && matcher.test(p)) return true;
    // Include multi-exposure pools where all tokens match the same asset class
    if (p.exposure === "multi" && isSameAssetPair(p, assetKey)) return true;
    return false;
  });
}

function computeWeightedApy(pools) {
  if (!pools.length) return 0;
  const totalTvl = pools.reduce((s, p) => s + p.tvlUsd, 0);
  if (!totalTvl) return 0;
  return pools.reduce((s, p) => s + p.apy * (p.tvlUsd / totalTvl), 0);
}

export function useDeFiData(selectedAsset) {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = useCallback((isInitial = false, isManual = false) => {
    if (isInitial) setLoading(true);
    if (isManual) setRefreshing(true);
    Promise.all([
      fetch(PROTOCOLS_URL).then((r) => {
        if (!r.ok) throw new Error(`Protocols HTTP ${r.status}`);
        return r.json();
      }),
      fetch(POOLS_URL).then((r) => {
        if (!r.ok) throw new Error(`Pools HTTP ${r.status}`);
        return r.json();
      }),
    ])
      .then(([protocols, poolsJson]) => {
        const projectCategoryMap = {};
        protocols.forEach((p) => {
          const dashCat = CATEGORY_MAP[p.category];
          if (dashCat) projectCategoryMap[p.slug] = dashCat;
        });
        const raw = poolsJson.data || [];
        const mapped = raw
          .filter((p) => {
            const cat = projectCategoryMap[p.project];
            return cat && p.project !== "merkl" && p.tvlUsd >= 500000 && p.apy > 0 && p.apy < 200;
          })
          .map((p) => ({
            ...p,
            // Fraxlend pools are all stablecoin — DeFiLlama doesn't flag them
            stablecoin: p.project === "fraxlend" ? true : p.stablecoin,
            dashCategory: projectCategoryMap[p.project],
          }));
        setPools(mapped);
        setLastUpdated(new Date());
        setLoading(false);
        setRefreshing(false);
        setError(null);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    fetchData(true);
    intervalRef.current = setInterval(() => fetchData(false), REFRESH_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [fetchData]);

  // Base pool set: single-exposure, reasonable APY, >= MIN_TVL
  const qualifiedPools = useMemo(
    () => pools.filter((p) => p.tvlUsd >= MIN_TVL && p.apy > 0 && p.apy < 100),
    [pools]
  );

  // Per-asset yield summary (for the tabs)
  const assetYields = useMemo(() => {
    return ASSET_MATCHERS.map(({ key }) => {
      const matching = filterByAsset(qualifiedPools, key);
      // For non-USD assets, exclude stablecoin-category pools
      const filtered = key !== "USD"
        ? matching.filter((p) => p.dashCategory !== "Stablecoin")
        : matching;
      if (!filtered.length) return { asset: key, weightedApy: null, tvl: 0, pools: 0 };
      const tvl = filtered.reduce((s, p) => s + p.tvlUsd, 0);
      const weightedApy = computeWeightedApy(filtered);
      return { asset: key, weightedApy, tvl, pools: filtered.length };
    });
  }, [qualifiedPools]);

  // Scoped to selected asset (single-exposure, same MIN_TVL)
  const assetPools = useMemo(() => {
    const filtered = filterByAsset(qualifiedPools, selectedAsset);
    // For non-USD assets, exclude pools in the Stablecoin category
    // (a stablecoin-category pool shouldn't have volatile asset exposure)
    if (selectedAsset !== "USD") {
      return filtered.filter((p) => p.dashCategory !== "Stablecoin");
    }
    return filtered;
  }, [qualifiedPools, selectedAsset]);

  // One canonical yield index for the selected asset
  const yieldIndex = useMemo(() => computeWeightedApy(assetPools), [assetPools]);

  // Top protocols + chains for selected asset
  const assetProtocolStats = useMemo(() => {
    if (!assetPools.length) return null;

    const byProj = {};
    assetPools.forEach((p) => {
      if (!byProj[p.project]) byProj[p.project] = { tvl: 0, wa: 0 };
      byProj[p.project].tvl += p.tvlUsd;
      byProj[p.project].wa += p.apy * p.tvlUsd;
    });
    const topProtocols = Object.entries(byProj)
      .map(([name, d]) => ({ name, tvl: d.tvl, apy: d.wa / d.tvl }))
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, 10);

    const byCh = {};
    const chPools = {};
    assetPools.forEach((p) => {
      if (!byCh[p.chain]) byCh[p.chain] = { tvl: 0, wa: 0 };
      byCh[p.chain].tvl += p.tvlUsd;
      byCh[p.chain].wa += p.apy * p.tvlUsd;
      chPools[p.chain] = (chPools[p.chain] || 0) + 1;
    });
    const topChains = Object.entries(byCh)
      .map(([name, d]) => ({ name, tvl: d.tvl, apy: d.wa / d.tvl }))
      .filter((c) => (chPools[c.name] || 0) >= CHAIN_MIN_POOLS)
      .sort((a, b) => b.apy - a.apy)
      .slice(0, 7);

    const totalTvl = assetPools.reduce((s, p) => s + p.tvlUsd, 0);
    return { totalTvl, poolCount: assetPools.length, topProtocols, topChains };
  }, [assetPools]);

  // Lending rates for selected asset
  const assetLendingRates = useMemo(() => {
    const lendingPools = assetPools.filter(
      (p) => p.dashCategory === "Lending" && p.apy < 30
    );
    const byProj = {};
    lendingPools.forEach((p) => {
      if (!byProj[p.project]) byProj[p.project] = { tvl: 0, wa: 0 };
      byProj[p.project].tvl += p.tvlUsd;
      byProj[p.project].wa += p.apy * p.tvlUsd;
    });
    const protocols = Object.entries(byProj)
      .map(([name, d]) => ({ name, supplyApy: d.wa / d.tvl, tvl: d.tvl }))
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, 12);

    return { protocols };
  }, [assetPools]);

  // Trending: biggest APY movers for selected asset (7d change)
  // Scored by apyPct7D × min(TVL / threshold, 1) to discount low-TVL spikes
  // Use lower threshold for niche assets with fewer large pools
  const TRENDING_TVL_THRESHOLD = 10_000_000;
  const TRENDING_TVL_FLOORS = {
    ETH: 10_000_000,
    BTC: 10_000_000,
    USD: 10_000_000,
    SOL: 5_000_000,
    HYPE: 5_000_000,
    EUR: 2_000_000,
  };
  const trendingPools = useMemo(() => {
    const tvlFloor = TRENDING_TVL_FLOORS[selectedAsset] || 10_000_000;
    const tvlDenom = tvlFloor;
    const withChange = assetPools
      .filter((p) => p.apyPct7D != null && Math.abs(p.apyPct7D) > 0.1 && p.tvlUsd >= tvlFloor)
      .map((p) => ({
        ...p,
        trendScore: Math.abs(p.apyPct7D) * Math.min(p.tvlUsd / tvlDenom, 1),
      }));
    const gainers = withChange
      .filter((p) => p.apyPct7D > 0)
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, 5);
    const losers = withChange
      .filter((p) => p.apyPct7D < 0)
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, 5);
    const topApy = assetPools
      .filter((p) => p.tvlUsd >= tvlFloor)
      .sort((a, b) => b.apy - a.apy)
      .slice(0, 5);
    return { gainers, losers, topApy };
  }, [assetPools, selectedAsset]);

  return {
    pools,
    loading,
    error,
    lastUpdated,
    refreshing,
    refresh: () => fetchData(false, true),
    assetYields,
    assetPools,
    yieldIndex,
    assetProtocolStats,
    assetLendingRates,
    trendingPools,
  };
}
