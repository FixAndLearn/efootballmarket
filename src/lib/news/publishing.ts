/**
 * Publication and sitemap timestamp helpers.
 * A public item must not appear before its creation/publication timestamp, and
 * future update timestamps are capped so public metadata never claims a future
 * modification date.
 */
export function isContentDateReached(
  createdAt: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!createdAt) return false;
  const timestamp = Date.parse(createdAt);
  return Number.isFinite(timestamp) && timestamp <= now.getTime();
}

export function safeLastModified(
  value: string | null | undefined,
  now: Date = new Date()
): Date | undefined {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return undefined;
  return new Date(Math.min(timestamp, now.getTime()));
}

export function safeUpdatedAt(
  createdAt: string,
  updatedAt: string | null | undefined,
  now: Date = new Date()
): string {
  const safeDate =
    safeLastModified(updatedAt, now) ??
    safeLastModified(createdAt, now) ??
    new Date(now.getTime());
  return safeDate.toISOString();
}
