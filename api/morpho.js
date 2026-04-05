const MORPHO_API = "https://blue-api.morpho.org/graphql";

const VAULT_QUERY = `{
  vaults(
    first: 500
    orderBy: TotalAssetsUsd
    orderDirection: Desc
    where: { totalAssetsUsd_gte: 100000, listed: true }
  ) {
    items {
      name
      symbol
      address
      creationTimestamp
      chain { id network }
      asset { symbol address }
      listed
      state {
        totalAssetsUsd
        apy
        netApy
        fee
        curator
        owner
      }
      metadata { description }
    }
  }
}`;

const MARKET_QUERY = `{
  markets(
    first: 500
    orderBy: SupplyAssetsUsd
    orderDirection: Desc
    where: { supplyAssetsUsd_gte: 100000, listed: true }
  ) {
    items {
      marketId
      creationTimestamp
      chain { id network }
      loanAsset { symbol address }
      collateralAsset { symbol address }
      lltv
      state {
        supplyApy
        borrowApy
        netSupplyApy
        netBorrowApy
        supplyAssetsUsd
        borrowAssetsUsd
        utilization
        liquidityAssetsUsd
        fee
        rewards {
          asset { symbol }
          supplyApr
          borrowApr
        }
      }
    }
  }
}`;

const VAULT_V2_QUERY = `{
  vaultV2s(
    first: 500
    orderBy: TotalAssetsUsd
    orderDirection: Desc
    where: { totalAssetsUsd_gte: 100000, listed: true }
  ) {
    items {
      name
      symbol
      address
      creationTimestamp
      chain { id network }
      asset { symbol address }
      totalAssetsUsd
      apy
      netApy
      curator { address }
    }
  }
}`;

const MORPHO_DEPLOYMENTS = [
  { address: "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb", chainId: 1 },
  { address: "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb", chainId: 8453 },
  { address: "0x6c247b1F6182318877311737BaC0844bAa518F5e", chainId: 42161 },
  { address: "0x68e37dE8d93d3496ae143F2E900490f6280C57cD", chainId: 999 },
  { address: "0xce95AfbB8EA029495c66020883F87aaE8864AF92", chainId: 10 },
  { address: "0x1bF0c2541F820E775182832f06c0B7Fc27A25f67", chainId: 137 },
  { address: "0x8f5ae9CddB9f68de460C77730b018Ae7E04a140A", chainId: 130 },
  { address: "0xD5D960E8C380B724a48AC59E2DfF1b2CB4a1eAee", chainId: 143 },
  { address: "0xa40103088A899514E3fe474cD3cc5bf811b1102e", chainId: 988 },
  { address: "0xD50F2DffFd62f94Ee4AEd9ca05C61d0753268aBc", chainId: 747474 },
];

function buildHistoryQuery(address, chainId, startTimestamp) {
  return `{
    morphoBlueByAddress(address: "${address}", chainId: ${chainId}) {
      historicalState {
        tvlUsd(options: { startTimestamp: ${startTimestamp}, interval: DAY }) { x y }
        totalSupplyUsd(options: { startTimestamp: ${startTimestamp}, interval: DAY }) { x y }
        totalBorrowUsd(options: { startTimestamp: ${startTimestamp}, interval: DAY }) { x y }
      }
    }
  }`;
}

const CHAIN_NAMES = {
  1: "Ethereum",
  8453: "Base",
  999: "HyperEVM",
  42161: "Arbitrum",
  10: "Optimism",
  137: "Polygon",
  130: "Unichain",
  143: "Monad",
  988: "Stable",
  747474: "Katana",
};

function chainName(id) {
  return CHAIN_NAMES[id] || `Chain ${id}`;
}

