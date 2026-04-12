/**
 * GET /api/verify?trialId=<id>&resultsHash=<hex>
 * Verifies result integrity via resultIntegrity.compact on Midnight indexer.
 */
import { NextResponse } from "next/server";
import { pathToFileURL } from "node:url";
import * as path from "node:path";
import { BUILD_DIR, INDEXER_HTTP, INDEXER_WS } from "@/lib/server/wallet";
import { nodeImport } from "@/lib/server/dynamic-import";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_RESULT_INTEGRITY_CONTRACT_ADDRESS ?? "";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trialId = searchParams.get("trialId");
  const resultsHash = searchParams.get("resultsHash");

  if (!trialId || !resultsHash)
    return NextResponse.json({ error: "Missing trialId or resultsHash" }, { status: 400 });
  if (!CONTRACT_ADDRESS)
    return NextResponse.json({ verified: false, source: "no-contract" });

  try {
    const { WebSocket } = await nodeImport<typeof import("ws")>("ws");
    (globalThis as Record<string, unknown>).WebSocket = WebSocket;

    const { firstValueFrom } = await nodeImport<typeof import("rxjs")>("rxjs");
    const { indexerPublicDataProvider } = await nodeImport("@midnight-ntwrk/midnight-js-indexer-public-data-provider") as any;

    const provider = indexerPublicDataProvider(INDEXER_HTTP, INDEXER_WS);
    const contractState = await firstValueFrom(
      provider.contractStateObservable(CONTRACT_ADDRESS, { type: "all" }),
      { defaultValue: null },
    );
    if (!contractState) return NextResponse.json({ verified: false, source: "state-not-found" });

    const { ledger } = await nodeImport(
      pathToFileURL(path.join(BUILD_DIR, "result_integrity/contract/index.js")).href
    ) as any;
    const L = ledger((contractState as any)?.data ?? contractState);
    const id = BigInt(trialId);
    const verified = Boolean(L.verified?.member(id));
    let protocolHash: string | null = null;
    if (L.protocolHashes?.member(id)) {
      protocolHash = Array.from(L.protocolHashes.lookup(id) as Uint8Array)
        .map((b: number) => b.toString(16).padStart(2, "0")).join("");
    }

    return NextResponse.json({ verified, protocolHash: protocolHash ?? "", datasetRoot: "", timestamp: Date.now(), source: "on-chain" });
  } catch (error) {
    console.error("[/api/verify]", error);
    return NextResponse.json({ error: "Verification failed", verified: false }, { status: 500 });
  }
}
