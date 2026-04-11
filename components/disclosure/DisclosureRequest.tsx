"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldToggle } from "@/components/disclosure/FieldToggle";
import { PaymentSummary } from "@/components/disclosure/PaymentSummary";

/**
 * DisclosureRequest lets patients approve selective fields locally.
 */
export function DisclosureRequest({ onApprove }: { onApprove: (fields: number) => void }) {
  const [age, setAge] = useState(true);
  const [diagnosis, setDiagnosis] = useState(false);
  const [lab1, setLab1] = useState(true);
  const [lab2, setLab2] = useState(false);

  const bitmask = (age ? 1 : 0) | (diagnosis ? 2 : 0) | (lab1 ? 4 : 0) | (lab2 ? 8 : 0);

  return (
    <div className="space-y-4">
      <PaymentSummary amount={150} />
      <div className="space-y-2">
        <FieldToggle label="Age range (decade)" checked={age} onChange={setAge} />
        <FieldToggle label="Diagnosis code category" checked={diagnosis} onChange={setDiagnosis} />
        <FieldToggle label="Lab value 1 (quartile)" checked={lab1} onChange={setLab1} />
        <FieldToggle label="Lab value 2 (quartile)" checked={lab2} onChange={setLab2} />
      </div>
      <p className="text-xs text-muted-foreground">
        You control exactly what is shared. Unchecked fields remain cryptographically hidden.
      </p>
      <Button className="w-full" onClick={() => onApprove(bitmask)}>
        Approve Selected Disclosure
      </Button>
    </div>
  );
}
