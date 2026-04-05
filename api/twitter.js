const BEARER = process.env.TWITTER_BEARER_TOKEN;
const SEARCH_URL = "https://api.x.com/2/tweets/search/recent";

// Curated DeFi accounts — protocols, analysts, aggregators (max ~15 to stay under 512 char query limit)
const ACCOUNTS = [
  "DefiLlama", "DeFi_Made_Here", "yieldsandmore", "phtevenstrong",
  "AaveAave", "MorphoLabs", "0xfluid", "LidoFinance",
  "CurveFinance", "pendle_fi", "pendleintern", "yearnfi",
  "EthenaLabs", "HyperliquidX", "JitoLabs", "stakedaohq",
  "sassal0x", "0xHamz", "eigenlayer", "0xtindorr", "originprotocol", "nomaticcap",
];

const FROM_CLAUSE = ACCOUNTS.map((a) => `from:${a}`).join(" OR ");

// Asset-specific queries using quoted phrases to ensure yield context matches the asset
const ASSET_QUERIES = {
  ETH: '("ETH yield" OR "ETH yields" OR "ETH APY" OR "ETH staking" OR stETH OR wstETH OR rETH)',
  BTC: '("BTC yield" OR "BTC yields" OR "BTC APY" OR "BTC staking" OR WBTC OR cbBTC)',
  USD: '("stablecoin yield" OR "USDC yield" OR "USDT yield" OR "USDC APY" OR "USDT APY" OR USDe)',
  SOL: '("SOL yield" OR "SOL yields" OR "SOL APY" OR "SOL staking" OR mSOL OR jitoSOL)',
  HYPE: '("HYPE yield" OR "HYPE APY" OR "HYPE staking" OR sHYPE)',
  EUR: '("EUR yield" OR "EUR APY" OR EURE OR EURC)',
};

function buildQuery(asset) {
  const assetQ = ASSET_QUERIES[asset];
  if (assetQ) {
    return `(${FROM_CLAUSE}) ${assetQ} -is:retweet lang:en`;
  }
  return `(${FROM_CLAUSE}) (yield OR APY OR APR OR staking OR lending OR TVL) -is:retweet lang:en`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  if (!BEARER) {
    return res.status(500).json({ error: "Twitter Bearer Token not configured" });
  }

  const asset = (req.query.asset || "ETH").toUpperCase();
  const query = buildQuery(asset);

  // X API query max is 512 chars — if too long, drop asset keywords
  const finalQuery = query.length <= 512
    ? query
    : `(${FROM_CLAUSE}) (yield OR APY OR APR OR staking OR lending OR TVL) -is:retweet lang:en`;

  const params = new URLSearchParams({
    query: finalQuery,
    max_results: "10",
    "tweet.fields": "created_at,public_metrics,author_id",
    expansions: "author_id",
    "user.fields": "name,username,profile_image_url,public_metrics",
  });

  try {
    const resp = await fetch(`${SEARCH_URL}?${params}`, {
      headers: { Authorization: `Bearer ${BEARER}` },
    });

    if (!resp.ok) {
      const body = await resp.text();
      console.error("Twitter API error:", resp.status, body);
      return res.status(resp.status).json({ error: `Twitter API ${resp.status}`, detail: body });
    }

    const data = await resp.json();

    // Map author info onto tweets
    const users = {};
    (data.includes?.users || []).forEach((u) => {
      users[u.id] = u;
    });

    const tweets = (data.data || []).map((t) => {
      const author = users[t.author_id] || {};
      return {
        id: t.id,
        text: t.text,
        createdAt: t.created_at,
        metrics: t.public_metrics,
        author: {
          name: author.name,
          username: author.username,
          profileImage: author.profile_image_url,
          followers: author.public_metrics?.followers_count || 0,
        },
      };
    });

    // Sort by engagement (likes + retweets + replies)
    tweets.sort((a, b) => {
      const engA = (a.metrics?.like_count || 0) + (a.metrics?.retweet_count || 0) + (a.metrics?.reply_count || 0);
      const engB = (b.metrics?.like_count || 0) + (b.metrics?.retweet_count || 0) + (b.metrics?.reply_count || 0);
      return engB - engA;
    });

    return res.status(200).json({
      asset,
      tweets,
      meta: data.meta,
    });
  } catch (err) {
    console.error("Twitter fetch error:", err);
    return res.status(500).json({ error: err.message });
  }
}
