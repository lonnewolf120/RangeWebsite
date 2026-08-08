import Link from "next/link";

import CriteriaBars from "@/components/CriteriaBars";
import Faq from "@/components/Faq";
import HeroClient from "@/components/HeroClient";
import LogoMarquee from "@/components/LogoMarquee";
import Reveal from "@/components/Reveal";
import ScenarioGrid from "@/components/ScenarioGrid";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import StatCounter from "@/components/StatCounter";
import Testimonials from "@/components/Testimonials";
import ThreatMapSection from "@/components/ThreatMapSection";
import TiltCard from "@/components/TiltCard";
import { getCoursesByStatus } from "@/lib/courses/api";

// Renders per-request against the live backend (still cached via the
// fetch-level revalidate in api.ts) rather than being prerendered at
// build time — the backend isn't reachable during `docker build`.
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* Content data (placeholder entries marked — replace with real data)  */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    title: "Live-Fire Labs",
    description:
      "Attack and defend real infrastructure on an internet-isolated range network — not simulations, not slideshows.",
  },
  {
    title: "Industry Certifications",
    description:
      "Structured tracks toward CEH, OSCP and internal range certifications, with MCQ, lab and range exams.",
  },
  {
    title: "Expert Instructors",
    description:
      "Learn from working security architects and certified practitioners (CISSP, C|CISO, ISO 27001 LA, CEH, RHCE).",
  },
  {
    title: "Complimentary Range Access",
    description:
      "Flagship cohorts like CEH include additional hours of Cyber Range access for hands-on practice beyond class time.",
  },
];

/** PLACEHOLDER past cohorts — swap in the real list when provided. */
const PAST_COURSES = [
  {
    name: "CEH v12 — Certified Ethical Hacker",
    period: "Dec 2025 – Jan 2026",
    detail:
      "12-day / 96-hour cohort. 20 modules, attack–defense simulation, internal certification evaluation.",
  },
  {
    name: "SOC Analyst Foundation",
    period: "Sep 2025",
    detail:
      "Blue-team fundamentals: log analysis, SIEM operations, incident triage on live range telemetry.",
  },
  {
    name: "Web Application Penetration Testing",
    period: "Jun 2025",
    detail:
      "OWASP Top 10 deep-dive with full-scope engagements against production-grade web targets.",
  },
  {
    name: "Network Defense Essentials",
    period: "Mar 2025",
    detail:
      "Perimeter hardening, IDS/IPS tuning and firewall evasion countermeasures for enterprise teams.",
  },
];

const PROCESS = [
  {
    step: "01",
    title: "Assess",
    description:
      "Flagship cohorts open with an aptitude test that benchmarks the group, so the program is tuned to the trainees' level — nobody sits through material they already know.",
  },
  {
    step: "02",
    title: "Train",
    description:
      "Full-day sessions alternating lectures and supervised labs on the isolated range network. Attack, defend, break, rebuild.",
  },
  {
    step: "03",
    title: "Certify",
    description:
      "MCQ, lab and range exams under real pressure. Pass, and walk out with a certificate backed by demonstrated hands-on skill.",
  },
];

/** Named instructors are real; cohorts are led by ~5 lead instructors. */
const INSTRUCTORS = [
  {
    name: "Mohammad Shahadat Hossain",
    role: "Instructor",
    credentials: "Principal Security Architect, Grameenphone Limited",
  },
  {
    name: "Md. Bahauddin Palash",
    role: "Instructor",
    credentials: "CISSP · C|CISO · ISO 27001 LA · CEH · RHCE · ISTQB · PRINCEII",
  },
];

