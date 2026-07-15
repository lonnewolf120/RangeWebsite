import { COURSES } from "./data";
import type { Course, CourseStatus } from "./types";

/**
 * Data access for courses — the only module pages import course data
 * from. Currently backed by the hardcoded list in `data.ts`; keeping
 * the functions async means the data source can change later without
 * touching any page.
 */

export async function getCourses(): Promise<Course[]> {
  return COURSES;
}

/** Returns null when no course matches (page turns that into a 404). */
export async function getCourseBySlug(slug: string): Promise<Course | null> {
  return COURSES.find((course) => course.slug === slug) ?? null;
}

export async function getCoursesByStatus(
  status: CourseStatus,
): Promise<Course[]> {
  return COURSES.filter((course) => course.status === status);
}
