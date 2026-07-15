"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import Reveal from "@/components/Reveal";

// Globe is client-only and heavy — load it on demand, never on the server.
const ThreatGlobe = dynamic(() => import("@/components/three/ThreatGlobe"), {
  ssr: false,
});

const FEED = [
  { tag: "RECON", text: "Port sweep detected · 10.0.4.12 → target-web-01" },
  { tag: "EXPLOIT", text: "SQLi payload blocked at WAF · /login" },
  { tag: "C2", text: "Beacon isolated · quarantined in range VLAN" },
  { tag: "PRIV-ESC", text: "Kerberoast attempt flagged · dc-01" },
  { tag: "DEFENSE", text: "Blue team patched CVE in 3m 42s" },
];

const TAG_COLOR: Record<string, string> = {
  RECON: "text-cyan-400",
  EXPLOIT: "text-amber-400",
  C2: "text-red-400",
  "PRIV-ESC": "text-fuchsia-400",
  DEFENSE: "text-emerald-400",
};

export default function ThreatMapSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [lowPower, setLowPower] = useState(false);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    setLowPower((navigator.hardwareConcurrency ?? 8) < 4);
  }, []);

  // Mount the globe only when the section approaches the viewport, and
  // track how far it has scrolled through (for the globe's tilt).
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => setMounted(entry.isIntersecting),
      { rootMargin: "200px" },
    );
    io.observe(el);

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const total = rect.height + window.innerHeight;
      progressRef.current = Math.min(
        Math.max((window.innerHeight - rect.top) / total, 0),
        1,
      );
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="live-range"
      className="relative overflow-hidden hairline-t"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 lg:grid-cols-2">
        {/* Left: copy + live feed terminal */}
        <div>
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-emerald-500">
              The live range
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-100 md:text-4xl">
              Attack and defend in real time.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-zinc-400">
              Red and blue teams operate on the same isolated network — every
              exploit, every block, every escalation happening live. This is a
              sample of the telemetry a cohort works against.
            </p>
          </Reveal>

          <Reveal delay={150}>
            <div className="mt-8 overflow-hidden rounded-xl border border-zinc-800 bg-black/70 font-mono text-xs backdrop-blur">
              <div className="flex items-center gap-1.5 border-b border-zinc-800 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                <span className="ml-3 text-[10px] tracking-wider text-zinc-500">
                  range-monitor — live feed
                </span>
              </div>
              <ul className="space-y-1.5 p-4">
                {FEED.map((line) => (
                  <li key={line.text} className="flex gap-3">
                    <span
                      className={`shrink-0 font-semibold ${TAG_COLOR[line.tag]}`}
                    >
                      [{line.tag}]
                    </span>
                    <span className="text-zinc-400">{line.text}</span>
                  </li>
                ))}
                <li className="flex gap-2 text-emerald-400">
                  <span>›</span>
                  <span className="inline-block h-3.5 w-2 animate-pulse bg-emerald-400/80" />
                </li>
              </ul>
            </div>
          </Reveal>
        </div>

        {/* Right: 3D threat globe */}
        <div className="relative aspect-square w-full cursor-crosshair">
          {/* Soft glow behind the globe */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-0"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(16,185,129,0.12), transparent 62%)",
            }}
          />
          {mounted && !lowPower ? (
            <ThreatGlobe
              progressRef={progressRef}
              reducedMotion={reducedMotion}
            />
          ) : (
            // Low-power fallback: a simple pulsing ring emblem
            <div className="flex h-full items-center justify-center">
              <div className="h-40 w-40 animate-pulse rounded-full border border-emerald-500/40 bg-emerald-500/5" />
            </div>
          )}
          {!lowPower && (
            <p className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-600">
              drag to rotate · hover to target
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
