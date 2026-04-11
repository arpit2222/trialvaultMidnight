import Link from "next/link";

/**
 * PublicVerifyLink shares public verification without exposing private data.
 */
export function PublicVerifyLink({ trialId }: { trialId: string }) {
  return (
    <Link
      href={`/verify/${trialId}`}
      className="text-sm text-brand-mint underline-offset-4 hover:underline"
    >
      trialvault.xyz/verify/{trialId}
    </Link>
  );
}
