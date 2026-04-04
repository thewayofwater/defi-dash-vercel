import React, { useState } from "react";
import { useDeFiData } from "./hooks/useDeFiData";
import { fmt, fmtPct } from "./utils/format";
import { ASSET_COLORS } from "./utils/constants";
import {
  SectionHeader,
  LoadingSpinner,
  ModuleCard,
} from "./components/Shared";
import TVLHeatmap from "./components/TVLHeatmap";
import AssetYieldBreakdown from "./components/AssetYieldBreakdown";
import RateOverlay from "./components/RateOverlay";
import TrendingYields from "./components/TrendingYields";
import TwitterFeed from "./components/TwitterFeed";
import { useTwitterFeed } from "./hooks/useTwitterFeed";

const mono = "'JetBrains Mono', monospace";
const ASSETS = ["ETH", "BTC", "USD", "SOL", "HYPE", "EUR"];

export default function App() {
  const [selectedAsset, setSelectedAsset] = useState("ETH");

  const {
    pools,
    loading,
    error,
    lastUpdated,
    refreshing,
    refresh,
    assetYields,
    assetPools,
    yieldIndex,
    assetProtocolStats,
    assetLendingRates,
    trendingPools,
  } = useDeFiData(selectedAsset);

  const { tweets, loading: tweetsLoading, error: tweetsError } = useTwitterFeed(selectedAsset);

  const color = ASSET_COLORS[selectedAsset];

  if (error) {
    return (
      <div
        style={{
          background: "#0a0e17",
          color: "#f87171",
          padding: 40,
          fontFamily: mono,
          textAlign: "center",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600 }}>Failed to load data</div>
        <div style={{ fontSize: 11, color: "#94a3b8" }}>{error}</div>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 12,
            padding: "8px 20px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 5,
            color: "#e2e8f0",
            cursor: "pointer",
            fontSize: 11,
            fontFamily: mono,
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          background: "#0a0e17",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LoadingSpinner message="Pulling live data from DeFiLlama..." />
      </div>
    );
  }

  return (
    <div style={{ background: "#0a0e17", color: "#e2e8f0", minHeight: "100vh" }}>
      {/* Header */}
      <div
        style={{
          padding: "20px 26px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          background:
            "linear-gradient(180deg, rgba(34,211,238,0.02) 0%, transparent 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 19,
                fontWeight: 700,
                margin: 0,
                color: "#f1f5f9",
                letterSpacing: "-0.02em",
              }}
            >
              DeFi Yield Landscape
              <span
                style={{
                  color: "#22d3ee",
                  marginLeft: 8,
                  fontSize: 9.5,
                  fontWeight: 500,
                  fontFamily: mono,
                  verticalAlign: "middle",
                  background: "rgba(34,211,238,0.07)",
                  padding: "2px 7px",
                  borderRadius: 3,
                  letterSpacing: 1,
                }}
              >
                LAYER 1 / MACRO
              </span>
            </h1>
            <div
              style={{
                fontSize: 10,
                color: "#2d3a4a",
                marginTop: 2,
                fontFamily: mono,
              }}
            >
              Live data from DeFiLlama
              {lastUpdated && ` · Updated ${lastUpdated.toLocaleTimeString()}`}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              onClick={refresh}
              disabled={refreshing}
              style={{
                background: refreshing ? "rgba(34,211,238,0.08)" : "rgba(255,255,255,0.04)",
                border: refreshing ? "1px solid rgba(34,211,238,0.2)" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 4,
                padding: "5px 10px",
                fontSize: 8.5,
                color: refreshing ? "#22d3ee" : "#4a5568",
                fontFamily: mono,
                letterSpacing: 0.5,
                cursor: refreshing ? "default" : "pointer",
                opacity: refreshing ? 0.8 : 1,
              }}
            >
              {refreshing ? "↻ REFRESHING..." : "↻ REFRESH"}
            </button>
            <div
              style={{
                background: "rgba(34,211,238,0.07)",
                border: "1px solid rgba(34,211,238,0.12)",
                borderRadius: 4,
                padding: "5px 10px",
                fontSize: 8.5,
                color: "#22d3ee",
                fontFamily: mono,
                letterSpacing: 0.5,
              }}
            >
              LIVE
            </div>
          </div>
        </div>

        {/* Asset tabs */}
        <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
          {ASSETS.map((asset) => {
            const data = assetYields.find((a) => a.asset === asset);
            const isSelected = asset === selectedAsset;
            const assetColor = ASSET_COLORS[asset];
            return (
              <button
                key={asset}
                onClick={() => setSelectedAsset(asset)}
                style={{
                  background: isSelected
                    ? `${assetColor}18`
                    : "rgba(255,255,255,0.025)",
                  border: isSelected
                    ? `1px solid ${assetColor}50`
                    : "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 6,
                  padding: "10px 16px",
                  cursor: "pointer",
                  flex: 1,
                  minWidth: 90,
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: isSelected ? assetColor : "#6b7a8d",
                    fontFamily: mono,
                  }}
                >
                  {asset}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: isSelected ? "#e2e8f0" : "#4a5568",
                    fontFamily: mono,
                    lineHeight: 1.2,
                    marginTop: 2,
                  }}
                >
                  {data?.weightedApy != null ? fmtPct(data.weightedApy) : "—"}
                </div>
                <div
                  style={{
                    fontSize: 8.5,
                    color: isSelected ? "#3f4e5f" : "#2d3a4a",
                    fontFamily: mono,
                    marginTop: 1,
                  }}
                >
                  {data?.pools || 0} pools · {fmt(data?.tvl || 0, 1)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modules */}
      <div
        style={{
          padding: "20px 26px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <ModuleCard>
          <SectionHeader
            title={`${selectedAsset} Yield Chatter`}
            subtitle="Recent tweets about yield opportunities — sorted by engagement"
          />
          <TwitterFeed tweets={tweets} loading={tweetsLoading} error={tweetsError} />
        </ModuleCard>

        <ModuleCard>
          <SectionHeader
            title={`${selectedAsset} Trending Yields`}
            subtitle={`Biggest APY movers over the past 7 days`}
          />
          <TrendingYields trending={trendingPools} asset={selectedAsset} />
        </ModuleCard>

        <ModuleCard>
          <TVLHeatmap pools={assetPools} asset={selectedAsset} />
        </ModuleCard>

        <ModuleCard>
          <SectionHeader
            title={`${selectedAsset} Yield Breakdown`}
            subtitle={`Top protocols and chains by ${selectedAsset} yield (single-exposure pools)`}
          />
          <AssetYieldBreakdown stats={assetProtocolStats} asset={selectedAsset} yieldIndex={yieldIndex} color={color} />
        </ModuleCard>

        <ModuleCard>
          <SectionHeader
            title={`${selectedAsset} Lending Rates`}
            subtitle={`Supply APY by protocol vs. ${selectedAsset} yield index`}
          />
          <RateOverlay rateData={assetLendingRates} asset={selectedAsset} yieldIndex={yieldIndex} color={color} />
        </ModuleCard>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            padding: "12px 0",
            fontSize: 8.5,
            color: "#1e2838",
            fontFamily: mono,
            borderTop: "1px solid rgba(255,255,255,0.025)",
          }}
        >
          DeFi Yield Dashboard · Live data from DeFiLlama yields API
        </div>
      </div>
    </div>
  );
}
