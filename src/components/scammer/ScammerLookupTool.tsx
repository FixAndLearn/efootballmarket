"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  Handshake,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface ScammerRecord {
  id: string;
  phone: string;
  handle?: string;
  alias: string;
  status: "blacklisted" | "suspect";
  fraudType: string;
  reportedDate: string;
  notes: string;
}

const BLACKLIST_DATABASE: ScammerRecord[] = [];

export function ScammerLookupTool() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQ);
  const [searchResult, setSearchResult] = useState<{
    searched: boolean;
    found: boolean;
    record?: ScammerRecord;
    queryCleaned?: string;
  }>({ searched: false, found: false });

  const runCheck = (raw: string) => {
    const cleanQuery = raw.trim().toLowerCase().replace(/\s+/g, "");
    if (!cleanQuery) return;

    let normalized = cleanQuery;
    if (normalized.startsWith("+254")) {
      normalized = "0" + normalized.slice(4);
    } else if (normalized.startsWith("254")) {
      normalized = "0" + normalized.slice(3);
    }

    const matched = BLACKLIST_DATABASE.find((item) => {
      const matchPhone = item.phone.includes(normalized) || normalized.includes(item.phone);
      const matchHandle = item.handle && item.handle.toLowerCase().includes(cleanQuery);
      return matchPhone || matchHandle;
    });

    setSearchResult({
      searched: true,
      found: Boolean(matched),
      record: matched,
      queryCleaned: raw.trim(),
    });
  };

  useEffect(() => {
    if (initialQ.trim()) {
      setQuery(initialQ);
      runCheck(initialQ);
    }
  }, [initialQ]);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    runCheck(query);
  };

  return (
    <div className="w-full space-y-5">
      <form onSubmit={handleLookup} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-sx-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter Kenyan phone (07... / 01... / +254...) or @handle"
            className="w-full h-12 pl-10 pr-4 rounded-xl bg-sx-stone border border-sx-border text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-emerald-500 text-sm font-mono"
          />
        </div>
        <Button type="submit" variant="primary" size="lg" className="h-12 px-6 shrink-0">
          Check Number
        </Button>
      </form>

      {searchResult.searched && (
        <div>
          {searchResult.found && searchResult.record ? (
            <div className="p-5 rounded-xl bg-sx-red-tint border border-rose-500/60 space-y-3">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-sx-red-text shrink-0" />
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-sx-red-text">
                    Flagged in Blacklist
                  </span>
                  <h3 className="text-base font-bold text-sx-ink">
                    {searchResult.record.alias} ({searchResult.record.phone})
                  </h3>
                </div>
              </div>
              <p className="text-xs text-sx-red-text/90 leading-relaxed">
                {searchResult.record.notes}
              </p>
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-sx-stone border border-sx-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sx-green-text shrink-0" />
                  <span className="text-sm font-bold text-sx-ink">
                    No prior fraud reports found for &ldquo;{searchResult.queryCleaned}&rdquo;
                  </span>
                </div>
                <p className="text-xs text-sx-muted leading-relaxed max-w-xl">
                  Zero blacklist reports does not guarantee a stranger is honest—new SIM cards cost KES 100. Protect your payment via Till 1572931 Middleman instead of sending M-Pesa directly.
                </p>
              </div>
              <Link href="/middleman" className="shrink-0">
                <Button variant="secondary" size="sm">
                  <Handshake className="w-3.5 h-3.5 text-sx-green-text" />
                  <span>Use Middleman</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
