import { NotFoundContent } from "@/components/common/NotFoundContent";

/**
 * Explicit 404 for routes whose shell has already been flushed.
 *
 * Why this exists instead of `notFound()` from next/navigation:
 *
 * `notFound()` works by throwing. Next converts that signal into a 404 only
 * while the response is still uncommitted. This app has a root `app/loading.tsx`,
 * which puts a Suspense boundary around every route, so the 200 status line and
 * headers are on the wire before the page component ever runs its query. When
 * the query comes back empty and `notFound()` throws, it is too late to change
 * the status. The user sees the right words and the crawler sees a live page.
 *
 * Measured before the fix: /listings/<bogus>, /news/<bogus>, /u/<bogus>,
 * /orders/<bogus>, /orders/<bogus>/chat and /pay/<bogus> all returned 200 with
 * "Page or Squad Not Found" in the body. Genuinely unmatched URLs such as
 * /middleman returned 404 because those never render a page at all.
 *
 * Returning this component instead lets the server set the status itself,
 * because we never throw and never rely on a post-flush header mutation.
 */
export function notFoundResponse() {
  return <NotFoundContent />;
}

/** Status code the routes should pair with `notFoundResponse()`. */
export const NOT_FOUND_STATUS = 404;
