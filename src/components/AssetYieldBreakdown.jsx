import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import { fmt, fmtPct } from "../utils/format";
import { StatCard, tooltipStyle } from "./Shared";
import { chainName } from "../utils/constants";

const mono = "'JetBrains Mono', monospace";

export default function AssetYieldBreakdown({ stats, asset, yieldIndex, color }) {
  if (!stats) return null;

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <StatCard label={`${asset} Yield Index`} value={fmtPct(yieldIndex)} color={color} />
        <StatCard label={`Total ${asset} TVL`} value={fmt(stats.totalTvl, 1)} />
        <StatCard label="Pools Tracked" value={stats.poolCount.toString()} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "start" }}>
        {/* Protocol table */}
        <div>
          <div
            style={{
              fontSize: 10,
              color: "#4a5568",
              marginBottom: 5,
              fontFamily: mono,
              textTransform: "uppercase",
              letterSpacing: 1.2,
            }}
          >
            Top Protocols by {asset} TVL
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "4px 7px",
              fontSize: 10,
              fontFamily: mono,
              color: "#6b7a8d",
              marginBottom: 2,
            }}
          >
            <span>Protocol</span>
            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ minWidth: 60, textAlign: "right" }}>TVL</span>
              <span style={{ minWidth: 45, textAlign: "right" }}>APY</span>
            </div>
          </div>
          {stats.topProtocols.map((p, i) => (
            <div
              key={p.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "4px 7px",
                background: i % 2 === 0 ? "rgba(255,255,255,0.012)" : "transparent",
                borderRadius: 2,
                fontSize: 13,
                fontFamily: mono,
              }}
            >
              <span style={{ color: "#cbd5e1" }}>{p.name}</span>
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ color: "#94a3b8", minWidth: 60, textAlign: "right" }}>
                  {fmt(p.tvl, 0)}
                </span>
                <span style={{ color, minWidth: 45, textAlign: "right" }}>
                  {fmtPct(p.apy)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Chain bar chart */}
        <div>
          <div
            style={{
              fontSize: 10,
              color: "#4a5568",
              marginBottom: 5,
              fontFamily: mono,
              textTransform: "uppercase",
              letterSpacing: 1.2,
            }}
          >
            {asset} Yield by Chain
          </div>
          <div style={{ height: 22 }} /> {/* spacer to align with protocol column headers */}
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={stats.topChains.map(c => ({ ...c, name: chainName(c.name) }))} layout="vertical" margin={{ left: 52, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.035)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: "#6b7a8d", fontFamily: mono }}
                  tickFormatter={(v) => `${v.toFixed(1)}%`}
                  stroke="rgba(255,255,255,0.05)"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#94a3b8", fontFamily: mono }}
                  stroke="rgba(255,255,255,0.05)"
                  width={48}
                />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#e2e8f0" }} itemStyle={{ color: "#e2e8f0" }} formatter={(v) => [`${v.toFixed(2)}%`, "Avg APY"]} />
                <Bar dataKey="apy" radius={[0, 3, 3, 0]}>
                  {stats.topChains.map((_, i) => {
                    // Parse hex color to rgba with decreasing opacity
                    const opacity = 0.85 - i * 0.09;
                    return <Cell key={i} fill={color} fillOpacity={opacity} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
