import { Badge } from "@/components/ui/badge";
import type { PatientWitnesses } from "@/types/patient";

/**
 * WitnessManager shows witness availability without exposing values.
 */
export function WitnessManager({ witnesses }: { witnesses: PatientWitnesses }) {
  const items = [
    { label: "Age", value: witnesses.age },
    { label: "Diagnosis", value: witnesses.diagnosisCode },
    { label: "Lab 1", value: witnesses.labValue1 },
    { label: "Lab 2", value: witnesses.labValue2 },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge key={item.label} variant={item.value !== null ? "default" : "secondary"}>
          {item.label} {item.value !== null ? "✓" : "—"}
        </Badge>
      ))}
    </div>
  );
}
