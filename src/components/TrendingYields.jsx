import React, { useState, useMemo } from "react";
import { fmt, fmtPct } from "../utils/format";
import { chainName } from "../utils/constants";

const mono = "'JetBrains Mono', monospace";
const PAGE_SIZE = 10;
const DEFAULT_MIN_TVL = 10_000_000;

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

const thStyle = { textAlign: "left", padding: "8px 6px", color: "#6b7a8d", fontWeight: 500, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, cursor: "pointer" };

const FILTER_STYLE = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 4,
  padding: "5px 8px",
  fontSize: 12,
  fontFamily: mono,
  color: "#cbd5e1",
  outline: "none",
  minWidth: 80,
};

export default function TrendingYields({ pools, asset }) {
  if (!pools || !pools.length) return null;

  const [searchQuery, setSearchQuery] = useState("");
  const [protocolFilter, setProtocolFilter] = useState("");
  const [chainFilter, setChainFilter] = useState("");
  const [minTvl, setMinTvl] = useState(DEFAULT_MIN_TVL);
  const [sortKey, setSortKey] = useState("apy");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(0);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
    setPage(0);
  };
  const sortIcon = (key) => sortKey === key ? (sortDir === "desc" ? " \u2193" : " \u2191") : "";

  const filterOptions = useMemo(() => {
    const protocols = [...new Set(pools.map((p) => p.project))].sort();
    const chains = [...new Set(pools.map((p) => p.chain))].sort();
    return { protocols, chains };
  }, [pools]);

  const filtered = useMemo(() => {
    let arr = pools.filter((p) => p.tvlUsd >= minTvl && p.apy > 0 && p.apy <= 100);
    if (protocolFilter) arr = arr.filter((p) => p.project === protocolFilter);
    if (chainFilter) arr = arr.filter((p) => p.chain === chainFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      arr = arr.filter((p) =>
        (p.symbol || "").toLowerCase().includes(q) ||
        (p.project || "").toLowerCase().includes(q) ||
        (p.chain || "").toLowerCase().includes(q)
      );
    }
    return arr;
  }, [pools, minTvl, protocolFilter, chainFilter, searchQuery]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] || 0;
      const bv = b[sortKey] || 0;
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "desc" ? bv - av : av - bv;
      }
      return sortDir === "desc"
        ? String(bv).localeCompare(String(av))
        : String(av).localeCompare(String(bv));
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const rows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      {/* Search */}
      <input
        type="text"
        placeholder="Search by symbol, protocol, or chain..."
        value={searchQuery}
        onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
        style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, padding: "7px 10px", fontSize: 12, fontFamily: mono, color: "#cbd5e1", outline: "none", marginBottom: 10, boxSizing: "border-box" }}
      />

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "#6b7a8d", fontFamily: mono, letterSpacing: 0.5 }}>Protocol</span>
        <select style={FILTER_STYLE} value={protocolFilter} onChange={(e) => { setProtocolFilter(e.target.value); setPage(0); }}>
          <option value="">All</option>
          {filterOptions.protocols.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <span style={{ fontSize: 10, color: "#6b7a8d", fontFamily: mono, letterSpacing: 0.5 }}>Chain</span>
        <select style={FILTER_STYLE} value={chainFilter} onChange={(e) => { setChainFilter(e.target.value); setPage(0); }}>
          <option value="">All</option>
          {filterOptions.chains.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{ fontSize: 10, color: "#6b7a8d", fontFamily: mono, letterSpacing: 0.5 }}>Min TVL</span>
        <select style={FILTER_STYLE} value={minTvl} onChange={(e) => { setMinTvl(Number(e.target.value)); setPage(0); }}>
          <option value={1_000_000}>$1M</option>
          <option value={5_000_000}>$5M</option>
          <option value={10_000_000}>$10M</option>
          <option value={25_000_000}>$25M</option>
          <option value={50_000_000}>$50M</option>
          <option value={100_000_000}>$100M</option>
        </select>
        <span style={{ fontSize: 10, color: "#6b7a8d", fontFamily: mono }}>{filtered.length} pools</span>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={tableBase}>
          <colgroup>
            <col style={{ width: "22%" }} />
            <col style={{ width: "24%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "14%" }} />
          </colgroup>
          <thead>
            <tr>
              <th style={thStyle} onClick={() => toggleSort("project")}>Protocol{sortIcon("project")}</th>
              <th style={thStyle} onClick={() => toggleSort("symbol")}>Pool{sortIcon("symbol")}</th>
              <th style={thStyle} onClick={() => toggleSort("chain")}>Chain{sortIcon("chain")}</th>
              <th style={thStyle} onClick={() => toggleSort("apy")}>APY{sortIcon("apy")}</th>
              <th style={thStyle} onClick={() => toggleSort("tvlUsd")}>TVL{sortIcon("tvlUsd")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr
                key={p.pool || i}
                onClick={() => {
                  if (p.url) window.open(p.url, "_blank");
                  else if (p.pool && !p.pool.startsWith("morpho-")) window.open(`https://defillama.com/yields/pool/${p.pool}`, "_blank");
                }}
                style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.012)" : "transparent", cursor: p.url || (p.pool && !p.pool.startsWith("morpho-")) ? "pointer" : "default" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? "rgba(255,255,255,0.012)" : "transparent"}
              >
                <td style={{ ...truncCell, padding: "8px 6px", color: "#94a3b8" }} title={p.project}>
                  {p.project}
                </td>
                <td style={{ ...truncCell, padding: "8px 6px", color: "#cbd5e1" }} title={p.displaySymbol || p.symbol}>
                  {p.displaySymbol || p.symbol}
                  {p.poolMeta && p.poolMeta.startsWith("For buying PT") && (
                    <span style={{ marginLeft: 5, fontSize: 8, fontFamily: mono, color: "#a78bfa", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", padding: "1px 4px", borderRadius: 2, verticalAlign: "middle" }}>PT</span>
                  )}
                  {p.poolMeta && p.poolMeta.startsWith("For LP") && (
                    <span style={{ marginLeft: 5, fontSize: 8, fontFamily: mono, color: "#38bdf8", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)", padding: "1px 4px", borderRadius: 2, verticalAlign: "middle" }}>LP</span>
                  )}
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
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "16px 6px", color: "#6b7a8d", textAlign: "center", fontFamily: mono, fontSize: 12 }}>
                  No pools found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Numbered Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
          <button onClick={() => setPage(0)} disabled={page === 0} style={{ background: "none", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, padding: "3px 8px", fontSize: 10, fontFamily: mono, color: "#94a3b8", cursor: "pointer", opacity: page === 0 ? 0.3 : 1 }}>{"\u00AB"}</button>
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} style={{ background: "none", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, padding: "3px 8px", fontSize: 10, fontFamily: mono, color: "#94a3b8", cursor: "pointer", opacity: page === 0 ? 0.3 : 1 }}>{"\u2039"}</button>
          {(() => {
            const pages = [];
            let start = Math.max(0, page - 2);
            let end = Math.min(totalPages - 1, start + 4);
            start = Math.max(0, end - 4);
            if (start > 0) { pages.push(0); if (start > 1) pages.push("..."); }
            for (let i = start; i <= end; i++) pages.push(i);
            if (end < totalPages - 1) { if (end < totalPages - 2) pages.push("..."); pages.push(totalPages - 1); }
            return pages.map((p, idx) =>
              p === "..." ? (
                <span key={`dot-${idx}`} style={{ fontSize: 10, fontFamily: mono, color: "#4a5568", padding: "3px 2px" }}>{"\u2026"}</span>
              ) : (
                <button key={p} onClick={() => setPage(p)} style={{ background: p === page ? "rgba(34,211,238,0.15)" : "none", border: p === page ? "1px solid rgba(34,211,238,0.3)" : "1px solid rgba(255,255,255,0.06)", borderRadius: 3, padding: "3px 8px", fontSize: 10, fontFamily: mono, color: p === page ? "#22d3ee" : "#94a3b8", cursor: "pointer", fontWeight: p === page ? 600 : 400, minWidth: 28, textAlign: "center" }}>{p + 1}</button>
              )
            );
          })()}
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={{ background: "none", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, padding: "3px 8px", fontSize: 10, fontFamily: mono, color: "#94a3b8", cursor: "pointer", opacity: page >= totalPages - 1 ? 0.3 : 1 }}>{"\u203A"}</button>
          <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} style={{ background: "none", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, padding: "3px 8px", fontSize: 10, fontFamily: mono, color: "#94a3b8", cursor: "pointer", opacity: page >= totalPages - 1 ? 0.3 : 1 }}>{"\u00BB"}</button>
        </div>
      )}
    </div>
  );
}
