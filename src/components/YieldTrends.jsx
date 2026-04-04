import React from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { TRACKED_CATEGORIES, CATEGORY_COLORS } from "../utils/constants";
import { fmtDate } from "../utils/format";
import { LoadingSpinner, CategoryLegend, tooltipStyle } from "./Shared";

export default function YieldTrends({ historyData, loading }) {
  if (loading) return <LoadingSpinner message="Fetching historical yield data..." />;
  if (!historyData?.length) return <div style={{ color: "#3f4e5f", padding: 20, fontSize: 11 }}>No historical data available yet</div>;

  return (
    <div>
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={historyData} margin={{ top: 5, right: 15, bottom: 5, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.035)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: "#3f4e5f", fontFamily: "'JetBrains Mono'" }}
              tickFormatter={fmtDate}
              stroke="rgba(255,255,255,0.05)"
            />
            <YAxis
              tick={{ fontSize: 9, fill: "#3f4e5f", fontFamily: "'JetBrains Mono'" }}
              tickFormatter={(v) => `${v.toFixed(0)}%`}
              stroke="rgba(255,255,255,0.05)"
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(d) => new Date(d).toLocaleDateString()}
              formatter={(v) => [`${v.toFixed(2)}%`]}
            />
            {TRACKED_CATEGORIES.map((cat) => (
              <Line
                key={cat}
                type="monotone"
                dataKey={cat}
                stroke={CATEGORY_COLORS[cat]}
                strokeWidth={1.8}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <CategoryLegend />
    </div>
  );
}
