import { Button } from "@/components/ui/Button";
import { SearchX, Sparkles, Search, Phone, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto py-16 space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-[#F4F3F1] border border-[#C8C8C4] flex items-center justify-center text-[#B45309] mx-auto shadow-inner">
        <SearchX className="w-8 h-8" />
      </div>
      <div>
        <h1 className="text-3xl font-extrabold text-[#0F0F0F] font-display mb-2">
          Page or Squad Not Found
        </h1>
        <p className="text-sm text-[#5F5F5F] leading-relaxed">
          The listing, order, or URL you requested does not exist or may have already been sold and transferred under escrow.
        </p>
      </div>

      {/* Quick Search */}
      <form action="/browse" method="GET" className="w-full relative shadow-lg">
        <Search className="w-4 h-4 text-[#5F5F5F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          name="search"
          placeholder="Search for another squad (e.g. 3150 OVR, Epics)..."
          className="w-full pl-10 pr-24 py-3 rounded-2xl bg-[#111827] border border-[#C8C8C4] text-sm text-[#F8FAFC] placeholder:text-[#767676] focus:outline-none focus:border-[#22C55E]"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="absolute right-1.5 top-1.5 bg-[#22C55E] text-[#0B1220] font-bold text-xs px-4 rounded-xl"
        >
          Search
        </Button>
      </form>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link href="/browse">
          <Button variant="primary" size="md" className="bg-[#22C55E] text-[#0B1220] font-bold text-xs">
            Browse Live Accounts
          </Button>
        </Link>
        <Link href="/wanted">
          <Button variant="secondary" size="md" className="bg-[#111827] border border-[#C8C8C4] text-[#1F1F1F] text-xs">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#B45309]" />
            Wanted Board
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" size="md" className="border-[#C8C8C4] text-[#3D3D3D] text-xs">
            Return Home
          </Button>
        </Link>
      </div>

      <div className="p-4 rounded-2xl bg-pitch-card/60 border border-pitch-border text-xs text-[#5F5F5F] space-y-2 text-left w-full">
        <p className="font-semibold text-[#1F1F1F]">Need immediate assistance with an escrow order?</p>
        <p className="text-[11px] leading-relaxed">
          Contact our verified administration desk directly on WhatsApp at{" "}
          <a
            href="https://wa.me/254794400365"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#22C55E] hover:underline font-bold inline-flex items-center gap-1"
          >
            <Phone className="w-3 h-3 inline" />
            0794400365 (Brian Okibo)
          </a>
          .
        </p>
      </div>
    </div>
  );
}
