"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// Home-relative hrefs so the links work from /courses and other routes too.
const LINKS = [
  { href: "/courses", label: "Courses" },
  { href: "/#track-record", label: "Track Record" },
  { href: "/#testimonials", label: "Testimonials" },
  { href: "/#contact", label: "Contact" },
];

/**
 * Fixed top navigation. Transparent over the hero, gains a blurred
 * backdrop once the user scrolls past the first viewport.
 */
export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      // Page scroll progress bar — written straight to the DOM so
      // scrolling never triggers React re-renders for it.
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (barRef.current && max > 0) {
        barRef.current.style.transform = `scaleX(${window.scrollY / max})`;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-emerald-500/10 bg-black/60 shadow-[0_8px_40px_-16px_rgba(0,0,0,0.9)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      {/* Thin scroll-progress indicator along the top edge */}
      <div
        ref={barRef}
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px] origin-left bg-gradient-to-r from-emerald-500 to-cyan-400"
        style={{ transform: "scaleX(0)" }}
      />
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-mono text-sm font-bold tracking-[0.25em] text-zinc-100"
        >
          CYBER<span className="text-emerald-400">RANGE</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative text-sm text-zinc-400 transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-gradient-to-r after:from-emerald-400 after:to-cyan-400 after:transition-all after:duration-300 hover:text-emerald-400 hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/#contact"
          className="rounded-lg border border-emerald-500/50 px-4 py-2 text-sm font-semibold text-emerald-400 shadow-[0_0_20px_-8px_rgba(16,185,129,0.5)] transition-all hover:bg-emerald-500/10 hover:shadow-[0_0_28px_-8px_rgba(16,185,129,0.7)]"
        >
          Enroll
        </Link>
      </div>
    </header>
  );
}
