import { useCallback, useEffect } from "react";
import { useMidnight } from "@/lib/midnight/context";
import { encryptHealthData } from "@/lib/crypto/encrypt";
import { sha256 } from "@/lib/crypto/hash";
import { computeWitnesses } from "@/lib/midnight/witnesses";
import { useWitnessStore } from "@/store/witnessStore";
import type { HealthData } from "@/types/patient";

async function deriveNullifierSecret(signature: string): Promise<Uint8Array> {
  return sha256(signature);
}

export function useVault() {
  const { isConnected } = useMidnight();
  const { witnesses, encryptedVault, isVaultReady, setWitnesses, setEncryptedVault, clearWitnesses } =
    useWitnessStore();

  useEffect(() => {
    if (!isConnected) {
      clearWitnesses();
    }
  }, [isConnected, clearWitnesses]);

  const saveVault = useCallback(
    async (
      data: HealthData,
      walletAddress: string,
      walletSignature: string,
      nullifierSignature: string
    ) => {
      const encrypted = await encryptHealthData(data, walletAddress, walletSignature);
      const derivedWitnesses = computeWitnesses(data);
      const nullifierSecret = await deriveNullifierSecret(nullifierSignature);

      setEncryptedVault(encrypted);
      setWitnesses({ ...derivedWitnesses, nullifierSecret });
      return encrypted;
    },
    [setEncryptedVault, setWitnesses]
  );

  return { vault: encryptedVault, saveVault, isVaultReady, witnesses };
}
