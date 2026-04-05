import React, { useState } from "react";
import { fmt, fmtPct } from "../utils/format";
import { chainName } from "../utils/constants";

const mono = "'JetBrains Mono', monospace";

const truncCell = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const tableBase = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
  fontFamily: mono,
  tableLayout: "fixed",
};

const thStyle = { textAlign: "left", padding: "8px 6px", color: "#6b7a8d", fontWeight: 500, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 };

function MoverTable({ pools, label, labelColor }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          color: labelColor,
          marginBottom: 5,
          fontFamily: mono,
          textTransform: "uppercase",
          letterSpacing: 1.2,
        }}
      >
        {label}
      </div>
      <table style={tableBase}>
        <colgroup>
          <col style={{ width: "24%" }} />
          <col style={{ width: "20%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "12%" }} />
        </colgroup>
        <thead>
          <tr>
            <th style={thStyle}>Protocol</th>
            <th style={thStyle}>Pool</th>
            <th style={thStyle}>Chain</th>
            <th style={thStyle}>APY</th>
            <th style={thStyle}>TVL</th>
            <th style={thStyle}>7d</th>
          </tr>
        </thead>
        <tbody>
          {pools.map((p, i) => {
            const change = p.apyPct7D;
            const isUp = change > 0;
            return (
              <tr
                key={p.pool || i}
                onClick={() => window.open(`https://defillama.com/yields/pool/${p.pool}`, "_blank")}
                style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.012)" : "transparent", cursor: "pointer" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? "rgba(255,255,255,0.012)" : "transparent"}
              >
                <td style={{ ...truncCell, padding: "8px 6px", color: "#94a3b8" }} title={p.project}>
                  {p.project}
                </td>
                <td style={{ ...truncCell, padding: "8px 6px", color: "#cbd5e1" }} title={p.symbol}>
                  {p.symbol}
                </td>
                <td style={{ ...truncCell, padding: "8px 6px", color: "#94a3b8" }}>
                  {chainName(p.chain)}
                </td>
                <td style={{ padding: "8px 6px", color: "#cbd5e1" }}>
                  {fmtPct(p.apy)}
                </td>
                <td style={{ padding: "8px 6px", color: "#94a3b8" }}>
                  {fmt(p.tvlUsd)}
                </td>
                <td style={{ padding: "8px 6px", color: isUp ? "#34d399" : "#f87171", fontWeight: 500 }}>
                  {isUp ? "+" : ""}{change.toFixed(1)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!pools.length && (
        <div style={{ fontSize: 12, color: "#4a5568", fontFamily: mono, padding: 8 }}>
          No significant movers
        </div>
      )}
    </div>
  );
}

function TopApyTable({ pools }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          color: "#60a5fa",
          marginBottom: 5,
          fontFamily: mono,
          textTransform: "uppercase",
          letterSpacing: 1.2,
        }}
      >
        Top Yields
      </div>
      <table style={tableBase}>
        <colgroup>
          <col style={{ width: "24%" }} />
          <col style={{ width: "24%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "18%" }} />
        </colgroup>
        <thead>
          <tr>
            <th style={thStyle}>Protocol</th>
            <th style={thStyle}>Pool</th>
            <th style={thStyle}>Chain</th>
            <th style={thStyle}>APY</th>
            <th style={thStyle}>TVL</th>
          </tr>
        </thead>
        <tbody>
          {pools.map((p, i) => (
            <tr
              key={p.pool || i}
              onClick={() => window.open(`https://defillama.com/yields/pool/${p.pool}`, "_blank")}
              style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.012)" : "transparent", cursor: "pointer" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
              onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? "rgba(255,255,255,0.012)" : "transparent"}
            >
              <td style={{ ...truncCell, padding: "8px 6px", color: "#94a3b8" }} title={p.project}>
                {p.project}
              </td>
              <td style={{ ...truncCell, padding: "8px 6px", color: "#cbd5e1" }} title={p.symbol}>
                {p.symbol}
              </td>
              <td style={{ ...truncCell, padding: "8px 6px", color: "#94a3b8" }}>
                {chainName(p.chain)}
              </td>
              <td style={{ padding: "8px 6px", color: "#60a5fa", fontWeight: 500 }}>
                {fmtPct(p.apy)}
              </td>
              <td style={{ padding: "8px 6px", color: "#94a3b8" }}>
                {fmt(p.tvlUsd)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!pools.length && (
        <div style={{ fontSize: 12, color: "#4a5568", fontFamily: mono, padding: 8 }}>
          No pools found
        </div>
      )}
    </div>
  );
}

export default function TrendingYields({ trending, asset }) {
  const [showTip, setShowTip] = useState(false);

  if (!trending) return null;
  const { gainers, losers, topApy = [] } = trending;
  if (!gainers.length && !losers.length && !topApy.length) return null;

  return (
    <div>
      {topApy.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <TopApyTable pools={topApy} />
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <MoverTable pools={gainers} label="Biggest Gainers (7d)" labelColor="#34d399" />
        <MoverTable pools={losers} label="Biggest Losers (7d)" labelColor="#f87171" />
      </div>
      <div style={{ position: "relative", marginTop: 8, display: "inline-block" }}>
        <div
          style={{
            fontSize: 10,
            color: "#4a5568",
            fontFamily: mono,
            fontStyle: "italic",
            cursor: "pointer",
          }}
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
        >
          Ranked by TVL-weighted trend score ⓘ
        </div>
        {showTip && (
          <div
            style={{
              position: "absolute",
              bottom: "calc(100% + 6px)",
              left: 0,
              background: "#1a2332",
              border: "1px solid #2a3a4a",
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 10,
              color: "#e2e8f0",
              fontFamily: mono,
              fontStyle: "normal",
              width: 280,
              lineHeight: 1.5,
              zIndex: 10,
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            {(() => {
              const floors = { ETH: "$10M", BTC: "$10M", USD: "$10M", SOL: "$5M", HYPE: "$5M", EUR: "$2M" };
              const f = floors[asset] || "$10M";
              return (<>
                <strong style={{ color: "#a0aec0" }}>Trend Score</strong> = |7d APY change| × min(TVL / {f}, 1)
                <br /><br />
                Pools under {f} TVL are excluded. Remaining pools are scored with TVL weighting to surface high-liquidity movers.
              </>);
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
