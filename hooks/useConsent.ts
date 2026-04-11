import { useCallback, useEffect, useState } from "react";
import { sha256Hex } from "@/lib/crypto/hash";

export interface ConsentRecord {
  trialId: string;
  status: "active" | "revoked" | "pending";
  tokenHash: string;
  consentedAt: string;
  disclosureRequests: number;
}

const STORAGE_KEY = "trialvault-consents";

export function useConsent() {
  const [consents, setConsents] = useState<ConsentRecord[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ConsentRecord[];
        setConsents(parsed);
      } catch {
        setConsents([]);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consents));
  }, [consents]);

  const grantConsent = useCallback(async (trialId: bigint) => {
    const trialKey = trialId.toString();
    const tokenHash = await sha256Hex(`${trialKey}-${Date.now()}`);
    setConsents((prev) => [
      ...prev.filter((item) => item.trialId !== trialKey),
      {
        trialId: trialKey,
        status: "active",
        tokenHash,
        consentedAt: new Date().toISOString(),
        disclosureRequests: 0,
      },
    ]);
    return tokenHash;
  }, []);

  const revokeConsent = useCallback(async (trialId: string) => {
    const trialKey = trialId;
    setConsents((prev) =>
      prev.map((item) =>
        item.trialId === trialKey ? { ...item, status: "revoked" } : item
      )
    );
  }, []);

  return { consents, grantConsent, revokeConsent };
}
