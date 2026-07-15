"use client";

/**
 * ScrollLight — two enormous, heavily-blurred light glows fixed over the
 * whole page, blended with `screen` so they read as distant light falling
 * on the content. As you scroll, each light travels a slow diagonal path
 * (one emerald drifting right-and-down, one cyan counter-drifting), so
 * different sections of the page catch the light at different times.
 *
 * Pure CSS + one rAF-damped scroll listener writing transforms — no canvas,
 * no layout work, GPU-composited. Hidden under prefers-reduced-motion and
 * on low-core devices.
 */

import { useEffect, useRef, useState } from "react";

export default function ScrollLight() {
  const [enabled, setEnabled] = useState(false);
  const lightA = useRef<HTMLDivElement>(null);
  const lightB = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cores = navigator.hardwareConcurrency ?? 8;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (cores < 4 || reduced) return;
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let raf = 0;
    let progress = 0; // damped scroll progress 0..1
    let last = performance.now();

    const tick = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.1);
      last = now;

      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const raw = max > 0 ? window.scrollY / max : 0;
      // Exponential damping — the light glides after the scroll stops
      progress += (raw - progress) * (1 - Math.exp(-2.2 * delta));

      const w = window.innerWidth;
      const h = window.innerHeight;
      const p = progress;

      // Light A (emerald): sweeps a long sine path down-right and back
      if (lightA.current) {
        const x = w * (0.15 + 0.7 * (0.5 + 0.5 * Math.sin(p * Math.PI * 3)));
        const y = h * (0.1 + 0.8 * (0.5 - 0.5 * Math.cos(p * Math.PI * 2)));
        lightA.current.style.transform = `translate3d(${(x - w * 0.5).toFixed(1)}px, ${(y - h * 0.5).toFixed(1)}px, 0)`;
      }
      // Light B (cyan): counter-phase, slower, wider
      if (lightB.current) {
        const x = w * (0.85 - 0.7 * (0.5 + 0.5 * Math.sin(p * Math.PI * 2 + 1.2)));
        const y = h * (0.9 - 0.75 * (0.5 - 0.5 * Math.cos(p * Math.PI * 2.6)));
        lightB.current.style.transform = `translate3d(${(x - w * 0.5).toFixed(1)}px, ${(y - h * 0.5).toFixed(1)}px, 0)`;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden mix-blend-screen"
    >
      {/* Each glow is centered in the viewport and moved by transform */}
      <div
        ref={lightA}
        className="absolute left-1/2 top-1/2 h-[85vmin] w-[85vmin] -translate-x-1/2 -translate-y-1/2 rounded-full will-change-transform"
        style={{
          background:
            "radial-gradient(circle, rgba(16,185,129,0.10) 0%, rgba(16,185,129,0.035) 40%, transparent 70%)",
        }}
      />
      <div
        ref={lightB}
        className="absolute left-1/2 top-1/2 h-[110vmin] w-[110vmin] -translate-x-1/2 -translate-y-1/2 rounded-full will-change-transform"
        style={{
          background:
            "radial-gradient(circle, rgba(34,211,238,0.07) 0%, rgba(34,211,238,0.025) 40%, transparent 70%)",
        }}
      />
    </div>
  );
}
