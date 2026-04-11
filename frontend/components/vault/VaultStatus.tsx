import { Badge } from "@/components/ui/badge";

/**
 * VaultStatus signals data locality to reassure patients.
 */
export function VaultStatus({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? "default" : "secondary"}>
      {active ? "Vault Active — Data on Device Only" : "Vault Empty"}
    </Badge>
  );
}
