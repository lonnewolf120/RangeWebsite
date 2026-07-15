import Reveal from "@/components/Reveal";
import TiltCard from "@/components/TiltCard";

/**
 * PLACEHOLDER testimonials — replace quotes/names with real endorsements
 * when collected. Photos can be added as /public/testimonials/*.jpg.
 */
interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "The range environment is the closest thing to a live incident I've seen in a training context. Our analysts came back sharper — measurably so.",
    name: "Mohammad Shahadat Hossain",
    role: "Principal Security Architect, Grameenphone",
  },
  {
    quote:
      "Most courses teach tools. This one builds operators. The attack–defense simulation in the final week separates it from anything else available in the country.",
    name: "Md. Bahauddin Palash",
    role: "CISSP · C|CISO · ISO 27001 LA · CEH · RHCE",
  },
  {
    quote:
      "We sent an entire SOC team through the program. The internet-isolated lab meant they could break things properly — and learn to fix them under pressure.",
    name: "Placeholder Name",
    role: "CISO, Leading Commercial Bank",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="border-t border-zinc-900">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-emerald-500">
            Vouched for
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-zinc-100 md:text-4xl">
            Industry experts on the range.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 120}>
              <TiltCard className="group h-full rounded-xl border border-zinc-800 bg-zinc-950 p-6">
                <p className="font-mono text-3xl leading-none text-emerald-500/60">
                  &ldquo;
                </p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                  {t.quote}
                </p>
                <div className="mt-6 border-t border-zinc-800/80 pt-4">
                  <p className="text-sm font-semibold text-zinc-100">
                    {t.name}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">{t.role}</p>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
