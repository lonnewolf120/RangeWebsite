"use client";

import { useRef, type ReactNode } from "react";

const MAX_TILT_DEG = 7;

/**
 * 3D perspective tilt that follows the cursor, with a subtle emerald
 * glow tracking the pointer. Transform is written directly to the DOM
 * (no React state) so hover tracking never triggers re-renders.
 * Under prefers-reduced-motion the card stays flat.
 */
export default function TiltCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = el.getBoundingClientRect();
    // Cursor position inside the card, remapped to -1..1 from the center
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;

    // Tilt toward the cursor: horizontal position rotates around Y,
    // vertical position rotates around X (inverted so the card "faces" you)
    el.style.transform = `perspective(800px) rotateY(${nx * MAX_TILT_DEG}deg) rotateX(${-ny * MAX_TILT_DEG}deg) translateZ(0)`;
    el.style.setProperty("--glow-x", `${((nx + 1) / 2) * 100}%`);
    el.style.setProperty("--glow-y", `${((ny + 1) / 2) * 100}%`);
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform =
      "perspective(800px) rotateY(0deg) rotateX(0deg) translateZ(0)";
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`relative transition-[transform,box-shadow] duration-200 ease-out hover:shadow-[0_0_36px_-14px_rgba(16,185,129,0.35)] ${className}`}
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      {/* Pointer-tracking glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(220px circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(16,185,129,0.12), transparent 70%)",
        }}
      />
      {children}
    </div>
  );
}
