"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts up from 0 to `value` over ~1.4s when it first scrolls into view.
 * Uses requestAnimationFrame with an ease-out curve; renders the final
 * value immediately under prefers-reduced-motion.
 */
export default function StatCounter({
  value,
  suffix = "",
  label,
}: {
  value: number;
  suffix?: string;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }

    let raf = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const DURATION = 1400;
        const tick = (now: number) => {
          const t = Math.min((now - start) / DURATION, 1);
          // ease-out cubic: fast start, gentle landing on the final value
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(Math.round(value * eased));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl font-bold tabular-nums tracking-tight text-zinc-100 md:text-5xl">
        {display}
        <span className="text-emerald-400">{suffix}</span>
      </p>
      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </p>
    </div>
  );
}
