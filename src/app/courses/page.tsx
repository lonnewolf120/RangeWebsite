import type { Metadata } from "next";
import Link from "next/link";

import ConstellationField from "@/components/ConstellationField";
import CourseStatusBadge from "@/components/courses/CourseStatusBadge";
import Reveal from "@/components/Reveal";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import TiltCard from "@/components/TiltCard";
import { getCourses } from "@/lib/courses/api";
import type { Course } from "@/lib/courses/types";

export const metadata: Metadata = {
  title: "Courses — Cyber Range",
  description:
    "Upcoming, regularly offered and previously held certificate courses at MIST Cyber Range (CACR).",
};

// See src/app/page.tsx for why this is dynamic rather than static.
export const dynamic = "force-dynamic";

/** "40 hours · Fridays · Starts: To be declared" facts line for a card. */
function factsLine(course: Course): string {
  const facts: string[] = [];
  if (course.durationText) facts.push(course.durationText);
  else if (course.durationHours) facts.push(`${course.durationHours} hours`);
  if (course.scheduleText) facts.push(course.scheduleText);
  if (course.status === "completed") {
    if (course.periodText) facts.push(course.periodText);
  } else {
    facts.push(`Starts: ${course.startDateText ?? "To be declared"}`);
  }
  return facts.join(" · ");
}

function DetailsLink({
  course,
  prominent = false,
}: {
  course: Course;
  prominent?: boolean;
}) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className={
        prominent
          ? "btn-glow inline-block w-fit rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:bg-emerald-500"
          : "inline-block w-fit rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 transition-all hover:-translate-y-0.5 hover:border-emerald-500/50 hover:text-emerald-400"
      }
    >
      Course details →
    </Link>
  );
}

function CourseCard({ course }: { course: Course }) {
  return (
    <TiltCard
      className={`group h-full rounded-xl border p-6 ${
        course.featured
          ? "border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 to-zinc-950"
          : "border-zinc-800 bg-zinc-950 hover:border-emerald-500/30"
      }`}
    >
      <div className="flex h-full flex-col">
        <div>
          <CourseStatusBadge status={course.status} />
        </div>
        <h3
          className={`mt-4 font-semibold text-zinc-100 ${
            course.featured ? "text-2xl" : "text-base"
          }`}
        >
          {course.title}
        </h3>
        <p className="mt-2 font-mono text-[11px] tracking-wider text-emerald-500/90">
          {factsLine(course)}
        </p>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-400">
          {course.shortDescription}
        </p>
        <div className="mt-6">
          <DetailsLink course={course} prominent={course.featured} />
        </div>
      </div>
    </TiltCard>
  );
}

export default async function CoursesPage() {
  const courses = await getCourses();
  const upcoming = courses.filter((c) => c.status === "upcoming");
  const offered = courses.filter((c) => c.status === "offered");
  const completed = courses.filter((c) => c.status === "completed");

  return (
    // No solid background — the fixed 3D starfield from layout.tsx shows
    // through between the translucent sections.
    <main className="text-zinc-200">
      <SiteHeader />

      {/* Page intro */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(700px circle at 50% -20%, rgba(16,185,129,0.10), transparent 60%)",
          }}
        />
        {/* Interactive constellation: stars link to the cursor */}
        <ConstellationField className="[mask-image:linear-gradient(to_bottom,black_55%,transparent)]" />
        <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-36">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-emerald-500">
              Training programs
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-zinc-100 md:text-5xl">
              Courses at the range.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-400">
              Certificate courses run in cohorts at the Cyber Range &amp;
              Advanced Computing and Cybersecurity Lab, Tower 3, MIST. Seats
              are limited — registration is confirmed upon payment, and
              acceptance emails go out at least one week before commencement.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section id="upcoming" className="hairline-t bg-zinc-950/40">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <Reveal>
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-emerald-500">
                Enrollment
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-100 md:text-4xl">
                Upcoming course.
              </h2>
            </Reveal>
            <div className="mt-10 grid gap-6">
              {upcoming.map((course, i) => (
                <Reveal key={course.id} delay={i * 90}>
                  <CourseCard course={course} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Regularly offered catalog */}
      {offered.length > 0 && (
        <section id="catalog" className="hairline-t">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <Reveal>
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-emerald-500">
                Catalog
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-100 md:text-4xl">
                Regularly offered here.
              </h2>
              <p className="mt-4 max-w-xl text-sm text-zinc-500">
                These certificate courses launch in recurring cohorts.
                Starting dates are announced per batch — join the newsletter
                below to hear first.
              </p>
            </Reveal>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {offered.map((course, i) => (
                <Reveal key={course.id} delay={i * 80}>
                  <CourseCard course={course} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Previously held */}
      {completed.length > 0 && (
        <section id="completed" className="hairline-t bg-zinc-950/40">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <Reveal>
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-emerald-500">
                Track record
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-100 md:text-4xl">
                Previously held at the range.
              </h2>
            </Reveal>
            <div className="mt-10">
              {completed.map((course, i) => (
                <Reveal key={course.id} delay={i * 80}>
                  <div className="group relative grid gap-3 border-l border-zinc-800 py-6 pl-8 transition-colors hover:border-emerald-500/60 md:grid-cols-[180px_1fr_auto] md:items-start md:gap-8">
                    <span className="absolute -left-[5px] top-8 h-2.5 w-2.5 rounded-full border border-zinc-700 bg-black transition-colors group-hover:border-emerald-400 group-hover:bg-emerald-500/30" />
                    <p className="pt-1 font-mono text-xs tracking-wider text-zinc-500">
                      {course.periodText ?? "—"}
                    </p>
                    <div>
                      <h3 className="text-base font-semibold text-zinc-100 transition-colors group-hover:text-emerald-400">
                        {course.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                        {course.shortDescription}
                      </p>
                      <div className="mt-4">
                        <DetailsLink course={course} />
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <CourseStatusBadge status={course.status} />
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
    </main>
  );
}
