import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import { fmt, fmtPct } from "../utils/format";
import { StatCard, tooltipStyle } from "./Shared";

const mono = "'JetBrains Mono', monospace";

export default function StablecoinIndex({ stats }) {
  if (!stats) return null;

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <StatCard label="Stablecoin Yield Index" value={fmtPct(stats.weightedApy)} color="#fbbf24" />
        <StatCard label="Total Stablecoin TVL" value={fmt(stats.totalTvl, 1)} />
        <StatCard label="Pools Tracked" value={stats.poolCount.toString()} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Protocol table */}
        <div>
          <div
            style={{
              fontSize: 9.5,
              color: "#3f4e5f",
              marginBottom: 5,
              fontFamily: mono,
              textTransform: "uppercase",
              letterSpacing: 1.2,
            }}
          >
            Top Protocols by Stablecoin TVL
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
                fontSize: 10,
                fontFamily: mono,
              }}
            >
              <span style={{ color: "#a0aec0" }}>{p.name}</span>
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ color: "#3f4e5f", minWidth: 60, textAlign: "right" }}>
                  {fmt(p.tvl, 0)}
                </span>
                <span style={{ color: "#fbbf24", minWidth: 45, textAlign: "right" }}>
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
              fontSize: 9.5,
              color: "#3f4e5f",
              marginBottom: 5,
              fontFamily: mono,
              textTransform: "uppercase",
              letterSpacing: 1.2,
            }}
          >
            Stablecoin Yield by Chain
          </div>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={stats.topChains} layout="vertical" margin={{ left: 52, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.035)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 9, fill: "#3f4e5f", fontFamily: mono }}
                  tickFormatter={(v) => `${v.toFixed(1)}%`}
                  stroke="rgba(255,255,255,0.05)"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 9, fill: "#6b7a8d", fontFamily: mono }}
                  stroke="rgba(255,255,255,0.05)"
                  width={48}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v.toFixed(2)}%`, "Avg APY"]} />
                <Bar dataKey="apy" radius={[0, 3, 3, 0]}>
                  {stats.topChains.map((_, i) => (
                    <Cell key={i} fill={`rgba(251,191,36,${0.85 - i * 0.09})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
