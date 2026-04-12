/**
 * GET /api/midnight/role?userId=<hex32>
 * Returns { role: 0|1|2 } from registry.compact ledger via Midnight indexer.
 */
import { type NextRequest, NextResponse } from "next/server";
import { pathToFileURL } from "node:url";
import * as path from "node:path";
import { BUILD_DIR, INDEXER_HTTP, INDEXER_WS } from "@/lib/server/wallet";
import { nodeImport } from "@/lib/server/dynamic-import";

const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_ADDRESS ?? "";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const userIdHex = req.nextUrl.searchParams.get("userId");
  if (!userIdHex || userIdHex.length !== 64)
    return NextResponse.json({ error: "userId must be a 64-char hex string" }, { status: 400 });
  if (!REGISTRY_ADDRESS)
    return NextResponse.json({ role: 0, source: "no-contract" });

  try {
    const { WebSocket } = await nodeImport<typeof import("ws")>("ws");
    (globalThis as Record<string, unknown>).WebSocket = WebSocket;

    const { firstValueFrom } = await nodeImport<typeof import("rxjs")>("rxjs");
    const { indexerPublicDataProvider } = await nodeImport("@midnight-ntwrk/midnight-js-indexer-public-data-provider") as any;

    const provider = indexerPublicDataProvider(INDEXER_HTTP, INDEXER_WS);
    const contractState = await firstValueFrom(
      provider.contractStateObservable(REGISTRY_ADDRESS, { type: "all" }),
      { defaultValue: null },
    );
    if (!contractState) return NextResponse.json({ role: 0, source: "state-not-found" });

    const { ledger } = await nodeImport(
      pathToFileURL(path.join(BUILD_DIR, "registry/contract/index.js")).href
    ) as any;
    const L = ledger((contractState as any)?.data ?? contractState);
    const uid = hexToBytes(userIdHex);
    const role = L.roles?.member(uid) ? Number(L.roles.lookup(uid)) : 0;

    return NextResponse.json({ role, source: "on-chain" });
  } catch (err) {
    console.error("[/api/midnight/role]", err);
    return NextResponse.json({ role: 0, source: "error", error: String(err) });
  }
}

function hexToBytes(hex: string): Uint8Array {
  const b = new Uint8Array(32);
  for (let i = 0; i < 32; i++) b[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return b;
}
