"use client";

/**
 * ConstellationField — an interactive 2D star canvas for section heros.
 * Dozens of twinkling stars drift slowly; stars near the cursor link up
 * into a glowing constellation that follows the pointer, and close star
 * pairs draw faint connecting lines of their own.
 *
 * Cheap by construction: one <canvas>, one rAF loop, ~70 particles.
 * The canvas itself is pointer-events-none (tracking happens on window)
 * so it never blocks clicks. Static single frame under
 * prefers-reduced-motion; skipped on low-core devices.
 */

import { useEffect, useRef } from "react";

const STAR_DENSITY = 1 / 16000; // stars per px² — scales with section size
const LINK_RADIUS = 150; // px: stars within this of the cursor connect
const PAIR_RADIUS = 90; // px: star pairs within this faintly connect

interface Star {
  x: number;
  y: number;
  r: number;
  phase: number; // twinkle offset
  vx: number;
  vy: number;
}

export default function ConstellationField({
  className = "",
}: {
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cores = navigator.hardwareConcurrency ?? 8;
    if (cores < 4) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    const mouse = { x: -9999, y: -9999 };
    let raf = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(90, Math.round(width * height * STAR_DENSITY));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.6 + Math.random() * 1.3,
        phase: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 6, // px/s drift
        vy: (Math.random() - 0.5) * 4,
      }));
    };

    const draw = (t: number, delta: number) => {
      ctx.clearRect(0, 0, width, height);

      // Faint pair links first, so stars render on top
      ctx.lineWidth = 1;
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x;
          const dy = stars[i].y - stars[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < PAIR_RADIUS * PAIR_RADIUS) {
            const a = (1 - Math.sqrt(d2) / PAIR_RADIUS) * 0.10;
            ctx.strokeStyle = `rgba(148, 163, 184, ${a})`;
            ctx.beginPath();
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.stroke();
          }
        }
      }

      // Cursor constellation: emerald threads to nearby stars
      for (const star of stars) {
        const dx = star.x - mouse.x;
        const dy = star.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK_RADIUS * LINK_RADIUS) {
          const a = (1 - Math.sqrt(d2) / LINK_RADIUS) * 0.5;
          ctx.strokeStyle = `rgba(16, 185, 129, ${a})`;
          ctx.beginPath();
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }

      // Stars, twinkling and drifting (wrap at the edges)
      for (const star of stars) {
        if (!reduced) {
          star.x += star.vx * delta;
          star.y += star.vy * delta;
          if (star.x < -5) star.x = width + 5;
          if (star.x > width + 5) star.x = -5;
          if (star.y < -5) star.y = height + 5;
          if (star.y > height + 5) star.y = -5;
        }
        const twinkle = 0.5 + 0.5 * Math.sin(t * 0.0016 + star.phase);
        ctx.fillStyle = `rgba(228, 228, 231, ${0.25 + twinkle * 0.6})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    let last = performance.now();
    const tick = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.1);
      last = now;
      draw(now, delta);
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerout", onLeave);

    if (reduced) {
      draw(performance.now(), 0); // single static frame
    } else {
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