async function fetchGraphQL(query) {
  const resp = await fetch(MORPHO_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Morpho API ${resp.status}: ${body}`);
  }
  return resp.json();
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");

  try {
    const startTimestamp = Math.floor(Date.now() / 1000) - 365 * 86400;

    const [vaultsRes, marketsRes, vaultsV2Res, ...historyResults] = await Promise.all([
      fetchGraphQL(VAULT_QUERY),
      fetchGraphQL(MARKET_QUERY),
      fetchGraphQL(VAULT_V2_QUERY),
      ...MORPHO_DEPLOYMENTS.map((d) =>
        fetchGraphQL(buildHistoryQuery(d.address, d.chainId, startTimestamp))
          .then((r) => r.data?.morphoBlueByAddress?.historicalState || null)
          .catch(() => null)
      ),
    ]);

    const vaults = (vaultsRes.data?.vaults?.items || []).map((v) => ({
      name: v.name,
      symbol: v.symbol,
      address: v.address,
      createdAt: v.creationTimestamp ? Number(v.creationTimestamp) : null,
      chain: chainName(v.chain?.id),
      chainId: v.chain?.id,
      asset: v.asset?.symbol,
      listed: v.listed,
      tvlUsd: v.state?.totalAssetsUsd || 0,
      apy: (v.state?.netApy || 0) * 100,
      grossApy: (v.state?.apy || 0) * 100,
      fee: (v.state?.fee || 0) * 100,
      curator: v.state?.curator,
      type: "v1",
    }));

    const vaultsV2 = (vaultsV2Res.data?.vaultV2s?.items || []).map((v) => ({
      name: v.name,
      symbol: v.symbol,
      address: v.address,
      createdAt: v.creationTimestamp ? Number(v.creationTimestamp) : null,
      chain: chainName(v.chain?.id),
      chainId: v.chain?.id,
      asset: v.asset?.symbol,
      tvlUsd: v.totalAssetsUsd || 0,
      apy: (v.netApy || 0) * 100,
      grossApy: (v.apy || 0) * 100,
      fee: 0,
      curator: v.curator?.address,
      type: "v2",
    }));

    const markets = (marketsRes.data?.markets?.items || []).filter((m) => m.collateralAsset != null).map((m) => ({
      marketId: m.marketId,
      createdAt: m.creationTimestamp ? Number(m.creationTimestamp) : null,
      chain: chainName(m.chain?.id),
      chainId: m.chain?.id,
      loanAsset: m.loanAsset?.symbol,
      collateralAsset: m.collateralAsset?.symbol || null,
      lltv: m.lltv ? Number(m.lltv) / 1e18 * 100 : null,
      supplyApy: (m.state?.supplyApy || 0) * 100,
      borrowApy: (m.state?.borrowApy || 0) * 100,
      netSupplyApy: (m.state?.netSupplyApy || 0) * 100,
      netBorrowApy: (m.state?.netBorrowApy || 0) * 100,
      supplyUsd: m.state?.supplyAssetsUsd || 0,
      borrowUsd: m.state?.borrowAssetsUsd || 0,
      utilization: (m.state?.utilization || 0) * 100,
      liquidityUsd: m.state?.liquidityAssetsUsd || 0,
      fee: (m.state?.fee || 0) * 100,
      rewards: (m.state?.rewards || []).map((r) => ({
        token: r.asset?.symbol,
        supplyApr: (r.supplyApr || 0) * 100,
        borrowApr: (r.borrowApr || 0) * 100,
      })),
    }));

    // Aggregate historical TVL across all chains
    const historyByDate = {};
    for (const h of historyResults) {
      if (!h) continue;
      for (const point of (h.tvlUsd || [])) {
        if (!historyByDate[point.x]) historyByDate[point.x] = { date: point.x, tvl: 0, supply: 0, borrow: 0 };
        historyByDate[point.x].tvl += point.y || 0;
      }
      for (const point of (h.totalSupplyUsd || [])) {
        if (!historyByDate[point.x]) historyByDate[point.x] = { date: point.x, tvl: 0, supply: 0, borrow: 0 };
        historyByDate[point.x].supply += point.y || 0;
      }
      for (const point of (h.totalBorrowUsd || [])) {
        if (!historyByDate[point.x]) historyByDate[point.x] = { date: point.x, tvl: 0, supply: 0, borrow: 0 };
        historyByDate[point.x].borrow += point.y || 0;
      }
    }
    const history = Object.values(historyByDate).sort((a, b) => a.date - b.date);

    return res.status(200).json({ vaults, vaultsV2, markets, history });
  } catch (err) {
    console.error("Morpho API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
