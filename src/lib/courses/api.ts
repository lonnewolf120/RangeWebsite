import type { Course, CourseStatus } from "./types";

/**
 * Data access for courses — the only module pages import course data
 * from. Backed by the Express/Prisma backend; ISR-cached for
 * REVALIDATE_SECONDS so admin edits show up without a full rebuild.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const REVALIDATE_SECONDS = 300;

type RawInstructor = {
  name: string;
  title: string;
  credentials: string | null;
  photoUrl: string | null;
};

type RawCourse = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  status: "UPCOMING" | "OFFERED" | "COMPLETED";
  featured: boolean;
  durationHours: number | null;
  durationText: string | null;
  scheduleText: string | null;
  startDateText: string | null;
  periodText: string | null;
  feeText: string | null;
  level: string | null;
  overview: NonNullable<Course["overview"]> | null;
  about: string[];
  takeaways: string[];
  audience: string[];
  prerequisites: string[];
  courseSchedule: NonNullable<Course["courseSchedule"]> | null;
  scheduleNotes: string[];
  trainingTeam: NonNullable<Course["trainingTeam"]> | null;
  trainingTeamNotes: string[];
  certificate: NonNullable<Course["certificate"]> | null;
  confirmationNotes: string[];
  instructors: RawInstructor[];
};

function mapCourse(raw: RawCourse): Course {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    shortDescription: raw.shortDescription,
    status: raw.status.toLowerCase() as CourseStatus,
    featured: raw.featured,
    durationHours: raw.durationHours ?? undefined,
    durationText: raw.durationText ?? undefined,
    scheduleText: raw.scheduleText ?? undefined,
    startDateText: raw.startDateText,
    periodText: raw.periodText ?? undefined,
    feeText: raw.feeText ?? undefined,
    level: raw.level ?? undefined,
    overview: raw.overview ?? undefined,
    about: raw.about,
    takeaways: raw.takeaways,
    audience: raw.audience,
    prerequisites: raw.prerequisites,
    courseSchedule: raw.courseSchedule ?? undefined,
    scheduleNotes: raw.scheduleNotes,
    trainingTeam: raw.trainingTeam ?? undefined,
    trainingTeamNotes: raw.trainingTeamNotes,
    instructors: raw.instructors.map((instructor) => ({
      name: instructor.name,
      title: instructor.title,
      credentials: instructor.credentials ?? "",
      photoUrl: instructor.photoUrl,
    })),
    certificate: raw.certificate ?? undefined,
    confirmationNotes: raw.confirmationNotes,
  };
}

async function fetchCourseJson<T>(
  path: string,
): Promise<{ ok: true; data: T } | { ok: false; status: number }> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!response.ok) {
    return { ok: false, status: response.status };
  }
  return { ok: true, data: (await response.json()) as T };
}

export async function getCourses(): Promise<Course[]> {
  const result = await fetchCourseJson<RawCourse[]>("/api/courses");
  if (!result.ok) {
    throw new Error(`Failed to load courses (status ${result.status})`);
  }
  return result.data.map(mapCourse);
}

/** Returns null when no course matches (page turns that into a 404). */
export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const result = await fetchCourseJson<RawCourse>(
    `/api/courses/${encodeURIComponent(slug)}`,
  );
  if (!result.ok) {
    if (result.status === 404) return null;
    throw new Error(`Failed to load course "${slug}" (status ${result.status})`);
  }
  return mapCourse(result.data);
}

export async function getCoursesByStatus(
  status: CourseStatus,
): Promise<Course[]> {
  const courses = await getCourses();
  return courses.filter((course) => course.status === status);
}
