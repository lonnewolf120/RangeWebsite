/**
 * Infinite horizontal marquee of organizations that received training.
 *
 * PLACEHOLDER LOGOS: until real logo files are provided, each org renders
 * as a styled emblem chip. To use real logos, drop files into
 * /public/logos and swap the chip for <Image src={`/logos/${file}`} .../>.
 */

interface Org {
  name: string;
  short: string; // emblem initials shown in the placeholder crest
}

const ORGS: Org[] = [
  { name: "Bangladesh Army", short: "BA" },
  { name: "Bangladesh Navy", short: "BN" },
  { name: "Bangladesh Air Force", short: "BAF" },
  { name: "BGD e-GOV CIRT", short: "CIRT" },
  { name: "Grameenphone", short: "GP" },
  { name: "Dhaka Bank", short: "DB" },
  { name: "Robi Axiata", short: "RA" },
  { name: "MIST", short: "MIST" },
];

function LogoChip({ org }: { org: Org }) {
  return (
    <div className="flex shrink-0 items-center gap-3 rounded-lg border border-zinc-800/80 bg-zinc-950/60 px-6 py-4 opacity-60 grayscale transition duration-300 hover:border-emerald-500/40 hover:opacity-100 hover:grayscale-0">
      {/* Placeholder crest — replace with real logo image */}
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/5 font-mono text-[10px] font-bold tracking-wider text-emerald-400">
        {org.short}
      </div>
      <span className="whitespace-nowrap text-sm font-medium text-zinc-300">
        {org.name}
      </span>
    </div>
  );
}

export default function LogoMarquee() {
  return (
    <section aria-label="Organizations trained" className="marquee-group">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center font-mono text-xs uppercase tracking-[0.35em] text-zinc-600">
          Trusted by defence forces &amp; industry
        </p>
      </div>
      {/* Edge fade masks so logos emerge from / dissolve into black */}
      <div
        className="relative mt-8 overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
        }}
      >
        {/* Two copies of the list; CSS animates the track by -50% for a seamless loop */}
        <div className="animate-marquee flex w-max gap-6 pr-6">
          {[...ORGS, ...ORGS].map((org, i) => (
            <LogoChip key={`${org.short}-${i}`} org={org} />
          ))}
        </div>
      </div>
    </section>
  );
}
