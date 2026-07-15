"use client";

import { useState } from "react";
import Reveal from "@/components/Reveal";

/**
 * Interactive curriculum grid — the 20 CEH module areas. Hovering (or
 * focusing) a tile lifts it and reveals a one-line summary. Purely a
 * visual/interaction layer; content is the real CEH module coverage.
 */
const MODULES: { n: string; title: string; blurb: string }[] = [
  { n: "01", title: "Intro to Ethical Hacking", blurb: "Methodology, phases, legality." },
  { n: "02", title: "Footprinting & Recon", blurb: "OSINT, DNS, passive discovery." },
  { n: "03", title: "Scanning Networks", blurb: "Host, port and service mapping." },
  { n: "04", title: "Enumeration", blurb: "Users, shares, services, banners." },
  { n: "05", title: "Vulnerability Analysis", blurb: "Assessment and prioritisation." },
  { n: "06", title: "System Hacking", blurb: "Access, escalation, persistence." },
  { n: "07", title: "Malware Threats", blurb: "Trojans, worms, behaviour analysis." },
  { n: "08", title: "Sniffing", blurb: "Traffic capture and interception." },
  { n: "09", title: "Social Engineering", blurb: "Human-layer attack vectors." },
  { n: "10", title: "Denial of Service", blurb: "DoS / DDoS techniques & defence." },
  { n: "11", title: "Session Hijacking", blurb: "Token theft, MITM, replay." },
  { n: "12", title: "IDS, Firewall & Honeypot", blurb: "Evasion and detection." },
  { n: "13", title: "Hacking Web Servers", blurb: "Server-side attack surface." },
  { n: "14", title: "Web App Hacking", blurb: "OWASP-class vulnerabilities." },
  { n: "15", title: "SQL Injection", blurb: "Extraction and takeover." },
  { n: "16", title: "Wireless Hacking", blurb: "Wi-Fi attacks and defence." },
  { n: "17", title: "Mobile Hacking", blurb: "Android/iOS attack surface." },
  { n: "18", title: "IoT & OT Hacking", blurb: "Embedded and OT security." },
  { n: "19", title: "Cloud Computing", blurb: "Cloud workload attacks." },
  { n: "20", title: "Cryptography", blurb: "Ciphers, PKI, controls, reporting." },
];

export default function CurriculumGrid() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {MODULES.map((m, i) => (
        <Reveal key={m.n} delay={(i % 4) * 60}>
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
            <span className="font-mono text-xs text-emerald-500/70">{m.n}</span>
            <h3 className="mt-1.5 text-sm font-semibold leading-tight text-zinc-100">
              {m.title}
            </h3>
            {/* Blurb slides in on hover/focus using a grid-rows height trick */}
            <div
              className={`grid transition-[grid-template-rows] duration-300 ${
                active === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <span className="overflow-hidden text-xs leading-relaxed text-zinc-500">
                {m.blurb}
              </span>
            </div>
          </button>
        </Reveal>
      ))}
    </div>
  );
}
