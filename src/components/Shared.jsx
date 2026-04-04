import React from "react";
import { TRACKED_CATEGORIES, CATEGORY_COLORS } from "../utils/constants";

const mono = "'JetBrains Mono', monospace";
const sans = "'DM Sans', sans-serif";

export function StatCard({ label, value, sub, color, trend }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: 7,
        padding: "13px 16px",
        flex: 1,
        minWidth: 130,
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          color: "#5a6678",
          textTransform: "uppercase",
          letterSpacing: 1.3,
          marginBottom: 4,
          fontFamily: mono,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: color || "#e2e8f0",
          fontFamily: mono,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 10.5,
            color:
              trend === "up"
                ? "#34d399"
                : trend === "down"
                ? "#f87171"
                : "#506070",
            marginTop: 3,
            fontFamily: mono,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

export function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <h2
        style={{
          fontSize: 14.5,
          fontWeight: 600,
          color: "#e2e8f0",
          margin: 0,
          fontFamily: sans,
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <div
          style={{
            fontSize: 10.5,
            color: "#3f4e5f",
            marginTop: 2,
            fontFamily: mono,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}

export function LoadingSpinner({ message }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 200,
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          border: "2px solid rgba(255,255,255,0.06)",
          borderTopColor: "#22d3ee",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      <div style={{ color: "#3f4e5f", fontSize: 10, fontFamily: mono }}>
        {message || "Loading..."}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function CategoryLegend() {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 14,
        justifyContent: "center",
        marginTop: 10,
      }}
    >
      {TRACKED_CATEGORIES.map((cat) => (
        <div
          key={cat}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 9.5,
            color: "#6b7a8d",
            fontFamily: mono,
          }}
        >
          <div
            style={{
              width: 10,
              height: 2.5,
              background: CATEGORY_COLORS[cat],
              borderRadius: 1,
            }}
          />
          {cat}
        </div>
      ))}
    </div>
  );
}

export function ModuleCard({ children }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.012)",
        border: "1px solid rgba(255,255,255,0.035)",
        borderRadius: 7,
        padding: 20,
      }}
    >
      {children}
    </div>
  );
}

export const tooltipStyle = {
  background: "#131926",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 5,
  fontSize: 10,
  fontFamily: mono,
  color: "#e2e8f0",
};
