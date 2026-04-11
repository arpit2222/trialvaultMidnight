"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { runTxStatus } from "@/lib/tx";

const events = ["Nausea", "Headache", "Fatigue", "Chest pain", "Allergic reaction", "Other"];

/**
 * ReportPage submits anonymous events without linkable identity data.
 */
export default function ReportPage() {
  const [severity, setSeverity] = useState(3);

  return (
    <div className="space-y-6">
      <Card className="border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
        Your report is submitted via a shielded transaction. It cannot be linked to your wallet address or identity.
      </Card>

      <Card className="border-white/10 bg-white/5 p-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select trial" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trial-1">GLP-1 Metabolic Study</SelectItem>
              <SelectItem value="trial-2">Hypertension Outcomes Trial</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Event type" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event} value={event}>
                  {event}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input type="date" />
          <div>
            <label className="text-sm text-muted-foreground">Severity: {severity}</label>
            <input
              type="range"
              min={1}
              max={5}
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
              className="mt-2 w-full"
            />
          </div>
        </div>
        <Textarea placeholder="Notes (optional)" />
        <Button
          onClick={async () => {
            await runTxStatus();
            toast.success("Report submitted anonymously");
          }}
        >
          Submit report
        </Button>
      </Card>
    </div>
  );
}
