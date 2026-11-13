import { Button } from "@/components/ui/Button";
import { SmartSearchBar } from "@/components/marketplace/SmartSearchBar";
import { SearchX, Phone } from "lucide-react";
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
          The listing, order, or URL you requested does not exist or has already been sold and settled under escrow.
        </p>
      </div>

      <div className="w-full text-left">
        <SmartSearchBar variant="hero" />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        {[
          { label: "Android Squads", href: "/browse?platform=android" },
          { label: "iOS Squads", href: "/browse?platform=ios" },
          { label: "3150+ OVR", href: "/browse?minStrength=3150" },
          { label: "Middleman Desk", href: "/middleman" },
          { label: "Phone Check", href: "/scammer-check" },
        ].map((chip) => (
          <Link
            key={chip.href}
            href={chip.href}
            className="px-3 py-1.5 rounded-full bg-sx-stone hover:bg-sx-elevated border border-sx-border text-sx-ink font-medium transition-colors"
          >
            {chip.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        <Link href="/browse">
          <Button variant="primary" size="md">
            Browse Squads
          </Button>
        </Link>
        <Link href="/wanted">
          <Button variant="outline" size="md">
            Request Custom Squad
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
