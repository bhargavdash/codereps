/**
 * User-timezone day arithmetic — board S3-2 gotcha: activityDate and streak
 * day boundaries come from Profile.timezone on the SERVER; the client's date
 * is never consulted.
 */

/** Calendar day ("YYYY-MM-DD") of an instant in a given IANA timezone. */
export function dayInTimeZone(instant: Date, timeZone: string): string {
  try {
    // en-CA formats as YYYY-MM-DD
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(instant);
  } catch {
    // corrupt timezone string in the profile — fall back to UTC rather than 500
    return instant.toISOString().slice(0, 10);
  }
}

/** Add whole days to a "YYYY-MM-DD" string (pure calendar math, DST-proof). */
export function addDays(day: string, delta: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d! + delta)).toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" → Date at UTC midnight, the shape Prisma @db.Date columns expect. */
export function dayToDate(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

/** Prisma @db.Date value → "YYYY-MM-DD". */
export function dateToDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}
