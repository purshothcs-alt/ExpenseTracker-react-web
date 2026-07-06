import { useEffect, useRef, useState } from 'react';
import { useAppSettings } from '@core/hooks/useAppSettings';
import { parseCurrency } from '@core/utils/currency';

const DURATION = 700;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Animates a stat value by counting up (or down) from its previous value.
 * Numbers count directly; currency-formatted strings (e.g. "₹1,250.00") are
 * parsed, animated as numbers, and re-formatted each frame. Anything else
 * (placeholders like "—", non-numeric text) passes through unanimated.
 */
export function useAnimatedValue(value: string | number): string | number {
  const { settings, formatCurrency } = useAppSettings();
  const [display, setDisplay] = useState(value);
  const prevTargetRef = useRef<number | null>(null);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    let target: number | null = null;
    let isCurrencyString = false;

    if (typeof value === 'number') {
      target = value;
    } else if (typeof value === 'string' && /\d/.test(value)) {
      const parsed = parseCurrency(value, settings);
      if (Number.isFinite(parsed)) {
        target = parsed;
        isCurrencyString = true;
      }
    }

    if (target === null) {
      setDisplay(value);
      prevTargetRef.current = null;
      return;
    }

    const start = prevTargetRef.current ?? 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - startTime) / DURATION, 1);
      const current = start + (target! - start) * easeOutCubic(t);
      setDisplay(isCurrencyString ? formatCurrency(current) : Math.round(current));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prevTargetRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return display;
}
