import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[50vh] w-full">
      <div className="w-11 h-11 rounded-full bg-sx-stone border border-sx-border flex items-center justify-center text-sx-green-text mb-3">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
      <p className="text-xs font-semibold text-sx-muted tracking-wider uppercase">
        Loading...
      </p>
    </div>
  );
}
