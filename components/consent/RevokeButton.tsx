"use client";

import { Button } from "@/components/ui/button";

/**
 * RevokeButton triggers consent revocation without exposing identities.
 */
export function RevokeButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="destructive" onClick={onClick}>
      Revoke Consent
    </Button>
  );
}
