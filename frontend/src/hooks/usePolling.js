import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for polling with exponential backoff on errors.
 *
 * If the callback throws or returns a rejected promise, the polling interval
 * doubles on each consecutive failure (capped at MAX_BACKOFF_MS) to avoid
 * hammering a struggling or rate-limiting backend. A successful call resets
 * the interval to the base value.
 *
 * @param {Function} callback - Async function to call periodically.
 * @param {number} interval - Base interval in milliseconds.
 * @param {boolean} [enabled=false] - Whether polling is active.
 * @param {Object} [options]
 * @param {Function} [options.onError] - Called when the callback throws.
 * @returns {{ isPolling: boolean, startPolling: Function, stopPolling: Function }}
 */
const MAX_BACKOFF_MS = 60_000; // 1 minute ceiling

export const usePolling = (callback, interval, enabled = false, options = {}) => {
  const [isPolling, setIsPolling] = useState(enabled);
  const savedCallback = useRef(callback);
  const savedOnError = useRef(options.onError);
  const timerRef = useRef(null);
  const errorCountRef = useRef(0);
  const currentIntervalRef = useRef(interval);

  // Keep refs fresh
  useEffect(() => { savedCallback.current = callback; }, [callback]);
  useEffect(() => { savedOnError.current = options.onError; }, [options.onError]);

  const startPolling = useCallback(() => setIsPolling(true), []);
  const stopPolling = useCallback(() => {
    setIsPolling(false);
    errorCountRef.current = 0;
    currentIntervalRef.current = interval;
  }, [interval]);

  useEffect(() => { setIsPolling(enabled); }, [enabled]);

  useEffect(() => {
    if (!isPolling) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    let cancelled = false;

    const schedule = () => {
      if (cancelled) return;
      timerRef.current = setTimeout(async () => {
        if (cancelled) return;
        try {
          await savedCallback.current();
          // Success: reset backoff
          errorCountRef.current = 0;
          currentIntervalRef.current = interval;
        } catch (err) {
          errorCountRef.current += 1;
          // Exponential backoff: base * 2^errorCount, capped
          currentIntervalRef.current = Math.min(
            interval * Math.pow(2, errorCountRef.current),
            MAX_BACKOFF_MS
          );
          if (savedOnError.current) savedOnError.current(err);
        }
        schedule();
      }, currentIntervalRef.current);
    };

    schedule();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPolling, interval]);

  return { isPolling, startPolling, stopPolling };
};

export default usePolling;
