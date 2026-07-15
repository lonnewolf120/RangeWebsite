"use client";

import dynamic from "next/dynamic";

/**
 * Next 15 only allows `ssr: false` dynamic imports inside Client Components,
 * so this thin wrapper exists to keep page.tsx a Server Component while the
 * WebGL scene stays client-only.
 */
const BlackHoleScene = dynamic(
  () => import("@/components/three/BlackHoleScene"),
  {
    ssr: false,
    loading: () => (
      // Matches the hero's 500vh scroll wrapper so layout doesn't shift
      <div className="h-[500vh] w-full bg-black">
        <div className="sticky top-0 flex h-screen w-full items-center justify-center">
          <p className="animate-pulse font-mono text-sm uppercase tracking-[0.35em] text-emerald-500">
            Initializing...
          </p>
        </div>
      </div>
    ),
  },
);

export default function HeroClient() {
  return <BlackHoleScene />;
}
