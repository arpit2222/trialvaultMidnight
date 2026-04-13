"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HashCommitment } from "@/components/integrity/HashCommitment";
import { MerkleVerifier } from "@/components/integrity/MerkleVerifier";
import { PublicVerifyLink } from "@/components/integrity/PublicVerifyLink";
import { sha256Hex, merkleRootHex } from "@/lib/crypto/hash";
import { runTxStatus } from "@/lib/tx";

/**
 * PharmaResultsPage commits integrity hashes without exposing raw datasets.
 */
export default function PharmaResultsPage() {
  const params = useParams();
  const trialId = params.trialId as string;
  const [datasetRoot, setDatasetRoot] = useState<string | null>(null);
  const [resultsHash, setResultsHash] = useState<string | null>(null);
  const [verified, setVerified] = useState<"pending" | "verified" | "failed">("pending");

  async function handleDataset(file: File) {
    const text = await file.text();
    const leaves = text.split("\n").filter(Boolean).map((row) => new TextEncoder().encode(row));
    const root = await merkleRootHex(leaves);
    setDatasetRoot(root);
  }

  async function handleResults(file: File) {
    const buffer = await file.arrayBuffer();
    const hash = await sha256Hex(new Uint8Array(buffer));
    setResultsHash(hash);
  }

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/5 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Step 1: Commit Dataset Merkle Root</h2>
        <input type="file" accept="text/csv" onChange={(e) => e.target.files?.[0] && handleDataset(e.target.files[0])} />
        {datasetRoot && (
          <div className="space-y-2">
            <HashCommitment label="Dataset Merkle root" hash={datasetRoot} />
            <p className="text-xs text-muted-foreground">Tx hash: 0xabc...123 · Timestamp: 2026-04-10</p>
          </div>
        )}
        <Button variant="outline" onClick={() => void runTxStatus()}>Commit to Chain</Button>
      </Card>

      <Card className="border-white/10 bg-white/5 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Step 2: Publish Results</h2>
        <input type="file" accept="application/pdf" onChange={(e) => e.target.files?.[0] && handleResults(e.target.files[0])} />
        {resultsHash && (
          <div className="space-y-2">
            <HashCommitment label="Results hash" hash={resultsHash} />
            <p className="text-xs text-muted-foreground">Tx hash: 0xdef...456 · Timestamp: 2026-04-10</p>
          </div>
        )}
        <Button
          variant="outline"
          disabled={!datasetRoot}
          onClick={async () => {
            await runTxStatus();
            setVerified("verified");
          }}
        >
          Publish & Verify
        </Button>
        <MerkleVerifier status={verified} />
        <div className="text-sm text-muted-foreground">
          Public verification URL: <PublicVerifyLink trialId={trialId} />
        </div>
      </Card>
    </div>
  );
}
