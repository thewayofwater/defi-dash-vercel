import { useState, useEffect, useCallback } from "react";

const MORPHO_URL = "/api/morpho";

export function useMorphoData() {
  const [data, setData] = useState({ vaults: [], vaultsV2: [], markets: [], history: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback((isInitial = false) => {
    if (isInitial) setLoading(true);
    fetch(MORPHO_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        setData(json);
        setLastUpdated(new Date());
        setLoading(false);
        setError(null);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { ...data, loading, error, lastUpdated, refresh: () => fetchData(false) };
}
