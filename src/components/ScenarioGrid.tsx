"use client";

import { useState } from "react";
import Reveal from "@/components/Reveal";

/**
 * Interactive scenario grid — the named live-fire scenarios staged in the
 * range, plus a closing "+N more" tile. Hovering (or focusing) a tile
 * lifts it and reveals a one-line summary.
 */
const TOTAL_SCENARIOS = 50;

const SCENARIOS: { title: string; blurb: string }[] = [
  { title: "SQL Injection", blurb: "Database extraction and auth bypass." },
  { title: "Local File Inclusion", blurb: "Reading server files through the app." },
  { title: "Remote Code Execution", blurb: "Full takeover of a live target." },
  { title: "DDoS", blurb: "Distributed floods and mitigation." },
  { title: "Cross-Site Scripting", blurb: "Stored, reflected and DOM XSS." },
  { title: "Directory Traversal", blurb: "Escaping the web root." },
  { title: "Ransomware", blurb: "Infection chain, containment, recovery." },
  { title: "Session ID Management", blurb: "Fixation, prediction and hijacking." },
  { title: "XPath Injection", blurb: "Querying past XML-backed auth." },
  { title: "HTML Injection", blurb: "Markup-level content manipulation." },
  { title: "SMTP Header Injection", blurb: "Abusing mail through input fields." },
  { title: "XXE Attacks", blurb: "XML external entity exfiltration." },
  { title: "MITM", blurb: "Interception on a live network segment." },
  { title: "DoS", blurb: "Single-source exhaustion and defence." },
];

export default function ScenarioGrid() {
  const [active, setActive] = useState<number | null>(null);
  const more = TOTAL_SCENARIOS - SCENARIOS.length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {SCENARIOS.map((s, i) => (
        <Reveal key={s.title} delay={(i % 5) * 60}>
          <button
            type="button"
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            className={`group relative h-full w-full overflow-hidden rounded-lg border p-4 text-left transition-all duration-300 ${
              active === i
                ? "-translate-y-1 border-emerald-500/60 bg-emerald-500/5"
                : "border-zinc-800 bg-zinc-950/60 hover:border-emerald-500/40"
            }`}
          >
            <span className="font-mono text-xs text-emerald-500/70">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-1.5 text-sm font-semibold leading-tight text-zinc-100">
              {s.title}
            </h3>
            {/* Blurb slides in on hover/focus using a grid-rows height trick */}
            <div
              className={`grid transition-[grid-template-rows] duration-300 ${
                active === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <span className="overflow-hidden text-xs leading-relaxed text-zinc-500">
                {s.blurb}
              </span>
            </div>
          </button>
        </Reveal>
      ))}

      {/* Closing tile: the rest of the library */}
      <Reveal delay={(SCENARIOS.length % 5) * 60}>
        <div className="flex h-full w-full flex-col items-start justify-center rounded-lg border border-dashed border-emerald-500/30 bg-emerald-500/[0.03] p-4">
          <span className="text-2xl font-bold tracking-tight text-emerald-400">
            +{more}
          </span>
          <span className="mt-1 text-xs leading-relaxed text-zinc-500">
            more scenarios in the range library
          </span>
        </div>
      </Reveal>
    </div>
  );
}
