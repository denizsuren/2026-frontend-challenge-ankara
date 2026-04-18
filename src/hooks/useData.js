import { useState, useEffect } from "react";
import { fetchAllData } from "../api/jotform";
import { parseAll } from "../utils/parse";

export function useData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllData()
      .then((raw) => {
        setData(parseAll(raw));
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}