import type { CourseStatus } from "@/lib/courses/types";

const STATUS_META: Record<CourseStatus, { label: string; className: string }> =
  {
    upcoming: {
      label: "Upcoming",
      className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
    },
    offered: {
      label: "Regular Course",
      className: "border-cyan-500/30 bg-cyan-500/5 text-cyan-400",
    },
    completed: {
      label: "Completed",
      className: "border-zinc-700 bg-zinc-900/60 text-zinc-500",
    },
  };

/** Small pill indicating whether a course is upcoming, offered or completed. */
export default function CourseStatusBadge({
  status,
}: {
  status: CourseStatus;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-block rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-widest ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}