const STATS = [
  { value: 500, suffix: "+", label: "Professionals trained" },
  { value: 96, suffix: "h", label: "Hands-on hours · CEH flagship" },
  { value: 12, suffix: "+", label: "Cohorts completed" },
  { value: 8, suffix: "", label: "Partner organizations" },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default async function Home() {
  // Upcoming cohorts come from the shared course data layer — same
  // source as the /courses pages.
  const upcomingCourses = await getCoursesByStatus("upcoming");

  return (
    // No solid background on <main> — the fixed 3D starfield (rendered
    // globally in layout.tsx) stays visible through translucent sections.
    <main id="top" className="text-zinc-200">
      <SiteHeader />

      {/* Scroll-driven 3D black hole hero (client-only) */}
      <HeroClient />

      {/* Social proof marquee */}
      <div className="py-16">
        <LogoMarquee />
      </div>

      {/* Stats band */}
      <section className="hairline-t relative overflow-hidden bg-zinc-950/40">
        {/* Soft emerald bloom rising from below the numbers */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(700px circle at 50% 130%, rgba(16,185,129,0.08), transparent 60%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl grid-cols-2 gap-10 px-6 py-16 md:grid-cols-4">
          {STATS.map((stat) => (
            <StatCounter key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-emerald-500">
            The process
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-zinc-100 md:text-4xl">
            Assess. Train. Certify.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PROCESS.map((phase, i) => (
            <Reveal key={phase.step} delay={i * 120}>
              <div className="group relative h-full rounded-xl border border-zinc-800 bg-zinc-950 p-6 transition-colors hover:border-emerald-500/40">
                <p className="font-mono text-4xl font-bold text-zinc-800 transition-colors group-hover:text-emerald-500/40">
                  {phase.step}
                </p>
                <h3 className="mt-4 text-lg font-semibold text-zinc-100">
                  {phase.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {phase.description}
                </p>
                {/* Connector arrow between steps on desktop */}
                {i < PROCESS.length - 1 && (
                  <span className="absolute -right-5 top-1/2 hidden -translate-y-1/2 font-mono text-zinc-700 md:block">
                    →
                  </span>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Why train here */}
      <section className="mx-auto max-w-6xl hairline-t px-6 py-24">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-emerald-500">
            Why train here
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-zinc-100 md:text-4xl">
            A range, not a classroom.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={i * 100}>
              <TiltCard className="group h-full rounded-xl border border-zinc-800 bg-zinc-950 p-6 hover:border-emerald-500/40">
                <h3 className="text-sm font-semibold text-emerald-400">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {feature.description}
                </p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Live range: interactive 3D threat globe + feed */}
      <ThreatMapSection />

      {/* Track record: previously held courses */}
      <section id="track-record" className="hairline-t">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-emerald-500">
              Track record
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-zinc-100 md:text-4xl">
              Previously held at the range.
            </h2>
          </Reveal>
          <div className="mt-12 space-y-0">
            {PAST_COURSES.map((course, i) => (
              <Reveal key={course.name} delay={i * 80}>
                <div className="group relative grid gap-2 border-l border-zinc-800 py-6 pl-8 transition-colors hover:border-emerald-500/60 md:grid-cols-[180px_1fr_auto] md:items-baseline md:gap-8">
                  {/* Timeline node */}
                  <span className="absolute -left-[5px] top-8 h-2.5 w-2.5 rounded-full border border-zinc-700 bg-black transition-colors group-hover:border-emerald-400 group-hover:bg-emerald-500/30" />
                  <p className="font-mono text-xs tracking-wider text-zinc-500">
                    {course.period}
                  </p>
                  <div>
                    <h3 className="text-base font-semibold text-zinc-100 transition-colors group-hover:text-emerald-400">
                      {course.name}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                      {course.detail}
                    </p>
                  </div>
                  <span className="hidden rounded-full border border-zinc-800 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-zinc-500 md:inline-block">
                    Completed
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Range scenario library: interactive scenario grid */}
      <section className="hairline-t">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-emerald-500">
              The range · Scenario library
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-zinc-100 md:text-4xl">
              50+ live-fire scenarios. Every attack surface.
            </h2>
            <p className="mt-4 max-w-xl text-sm text-zinc-500">
              Every scenario is staged on the isolated range network against
              real infrastructure — hover any tile for a one-line summary.
            </p>
          </Reveal>
          <div className="mt-12">
            <ScenarioGrid />
          </div>
        </div>
      </section>

      {/* Upcoming courses */}
      <section id="courses" className="hairline-t bg-zinc-950/40">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-emerald-500">
              Enrollment
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-zinc-100 md:text-4xl">
              Upcoming courses.
            </h2>
            <p className="mt-4 max-w-xl text-sm text-zinc-500">
              Seats are limited per cohort. Interested participants may be
              rolled over to the next scheduled course once seats fill.
            </p>
            <Link
              href="/courses"
              className="mt-4 inline-block font-mono text-xs tracking-wider text-emerald-500 transition-colors hover:text-emerald-400"
            >
              View all courses →
            </Link>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {upcomingCourses.map((course, i) => (
              <Reveal
                key={course.slug}
                delay={i * 90}
                className={course.featured ? "md:col-span-2 md:row-span-2" : ""}
              >
                <TiltCard
                  className={`group h-full rounded-xl border p-6 ${
                    course.featured
                      ? "border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 to-zinc-950"
                      : "border-zinc-800 bg-zinc-950 hover:border-emerald-500/30"
                  }`}
                >
                  <div className="flex h-full flex-col">
                    <h3
                      className={`font-semibold text-zinc-100 ${
                        course.featured ? "text-2xl" : "text-base"
                      }`}
                    >
                      {course.title}
                    </h3>
                    <p className="mt-1 font-mono text-[11px] tracking-wider text-emerald-500/90">
                      Starts: {course.startDateText ?? "To be declared"}
                    </p>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-400">
                      {course.shortDescription}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      {course.featured && (
                        <a
                          href="#contact"
                          className="btn-glow inline-block w-fit rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:bg-emerald-500"
                        >
                          Reserve a seat →
                        </a>
                      )}
                      <Link
                        href={`/courses/${course.slug}`}
                        className="inline-block w-fit rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition-all hover:-translate-y-0.5 hover:border-emerald-500/50 hover:text-emerald-400"
                      >
                        Course details →
                      </Link>
                    </div>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
            {/* Fill the grid with a pointer to the full catalog */}
            <Reveal delay={upcomingCourses.length * 90}>
              <Link href="/courses" className="block h-full">
                <TiltCard className="group flex h-full flex-col justify-between rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 p-6 hover:border-emerald-500/40">
                  <div>
                    <h3 className="text-base font-semibold text-zinc-100">
                      More on the launchpad
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                      Six more certificate courses run in recurring cohorts —
                      forensics, security architecture, cloud security, VAPT
                      and more.
                    </p>
                  </div>
                  <p className="mt-6 font-mono text-xs tracking-wider text-emerald-500 transition-colors group-hover:text-emerald-400">
                    Browse the full catalog →
                  </p>
                </TiltCard>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Certificate & evaluation criteria */}
      <section className="hairline-t">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-2 md:items-center">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-emerald-500">
              Certification · CEH v13
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-100 md:text-4xl">
              Earned on the range, not in a lecture hall.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-zinc-400">
              The CEH v13 Certificate of Completion requires a minimum of 80%
              attendance and 60% overall marks — and most of the weight sits
              on the hands-on Cyber Range exam, not multiple choice.
            </p>
            <p className="mt-3 max-w-md text-xs leading-relaxed text-zinc-600">
              Each course defines its own evaluation criteria — this breakdown
              applies to the flagship CEH program.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-8">
              <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                CEH v13 · Evaluation weight
              </p>
              <CriteriaBars />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Instructors */}
      <section className="hairline-t bg-zinc-950/40">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-emerald-500">
              Training team
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-zinc-100 md:text-4xl">
              Taught by practitioners.
            </h2>
            <p className="mt-4 max-w-xl text-sm text-zinc-500">
              Each cohort runs with ~5 lead instructors, a dedicated lab
              assistant and a program coordinator.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {INSTRUCTORS.map((person, i) => (
              <Reveal key={person.name} delay={i * 120}>
                <TiltCard className="group flex h-full items-center gap-5 rounded-xl border border-zinc-800 bg-zinc-950 p-6">
                  {/* Placeholder avatar — swap for a photo when available */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/5 font-mono text-sm font-bold text-emerald-400">
                    {person.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-100">
                      {person.name}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                      {person.credentials}
                    </p>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* Facility */}
      <section id="facility" className="hairline-t">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-emerald-500">
              The facility
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-zinc-100 md:text-4xl">
              Cyber Range &amp; Advanced Computing and Cybersecurity Lab
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-400">
              Located at Tower 3, MIST — purpose-built lab rooms with an
              internet-isolated range network, dedicated machines per trainee,
              and instructor-supervised attack–defense simulation environments.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-4 text-sm sm:grid-cols-3">
            {[
              "Internet-isolated lab network",
              "1 lab room per 10 trainees",
              "Pre-configured VM images & tooling",
            ].map((item, i) => (
              <Reveal key={item} delay={i * 100}>
                <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 px-4 py-3 font-mono text-xs tracking-wide text-zinc-400">
                  <span className="mr-2 text-emerald-500">▸</span>
                  {item}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="hairline-t">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <Reveal>
            <p className="text-center font-mono text-xs uppercase tracking-[0.35em] text-emerald-500">
              Questions
            </p>
            <h2 className="mt-3 text-center text-3xl font-bold tracking-tight text-zinc-100 md:text-4xl">
              Before you enroll.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-12">
              <Faq />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden hairline-t">
        {/* Echo of the black hole: radial glow behind the CTA */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(600px circle at 50% 120%, rgba(16,185,129,0.10), transparent 60%), radial-gradient(400px circle at 50% 130%, rgba(255,154,60,0.06), transparent 55%)",
          }}
        />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 py-28 text-center">
          <Reveal>
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-zinc-100 md:text-5xl">
              Ready to cross the event horizon?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm text-zinc-400 md:text-base">
              Next CEH cohort seats are limited. Acceptance emails go out one
              week before commencement.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#contact"
                className="btn-glow rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:bg-emerald-500"
              >
                Enroll now
              </a>
              <Link
                href="/courses"
                className="rounded-lg border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 transition-all hover:-translate-y-0.5 hover:border-emerald-500/50 hover:text-emerald-400"
              >
                Browse courses
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
