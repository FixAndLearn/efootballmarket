import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SmartSearchBar } from "@/components/marketplace/SmartSearchBar";
import { SearchX, Phone } from "lucide-react";

/**
 * Rendered by a route when the thing it was asked for does not exist.
 *
 * Important: call sites must use `notFoundResponse()` from
 * `@/lib/http/notFound`, NOT `notFound()` from next/navigation.
 *
 * `notFound()` throws a control-flow signal that Next turns into a 404 status
 * -- but only if the response headers have not been sent. This app has a root
 * `app/loading.tsx`, which wraps every route in a Suspense boundary, so the
 * 200 shell and its headers flop out of the server before the page component
 * finishes its database lookup. By the time `notFound()` throws, the status is
 * already on the wire as 200. The visitor sees the right words; a crawler sees
 * a healthy page. All six dynamic routes were serving soft 404s because of it.
 *
 * Returning this component from a Server Component that sets `status` itself
 * (see lib/http/notFound) keeps the correct code on the wire.
 */
export function NotFoundContent() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl w-full mx-auto py-16 space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-sx-stone border border-sx-border flex items-center justify-center text-sx-muted mx-auto">
        <SearchX className="w-8 h-8" />
      </div>
      <div>
        <h1 className="text-3xl font-extrabold text-sx-ink font-display mb-2">
          Page or Squad Not Found
        </h1>
        <p className="text-sm text-sx-muted leading-relaxed">
          The listing, order, or URL you requested does not exist or has already been sold and settled under escrow.
        </p>
      </div>

      <div className="w-full text-left">
        <SmartSearchBar variant="hero" />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        <Link
          href="/browse?platform=android"
          className="px-3 py-1.5 rounded-full bg-sx-stone hover:bg-sx-elevated border border-sx-border text-sx-ink font-medium transition-colors"
        >
          Android Squads
        </Link>
        <Link
          href="/browse?platform=ios"
          className="px-3 py-1.5 rounded-full bg-sx-stone hover:bg-sx-elevated border border-sx-border text-sx-ink font-medium transition-colors"
        >
          iOS Squads
        </Link>
        <Link
          href="/browse?minStrength=3150"
          className="px-3 py-1.5 rounded-full bg-sx-stone hover:bg-sx-elevated border border-sx-border text-sx-ink font-medium transition-colors"
        >
          3150+ OVR
        </Link>
        <Link
          href="/scammer-check"
          className="px-3 py-1.5 rounded-full bg-sx-stone hover:bg-sx-elevated border border-sx-border text-sx-ink font-medium transition-colors"
        >
          Phone Check
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        <Link href="/browse">
          <Button variant="primary">Browse Squads</Button>
        </Link>
        <Link href="/wanted">
          <Button variant="secondary">Request Custom Squad</Button>
        </Link>
        <Link href="/">
          <Button variant="ghost">Return Home</Button>
        </Link>
      </div>

      <div className="p-4 rounded-xl bg-sx-stone border border-sx-border text-xs text-sx-muted space-y-1.5 text-left w-full">
        <p className="font-semibold text-sx-ink">Need help locating an active escrow order?</p>
        <p className="leading-relaxed">
          Message our Nairobi support desk on WhatsApp at{" "}
          <a
            href="https://wa.me/254105472373"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sx-green-text hover:underline font-bold inline-flex items-center gap-1"
          >
            <Phone className="w-3 h-3 inline" />
            WhatsApp Support
          </a>
          .
        </p>
      </div>
    </div>
  );
}

export default function NotFound() {
  return <NotFoundContent />;
}
