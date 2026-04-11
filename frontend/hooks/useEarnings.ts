import { useMemo } from "react";

export interface EarningRecord {
  date: string;
  trial: string;
  fields: string;
  amount: number;
  txHash: string;
}

export function useEarnings() {
  const earnings = useMemo<EarningRecord[]>(
    () => [
      {
        date: "2026-04-02",
        trial: "GLP-1 Metabolic Study",
        fields: "Age range, Lab quartile",
        amount: 120,
        txHash: "0x9ab1...22ff",
      },
      {
        date: "2026-03-18",
        trial: "Hypertension Outcomes Trial",
        fields: "Diagnosis category",
        amount: 80,
        txHash: "0x7fc4...91aa",
      },
    ],
    []
  );

  const total = earnings.reduce((sum, item) => sum + item.amount, 0);

  return { earnings, total, pending: 40 };
}
