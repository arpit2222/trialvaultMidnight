/**
 * GET /api/midnight/state?contract=<key>&query=<type>&params=<json>
 * Generic read endpoint for on-chain contract state via Midnight indexer.
 */
import { type NextRequest, NextResponse } from "next/server";
import { pathToFileURL } from "node:url";
import * as path from "node:path";
import { BUILD_DIR, INDEXER_HTTP, INDEXER_WS } from "@/lib/server/wallet";
import { nodeImport } from "@/lib/server/dynamic-import";

const CONTRACT_META: Record<string, { dir: string; envKey: string }> = {
  registry:        { dir: "registry",         envKey: "NEXT_PUBLIC_REGISTRY_CONTRACT_ADDRESS" },
  trialMatcher:    { dir: "trial_matcher",     envKey: "NEXT_PUBLIC_TRIAL_MATCHER_CONTRACT_ADDRESS" },
  patientVault:    { dir: "patient_vault",     envKey: "NEXT_PUBLIC_PATIENT_VAULT_CONTRACT_ADDRESS" },
  licenseMarket:   { dir: "license_market",    envKey: "NEXT_PUBLIC_LICENSE_MARKET_CONTRACT_ADDRESS" },
  resultIntegrity: { dir: "result_integrity",  envKey: "NEXT_PUBLIC_RESULT_INTEGRITY_CONTRACT_ADDRESS" },
  eventReporter:   { dir: "event_reporter",    envKey: "NEXT_PUBLIC_EVENT_REPORTER_CONTRACT_ADDRESS" },
  tvaultToken:     { dir: "tvault_token",      envKey: "NEXT_PUBLIC_TVAULT_TOKEN_ADDRESS" },
};

export async function GET(req: NextRequest): Promise<NextResponse> {
  const contractKey = req.nextUrl.searchParams.get("contract") ?? "";
  const query = req.nextUrl.searchParams.get("query") ?? "";
  const paramsRaw = req.nextUrl.searchParams.get("params") ?? "{}";

  const meta = CONTRACT_META[contractKey];
  if (!meta) return NextResponse.json({ error: `Unknown contract: ${contractKey}` }, { status: 400 });

  const contractAddress = process.env[meta.envKey] ?? "";
  if (!contractAddress) return NextResponse.json({ error: "Contract not deployed", result: null });

  let params: Record<string, unknown> = {};
  try { params = JSON.parse(paramsRaw); }
  catch { return NextResponse.json({ error: "Invalid params JSON" }, { status: 400 }); }

  try {
    const { WebSocket } = await nodeImport<typeof import("ws")>("ws");
    (globalThis as Record<string, unknown>).WebSocket = WebSocket;

    const { firstValueFrom } = await nodeImport<typeof import("rxjs")>("rxjs");
    const { indexerPublicDataProvider } = await nodeImport("@midnight-ntwrk/midnight-js-indexer-public-data-provider") as any;

    const provider = indexerPublicDataProvider(INDEXER_HTTP, INDEXER_WS);
    const contractState = await firstValueFrom(
      provider.contractStateObservable(contractAddress, { type: "all" }),
      { defaultValue: null },
    );
    if (!contractState) return NextResponse.json({ result: null, source: "state-not-found" });

    const { ledger } = await nodeImport(
      pathToFileURL(path.join(BUILD_DIR, meta.dir, "contract/index.js")).href
    ) as any;
    const L = ledger((contractState as any)?.data ?? contractState);
    return NextResponse.json({ result: resolveQuery(L, query, params), source: "on-chain" });
  } catch (err) {
    console.error("[/api/midnight/state]", err);
    return NextResponse.json({ result: null, error: String(err) }, { status: 500 });
  }
}

function bigIntReplacer(_: string, v: unknown) { return typeof v === "bigint" ? v.toString() : v; }

function resolveQuery(L: any, query: string, params: Record<string, unknown>): unknown {
  const hb = (h: string) => { const b = new Uint8Array(32); const c = h.replace(/^0x/,""); for(let i=0;i<Math.min(32,c.length/2);i++) b[i]=parseInt(c.slice(i*2,i*2+2),16); return b; };
  const bh = (b: Uint8Array) => Array.from(b).map(x=>x.toString(16).padStart(2,"0")).join("");
  switch (query) {
    case "pharmaCount": return String(L.pharmaCount ?? 0n);
    case "patientCount": return String(L.patientCount ?? 0n);
    case "role": { const u=hb(String(params.userId??""));return L.roles?.member(u)?String(L.roles.lookup(u)):"0"; }
    case "nextTrialId": return String(L.nextTrialId ?? 0n);
    case "eligibleCount": { const id=BigInt(String(params.trialId??0));return L.eligibleCounts?.member(id)?String(L.eligibleCounts.lookup(id).read()):"0"; }
    case "allTrials": { const t:unknown[]=[]; if(L.trials)for(const[id,tr]of L.trials)t.push({id:String(id),protocolHash:bh(tr.protocolHash),minAge:String(tr.minAge),maxAge:String(tr.maxAge),diagnosisCode:String(tr.diagnosisCode)}); return t; }
    case "isVerified": { const id=BigInt(String(params.trialId??0));return Boolean(L.verified?.member(id)); }
    case "protocolHash": { const id=BigInt(String(params.trialId??0));return L.protocolHashes?.member(id)?bh(L.protocolHashes.lookup(id)):null; }
    case "eventCount": { const id=BigInt(String(params.trialId??0));return L.eventCounts?.member(id)?String(L.eventCounts.lookup(id).read()):"0"; }
    case "isAlerted": { const id=BigInt(String(params.trialId??0));return Boolean(L.alertsFired?.member(id)); }
    case "balance": { const u=hb(String(params.userId??""));return L.balances?.member(u)?String(L.balances.lookup(u)):"0"; }
    case "totalMinted": return String(L.totalMinted ?? 0n);
    default: return JSON.parse(JSON.stringify(L, bigIntReplacer));
  }
}
