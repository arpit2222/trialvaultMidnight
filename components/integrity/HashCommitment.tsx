"use client";

"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * HashCommitment displays immutable hashes without exposing underlying data.
 */
export function HashCommitment({ label, hash }: { label: string; hash: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-white/10 bg-black/30 p-3">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-white">{hash}</p>
      </div>
      <Button
        variant="outline"
        onClick={async () => {
          await navigator.clipboard.writeText(hash);
          toast.success("Copied hash");
        }}
      >
        Copy
      </Button>
    </div>
  );
}
