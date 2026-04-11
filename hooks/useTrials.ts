import { useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNewBlocks } from "@/lib/wagmi/hooks";
import { useTrialStore } from "@/store/trialStore";
import { getTrials } from "@/lib/demo/trialService";
import type { Trial } from "@/types/trial";

/**
 * Fetches the trial list from the demo service (localStorage-backed).
 * In production: reads from Midnight indexer + trial_matcher.compact state.
 * Revalidates on every new block so counts stay fresh.
 */
async function fetchTrials(): Promise<Trial[]> {
  // SSR guard — localStorage is browser-only.
  if (typeof window === "undefined") return [];
  return getTrials();
}

export function useTrials() {
  const { setTrials } = useTrialStore();
  const { data: blockNumber } = useNewBlocks();

  const query = useQuery({
    queryKey: ["trials"],
    queryFn: fetchTrials,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (query.data) setTrials(query.data);
  }, [query.data, setTrials]);

  // Revalidate whenever a new block arrives.
  useEffect(() => {
    if (blockNumber) void query.refetch();
  }, [blockNumber, query]);

  const refetch = useCallback(() => void query.refetch(), [query]);

  return {
    trials: query.data ?? [],
    isLoading: query.isLoading,
    refetch,
  };
}
