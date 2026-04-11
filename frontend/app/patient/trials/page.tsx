"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrialCard } from "@/components/trials/TrialCard";
import { useTrials } from "@/hooks/useTrials";
import { useWitnessStore } from "@/store/witnessStore";
import type { TrialPhase, TrialStatus } from "@/types/trial";

/**
 * PatientTrialsPage computes eligibility locally without data upload.
 */
export default function PatientTrialsPage() {
  const { trials, isLoading } = useTrials();
  const { witnesses, isVaultReady } = useWitnessStore();
  const [search, setSearch] = useState("");
  const [phase, setPhase] = useState<TrialPhase | "all">("all");
  const [status, setStatus] = useState<TrialStatus | "all">("all");
  const [eligibleOnly, setEligibleOnly] = useState(false);

  const filtered = useMemo(() => {
    return trials.filter((trial) => {
      const matchesSearch =
        trial.name.toLowerCase().includes(search.toLowerCase()) ||
        trial.indication.toLowerCase().includes(search.toLowerCase());
      const matchesPhase = phase === "all" || trial.phase === phase;
      const matchesStatus = status === "all" || trial.status === status;
      const eligibleMatch = !eligibleOnly
        ? true
        : isVaultReady &&
          witnesses.age !== null &&
          witnesses.diagnosisCode !== null &&
          witnesses.labValue1 !== null &&
          witnesses.age >= trial.criteria.minAge &&
          witnesses.age <= trial.criteria.maxAge &&
          witnesses.diagnosisCode === trial.criteria.diagnosisCode &&
          witnesses.labValue1 >= trial.criteria.labMin1 &&
          witnesses.labValue1 <= trial.criteria.labMax1;
      return matchesSearch && matchesPhase && matchesStatus && eligibleMatch;
    });
  }, [trials, search, phase, status, eligibleOnly, isVaultReady, witnesses]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading trials...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Browse trials</h1>
      <div className="grid gap-4 md:grid-cols-4">
        <Input placeholder="Search by name or indication" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select onValueChange={(value: string) => setPhase(value as TrialPhase | "all")}>
          <SelectTrigger>
            <SelectValue placeholder="Phase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All phases</SelectItem>
            <SelectItem value="Phase I">Phase I</SelectItem>
            <SelectItem value="Phase II">Phase II</SelectItem>
            <SelectItem value="Phase III">Phase III</SelectItem>
            <SelectItem value="Phase IV">Phase IV</SelectItem>
          </SelectContent>
        </Select>
        <Select onValueChange={(value: string) => setStatus(value as TrialStatus | "all")}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={eligibleOnly}
            onChange={(event) => setEligibleOnly(event.target.checked)}
            className="h-4 w-4 rounded border border-white/20 bg-black/20"
          />
          Eligible only
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((trial) => (
          <TrialCard key={trial.id.toString()} trial={trial} />
        ))}
      </div>
    </div>
  );
}
