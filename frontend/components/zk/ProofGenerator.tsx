"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

/**
 * ProofGenerator shows ZK progress without revealing witness data.
 */
export function ProofGenerator({
  isGenerating,
  onGenerate,
  disabled = false,
}: {
  isGenerating: boolean;
  onGenerate: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      <Button onClick={onGenerate} disabled={isGenerating || disabled} className="w-full">
        {isGenerating ? "Generating proof..." : disabled ? "Eligibility required" : "Prove I'm Eligible"}
      </Button>
      {isGenerating && (
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="h-2 rounded-full bg-brand-blue/70"
          aria-label="Generating zero-knowledge proof"
        />
      )}
      <p className="text-xs text-muted-foreground">
        This takes 10-30 seconds. Your health data stays on your device.
      </p>
    </div>
  );
}
