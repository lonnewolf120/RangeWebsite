"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A simulated red-vs-blue exercise that types itself out when scrolled
 * into view, then loops. Pure DOM/text — no canvas, negligible cost.
 * Under prefers-reduced-motion the full transcript renders statically.
 */

interface Line {
  text: string;
  tone: "cmd" | "out" | "ok" | "alert" | "defense";
}

const SCRIPT: Line[] = [
  { text: "trainee@range:~$ nmap -sV 10.0.40.12", tone: "cmd" },
  { text: "22/tcp  open  ssh     OpenSSH 8.9p1", tone: "out" },
  { text: "80/tcp  open  http    Apache httpd 2.4.52", tone: "out" },
  { text: "trainee@range:~$ gobuster dir -u http://10.0.40.12", tone: "cmd" },
  { text: "/admin  (Status: 301)   /backup  (Status: 200)", tone: "out" },
  { text: "trainee@range:~$ python3 exploit.py --target 10.0.40.12", tone: "cmd" },
  { text: "[+] Payload delivered — shell as www-data", tone: "ok" },
  { text: "[BLUE] IDS alert: reverse shell signature on vlan-40", tone: "alert" },
  { text: "[BLUE] Host isolated · session terminated in 41s", tone: "defense" },
  { text: "trainee@range:~$ _", tone: "cmd" },
];

const TONE_CLASS: Record<Line["tone"], string> = {
  cmd: "text-zinc-200",
  out: "text-zinc-500",
  ok: "text-emerald-400",
  alert: "text-red-400",
  defense: "text-cyan-400",
};

const CHAR_DELAY = 18; // ms per character while "typing"
const LINE_PAUSE = 420; // ms between lines
const LOOP_PAUSE = 4200; // ms before the transcript restarts

export default function RangeTerminal() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [started, setStarted] = useState(false);
  // Progress through the script: full lines done + chars of current line
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  // Begin typing when the terminal first scrolls into view
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStarted(true);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!started || reducedMotion) return;

    const line = SCRIPT[lineIdx];
    let timer: ReturnType<typeof setTimeout>;

    if (charIdx < line.text.length) {
      timer = setTimeout(() => setCharIdx((c) => c + 1), CHAR_DELAY);
    } else if (lineIdx < SCRIPT.length - 1) {
      timer = setTimeout(() => {
        setLineIdx((l) => l + 1);
        setCharIdx(0);
      }, LINE_PAUSE);
    } else {
      timer = setTimeout(() => {
        setLineIdx(0);
        setCharIdx(0);
      }, LOOP_PAUSE);
    }
    return () => clearTimeout(timer);
  }, [started, reducedMotion, lineIdx, charIdx]);

  const visible = reducedMotion
    ? SCRIPT
    : SCRIPT.slice(0, lineIdx).concat({
        ...SCRIPT[lineIdx],
        text: SCRIPT[lineIdx].text.slice(0, charIdx),
      });

  return (
    <div
      ref={rootRef}
      className="overflow-hidden rounded-xl border border-zinc-800 bg-black/70 font-mono text-xs backdrop-blur"
    >
      <div className="flex items-center gap-1.5 border-b border-zinc-800 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
        <span className="ml-3 text-[10px] tracking-wider text-zinc-500">
          range-exercise — red vs blue
        </span>
      </div>
      <div className="min-h-[15rem] space-y-1.5 p-4">
        {visible.map((line, i) => (
          <p key={i} className={TONE_CLASS[line.tone]}>
            {line.text}
            {!reducedMotion && i === visible.length - 1 && (
              <span className="ml-0.5 inline-block h-3.5 w-2 animate-pulse bg-emerald-400/80 align-middle" />
            )}
          </p>
        ))}
      </div>
    </div>
  );
}
