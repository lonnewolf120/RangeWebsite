"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Certificate evaluation criteria (real figures from the CEH program):
 * bars sweep to their percentage when scrolled into view.
 */
const CRITERIA = [
  { label: "MCQ Exam", pct: 15 },
  { label: "Lab Exam", pct: 25 },
  { label: "Cyber Range Exam", pct: 60 },
];

export default function CriteriaBars() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActive(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="space-y-6">
      {CRITERIA.map((item, i) => (
        <div key={item.label}>
          <div className="mb-2 flex items-baseline justify-between">
            <p className="text-sm font-medium text-zinc-300">{item.label}</p>
            <p className="font-mono text-sm text-emerald-400">{item.pct}%</p>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-900">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-[width] duration-1000 ease-out"
              style={{
                width: active ? `${item.pct}%` : "0%",
                transitionDelay: `${i * 150}ms`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
