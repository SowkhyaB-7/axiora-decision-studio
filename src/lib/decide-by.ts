/**
 * Decide-by date rules. New decisions may never be dated in the past.
 * All comparisons use the user's LOCAL calendar date as plain YYYY-MM-DD
 * strings, so there are no timezone off-by-one errors.
 */

export const PAST_DATE_MESSAGE = "Choose today or a future date.";

/** Today in the user's local timezone, as YYYY-MM-DD. */
export function localToday(): string {
  const now = new Date();
  const m = `${now.getMonth() + 1}`.padStart(2, "0");
  const d = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}

/** Returns an error message, or null when the value is acceptable. */
export function validateDecideBy(value: string): string | null {
  if (!value) return null; // optional
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Enter a valid date.";
  return value < localToday() ? PAST_DATE_MESSAGE : null;
}
