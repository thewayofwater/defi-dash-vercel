import { useState, useEffect, useCallback } from "react";

const API_URL = "/api/twitter";

export function useTwitterFeed(asset) {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTweets = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_URL}?asset=${encodeURIComponent(asset)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setTweets(data.tweets || []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [asset]);

  useEffect(() => {
    fetchTweets();
  }, [fetchTweets]);

  return { tweets, loading, error, refresh: fetchTweets };
}
