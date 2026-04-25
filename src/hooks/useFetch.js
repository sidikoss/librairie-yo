import { useState, useEffect, useCallback, useRef } from "react";

const DEFAULT_TIMEOUT = 10000;
const DEFAULT_CACHE_TIME = 5 * 60 * 1000;

function createFetchState() {
  return {
    data: null,
    loading: true,
    error: null,
    lastFetch: null,
  };
}

export function useFetch(fetchFn, deps = [], options = {}) {
  const { timeout = DEFAULT_TIMEOUT, immediate = true, cacheMs = 0 } = options;
  
  const cacheRef = useRef({});
  const abortRef = useRef(null);
  
  const [state, setState] = useState(createFetchState);

  const fetch = useCallback(async (force = false) => {
    const cacheKey = deps.join("-");
    const now = Date.now();
    
    if (!force && cacheMs > 0 && cacheRef.current[cacheKey]) {
      const cached = cacheRef.current[cacheKey];
      if (now - cached.timestamp < cacheMs) {
        setState({
          data: cached.data,
          loading: false,
          error: null,
          lastFetch: cached.timestamp,
        });
        return;
      }
    }
    
    if (abortRef.current) {
      abortRef.current.abort();
    }
    
    abortRef.current = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: null }));
    
    try {
      const timeoutId = setTimeout(() => abortRef.current.abort(), timeout);
      
      const data = await fetchFn();
      
      clearTimeout(timeoutId);
      
      if (cacheMs > 0) {
        cacheRef.current[cacheKey] = { data, timestamp: now };
      }
      
      setState({
        data,
        loading: false,
        error: null,
        lastFetch: now,
      });
    } catch (err) {
      if (err.name !== "AbortError") {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err.message || "Erreur de chargement",
        }));
      }
    }
  }, [fetchFn, timeout, cacheMs, ...deps]);

  useEffect(() => {
    if (immediate) {
      fetch();
    }
    
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  return { ...state, refetch: fetch };
}

export function useMutation(mutationFn, options = {}) {
  const { timeout = DEFAULT_TIMEOUT, onSuccess, onError } = options;
  
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(async (payload) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    
    try {
      const timeoutId = setTimeout(() => {
        throw new Error("Délai d'attente dépassé");
      }, timeout);
      
      const data = await mutationFn(payload);
      
      clearTimeout(timeoutId);
      
      setState({ data, loading: false, error: null });
      
      if (onSuccess) {
        onSuccess(data);
      }
      
      return data;
    } catch (err) {
      const error = err.message || "Erreur";
      setState((prev) => ({ ...prev, loading: false, error }));
      
      if (onError) {
        onError(error);
      }
      
      throw err;
    }
  }, [mutationFn, timeout, onSuccess, onError]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, mutate, reset };
}

export function usePolling(fetchFn, options = {}) {
  const { interval = 30000, immediate = true } = options;
  
  const [state, setState] = useState(createFetchState);
  const intervalRef = useRef(null);
  
  const fetch = useCallback(async () => {
    try {
      const data = await fetchFn();
      setState({
        data,
        loading: false,
        error: null,
        lastFetch: Date.now(),
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err.message,
      }));
    }
  }, [fetchFn]);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    
    if (immediate) fetch();
    
    intervalRef.current = setInterval(fetch, interval);
  }, [fetch, interval, immediate]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  return { ...state, start, stop };
}

export function useCachedFetch(fetchFn, deps = [], options = {}) {
  return useFetch(fetchFn, deps, { ...options, cacheMs: options.cacheMs || DEFAULT_CACHE_TIME });
}