export function fmt(n, decimals = 1) {
  if (n == null || isNaN(n)) return "\u2014";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(decimals)}B`;
  if (abs >= 1e6) return `${sign}$${Math.round(abs / 1e6)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(decimals)}K`;
  return `${sign}$${abs.toFixed(decimals)}`;
}

export function fmtPct(n, decimals = 2) {
  if (n == null || isNaN(n)) return "\u2014";
  return `${n.toFixed(decimals)}%`;
}


export function fmtDate(d) {
  const dt = new Date(d);
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
}
