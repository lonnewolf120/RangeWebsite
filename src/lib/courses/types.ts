/**
 * Course domain types.
 *
 * Every detail-page section is optional: the detail page only renders
 * the sections a record actually has, so a course can be as thin as a
 * title + hours or carry a full curriculum.
 */

/**
 * upcoming  — a scheduled (or soon-to-be-scheduled) run, shown first
 * offered   — part of the regular catalog, no run currently scheduled
 * completed — a past run, shown in the track record
 */
export type CourseStatus = "upcoming" | "offered" | "completed";

/** One row of the key-facts table at the top of a detail page. */
export interface OverviewRow {
  label: string;
  value: string;
}

/** One session in the training schedule table. */
export interface ScheduleRow {
  week: string;
  day: string;
  time: string;
  coverage: string;
}

/** One role in the training team (lead instructor, lab assistant…). */
export interface TeamRole {
  role: string;
  qty: string;
  responsibility: string;
}

export interface Instructor {
  name: string;
  title: string;
  credentials: string;
  /** Absolute URL or /public path; null/omitted renders an initials avatar. */
  photoUrl?: string | null;
}

export interface CertificateInfo {
  name: string;
  description: string;
  criteria: { label: string; weightPercent: number }[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  status: CourseStatus;

  /** e.g. 40 — omit when not announced. */
  durationHours?: number;
  /** e.g. "12 Days (6 Weeks) every Friday & Saturday". */
  durationText?: string;
  /** Recurring pattern, e.g. "Fridays". */
  scheduleText?: string;
  /** Human-readable start ("5 December 2025"); null = "To be declared". */
  startDateText?: string | null;
  /** When the course ran, for completed courses ("Dec 2025 – Jan 2026"). */
  periodText?: string;
  feeText?: string;
  level?: string;
  /** Featured courses get the large card on the listing page. */
  featured?: boolean;

  /* ---- detail-page sections (all optional) ---- */
  overview?: OverviewRow[];
  /** "About this course" paragraphs. */
  about?: string[];
  /** "Expected takeaways" bullet list. */
  takeaways?: string[];
  /** "Who this course is for" paragraphs. */
  audience?: string[];
  prerequisites?: string[];
  courseSchedule?: ScheduleRow[];
  scheduleNotes?: string[];
  trainingTeam?: TeamRole[];
  trainingTeamNotes?: string[];
  instructors?: Instructor[];
  certificate?: CertificateInfo;
  /** Registration / confirmation fine print. */
  confirmationNotes?: string[];
}
