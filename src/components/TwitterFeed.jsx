import React from "react";

const mono = "'JetBrains Mono', monospace";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function formatCount(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function TwitterFeed({ tweets, loading, error }) {
  if (loading) {
    return (
      <div style={{ fontSize: 10, color: "#3f4e5f", fontFamily: mono, padding: 12 }}>
        Loading tweets...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ fontSize: 10, color: "#f87171", fontFamily: mono, padding: 12 }}>
        {error}
      </div>
    );
  }

  if (!tweets || !tweets.length) {
    return (
      <div style={{ fontSize: 10, color: "#3f4e5f", fontFamily: mono, padding: 12 }}>
        No recent tweets found
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {tweets.map((t) => (
        <a
          key={t.id}
          href={`https://x.com/${t.author.username}/status/${t.id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            padding: "10px 14px",
            background: "rgba(255,255,255,0.015)",
            borderBottom: "1px solid rgba(255,255,255,0.03)",
            textDecoration: "none",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#a0aec0", fontFamily: mono }}>
                {t.author.name}
              </span>
              <span style={{ fontSize: 9, color: "#3f4e5f", fontFamily: mono }}>
                @{t.author.username}
              </span>
              {t.author.followers >= 1000 && (
                <span style={{
                  fontSize: 8,
                  color: "#22d3ee",
                  fontFamily: mono,
                  background: "rgba(34,211,238,0.08)",
                  padding: "1px 5px",
                  borderRadius: 3,
                }}>
                  {formatCount(t.author.followers)}
                </span>
              )}
            </div>
            <span style={{ fontSize: 8.5, color: "#2d3a4a", fontFamily: mono }}>
              {timeAgo(t.createdAt)}
            </span>
          </div>
          <div style={{
            fontSize: 10,
            color: "#6b7a8d",
            lineHeight: 1.5,
            fontFamily: mono,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}>
            {t.text}
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
            <span style={{ fontSize: 8.5, color: "#2d3a4a", fontFamily: mono }}>
              {t.metrics?.like_count || 0} likes
            </span>
            <span style={{ fontSize: 8.5, color: "#2d3a4a", fontFamily: mono }}>
              {t.metrics?.retweet_count || 0} rt
            </span>
            <span style={{ fontSize: 8.5, color: "#2d3a4a", fontFamily: mono }}>
              {t.metrics?.reply_count || 0} replies
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}
