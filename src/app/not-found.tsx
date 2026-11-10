import { Button } from "@/components/ui/Button";
import { SearchX, Search, Phone } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto py-16 space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-sx-stone border border-sx-border flex items-center justify-center text-sx-muted mx-auto">
        <SearchX className="w-8 h-8" />
      </div>
      <div>
        <h1 className="text-3xl font-extrabold text-sx-ink font-display mb-2">
          Page or Squad Not Found
        </h1>
        <p className="text-sm text-sx-muted leading-relaxed">
          The listing, order, or URL you requested does not exist or has already been sold and completed under escrow.
        </p>
      </div>

      <form action="/browse" method="GET" className="w-full relative">
        <Search className="w-4 h-4 text-sx-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          name="search"
          placeholder="Search for another squad (e.g. 3150 OVR, Gullit, Vieira)..."
          className="w-full pl-10 pr-24 py-3 rounded-xl bg-sx-stone border border-sx-border-strong text-sm text-sx-ink placeholder:text-sx-muted focus:bg-sx-canvas focus:outline-none focus:border-sx-ink"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="absolute right-1.5 top-1.5"
        >
          Search
        </Button>
      </form>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link href="/browse">
          <Button variant="primary" size="md">
            Browse Squads
          </Button>
        </Link>
        <Link href="/wanted">
          <Button variant="outline" size="md">
            Buyer Requests
          </Button>
        </Link>
        <Link href="/">
          <Button variant="ghost" size="md">
            Return Home
          </Button>
        </Link>
      </div>

      <div className="p-4 rounded-xl bg-sx-stone border border-sx-border text-xs text-sx-muted space-y-1.5 text-left w-full">
        <p className="font-semibold text-sx-ink">Need help locating an active escrow order?</p>
        <p className="leading-relaxed">
          Message our Nairobi support desk on WhatsApp at{" "}
          <a
            href="https://wa.me/254794400365"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sx-green-text hover:underline font-bold inline-flex items-center gap-1"
          >
            <Phone className="w-3 h-3 inline" />
            0794 400 365
          </a>
          .
        </p>
      </div>
    </div>
  );
}
