import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ConstellationField from "@/components/ConstellationField";
import CourseStatusBadge from "@/components/courses/CourseStatusBadge";
import Reveal from "@/components/Reveal";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { getCourseBySlug, getCourses } from "@/lib/courses/api";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const courses = await getCourses();
  return courses.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return { title: "Course not found — Cyber Range" };
  return {
    title: `${course.title} — Cyber Range`,
    description: course.shortDescription,
  };
}

/** Section shell: eyebrow label + content, matching the home page rhythm. */
function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="hairline-t">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-emerald-500">
            {eyebrow}
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-zinc-100 md:text-3xl">
            {title}
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <div className="mt-8">{children}</div>
        </Reveal>
      </div>
    </section>
  );
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const startLabel = course.startDateText ?? "To be declared";

  return (
    // No solid background — the fixed 3D starfield from layout.tsx shows
    // through between the translucent sections.
    <main className="text-zinc-200">
      <SiteHeader />

      {/* Course header */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(700px circle at 30% -20%, rgba(16,185,129,0.10), transparent 60%)",
          }}
        />
        {/* Interactive constellation: stars link to the cursor */}
        <ConstellationField className="[mask-image:linear-gradient(to_bottom,black_55%,transparent)]" />
        <div className="relative mx-auto max-w-6xl px-6 pb-14 pt-36">
          <Reveal>
            <Link
              href="/courses"
              className="font-mono text-xs tracking-wider text-zinc-500 transition-colors hover:text-emerald-400"
            >
              ← All courses
            </Link>
            <div className="mt-6">
              <CourseStatusBadge status={course.status} />
            </div>
            <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-zinc-100 md:text-5xl">
              {course.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-400">
              {course.shortDescription}
            </p>

            {/* Key facts chips */}
            <div className="mt-8 flex flex-wrap gap-3">
              {[
                course.durationText ??
                  (course.durationHours
                    ? `${course.durationHours} hours`
                    : null),
                course.scheduleText,
                course.level && `Level: ${course.level}`,
                course.status !== "completed" && `Starts: ${startLabel}`,
                course.feeText && `Fee: ${course.feeText}`,
              ]
                .filter((fact): fact is string => Boolean(fact))
                .map((fact) => (
                  <span
                    key={fact}
                    className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-2 font-mono text-xs tracking-wide text-zinc-400"
                  >
                    <span className="mr-2 text-emerald-500">▸</span>
                    {fact}
                  </span>
                ))}
            </div>

            {course.status !== "completed" && (
              <div className="mt-8">
                <Link
                  href="/#contact"
                  className="btn-glow inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:bg-emerald-500"
                >
                  Enroll / express interest →
                </Link>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* Overview facts table */}
      {course.overview && course.overview.length > 0 && (
        <Section eyebrow="Overview" title="At a glance.">
          <div className="overflow-hidden rounded-xl border border-zinc-800">
            <dl className="divide-y divide-zinc-800/80">
              {course.overview.map((row) => (
                <div
                  key={row.label}
                  className="grid gap-1 bg-zinc-950/60 px-6 py-4 sm:grid-cols-[220px_1fr] sm:gap-6"
                >
                  <dt className="font-mono text-xs uppercase tracking-wider text-zinc-500">
                    {row.label}
                  </dt>
                  <dd className="text-sm leading-relaxed text-zinc-300">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Section>
      )}

      {/* About */}
      {course.about && course.about.length > 0 && (
        <Section eyebrow="The course" title="About this course.">
          <div className="max-w-3xl space-y-5">
            {course.about.map((paragraph, i) => (
              <p key={i} className="text-sm leading-relaxed text-zinc-400">
                {paragraph}
              </p>
            ))}
          </div>
        </Section>
      )}

      {/* Expected takeaways */}
      {course.takeaways && course.takeaways.length > 0 && (
        <Section eyebrow="Outcomes" title="Expected takeaways.">
          <ul className="grid gap-3 md:grid-cols-2">
            {course.takeaways.map((item) => (
              <li
                key={item}
                className="flex gap-3 rounded-lg border border-zinc-800/80 bg-zinc-950/60 px-4 py-3 text-sm leading-relaxed text-zinc-400"
              >
                <span className="text-emerald-500">▸</span>
                {item}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Audience & prerequisites */}
      {((course.audience && course.audience.length > 0) ||
        (course.prerequisites && course.prerequisites.length > 0)) && (
        <Section eyebrow="Before you apply" title="Who this course is for.">
          <div className="grid gap-10 md:grid-cols-2">
            {course.audience && course.audience.length > 0 && (
              <div className="space-y-4">
                {course.audience.map((paragraph, i) => (
                  <p key={i} className="text-sm leading-relaxed text-zinc-400">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}
            {course.prerequisites && course.prerequisites.length > 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                  Pre-requisites
                </p>
                <ul className="mt-4 space-y-3">
                  {course.prerequisites.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 text-sm leading-relaxed text-zinc-400"
                    >
                      <span className="text-emerald-500">▸</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Training schedule */}
      {course.courseSchedule && course.courseSchedule.length > 0 && (
        <Section eyebrow="Course content" title="Training schedule.">
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                  <th className="px-5 py-3 font-medium">Week</th>
                  <th className="px-5 py-3 font-medium">Day &amp; Date</th>
                  <th className="px-5 py-3 font-medium">Time</th>
                  <th className="px-5 py-3 font-medium">Module Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {course.courseSchedule.map((row, i) => (
                  <tr
                    key={i}
                    className="bg-zinc-950/60 transition-colors hover:bg-emerald-950/20"
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs text-emerald-500/90">
                      {row.week}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-zinc-300">
                      {row.day}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-zinc-500">
                      {row.time}
                    </td>
                    <td className="px-5 py-3.5 leading-relaxed text-zinc-400">
                      {row.coverage}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {course.scheduleNotes && course.scheduleNotes.length > 0 && (
            <div className="mt-4 space-y-1.5">
              {course.scheduleNotes.map((note, i) => (
                <p key={i} className="text-xs leading-relaxed text-zinc-600">
                  {note}
                </p>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Training team */}
      {course.trainingTeam && course.trainingTeam.length > 0 && (
        <Section eyebrow="Delivery" title="Training team.">
          <div className="grid gap-6 md:grid-cols-3">
            {course.trainingTeam.map((member) => (
              <div
                key={member.role}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 transition-colors hover:border-emerald-500/40"
              >
                <h3 className="text-sm font-semibold text-emerald-400">
                  {member.role}
                </h3>
                <p className="mt-1 font-mono text-[11px] tracking-wider text-zinc-500">
                  Qty: {member.qty}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  {member.responsibility}
                </p>
              </div>
            ))}
          </div>
          {course.trainingTeamNotes && course.trainingTeamNotes.length > 0 && (
            <ul className="mt-6 space-y-1.5">
              {course.trainingTeamNotes.map((note) => (
                <li key={note} className="text-xs leading-relaxed text-zinc-600">
                  • {note}
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {/* Teaching staff */}
      {course.instructors && course.instructors.length > 0 && (
        <Section eyebrow="Training team" title="Teaching staff.">
          <div className="grid gap-6 md:grid-cols-2">
            {course.instructors.map((person) => (
              <div
                key={person.name}
                className="flex items-center gap-5 rounded-xl border border-zinc-800 bg-zinc-950 p-6"
              >
                {/* Initials avatar until a photoUrl is set on the record */}
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/5 font-mono text-sm font-bold text-emerald-400">
                  {person.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-100">{person.name}</h3>
                  <p className="mt-0.5 font-mono text-[11px] tracking-wider text-emerald-500/90">
                    {person.title}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                    {person.credentials}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Certificate & evaluation */}
      {course.certificate && (
        <Section eyebrow="Certification" title={course.certificate.name + "."}>
          <div className="grid gap-10 md:grid-cols-2 md:items-start">
            <p className="max-w-md text-sm leading-relaxed text-zinc-400">
              {course.certificate.description}
            </p>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-8">
              <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                Evaluation weight
              </p>
              <div className="space-y-5">
                {course.certificate.criteria.map((criterion) => (
                  <div key={criterion.label}>
                    <div className="mb-2 flex items-baseline justify-between text-sm">
                      <span className="text-zinc-300">{criterion.label}</span>
                      <span className="font-mono text-xs text-emerald-400">
                        {criterion.weightPercent}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                        style={{ width: `${criterion.weightPercent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Confirmation fine print */}
      {course.confirmationNotes && course.confirmationNotes.length > 0 && (
        <Section
          eyebrow="Good to know"
          title="Course confirmation & information."
        >
          <ul className="max-w-3xl space-y-3">
            {course.confirmationNotes.map((note) => (
              <li
                key={note}
                className="flex gap-3 text-sm leading-relaxed text-zinc-500"
              >
                <span className="text-emerald-500">▸</span>
                {note}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* CTA */}
      <section className="relative overflow-hidden hairline-t">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(600px circle at 50% 120%, rgba(16,185,129,0.10), transparent 60%)",
          }}
        />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 py-20 text-center">
          <Reveal>
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-zinc-100 md:text-4xl">
              {course.status === "completed"
                ? "Missed this cohort?"
                : "Seats are limited."}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm text-zinc-400">
              {course.status === "completed"
                ? "Courses run in recurring cohorts — register interest and we'll notify you when the next batch is announced."
                : "Interested participants may be rolled over to the next scheduled course once seats fill. Register early."}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/#contact"
                className="btn-glow rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:bg-emerald-500"
              >
                Contact us
              </Link>
              <Link
                href="/courses"
                className="rounded-lg border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 transition-all hover:-translate-y-0.5 hover:border-emerald-500/50 hover:text-emerald-400"
              >
                Browse all courses
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
