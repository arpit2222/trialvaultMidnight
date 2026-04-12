/**
 * POST /api/midnight/trial
 * Body: { protocolHash, minAge, maxAge, diagnosisCode }
 */
import { type NextRequest, NextResponse } from "next/server";
import { pathToFileURL } from "node:url";
import * as path from "node:path";
import { getServerWallet, buildContractProviders, BUILD_DIR } from "@/lib/server/wallet";
import { nodeImport } from "@/lib/server/dynamic-import";

const TRIAL_MATCHER_ADDRESS = process.env.NEXT_PUBLIC_TRIAL_MATCHER_CONTRACT_ADDRESS ?? "";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as { protocolHash?: string; minAge?: number; maxAge?: number; diagnosisCode?: number };
  const { protocolHash, minAge, maxAge, diagnosisCode } = body;

  if (!protocolHash || protocolHash.length !== 64)
    return NextResponse.json({ error: "protocolHash must be a 64-char hex string" }, { status: 400 });
  if (minAge == null || maxAge == null || diagnosisCode == null)
    return NextResponse.json({ error: "minAge, maxAge, diagnosisCode required" }, { status: 400 });
  if (!TRIAL_MATCHER_ADDRESS)
    return NextResponse.json({ error: "TrialMatcher contract not deployed" }, { status: 503 });

  try {
    const { findDeployedContract } = await nodeImport("@midnight-ntwrk/midnight-js-contracts") as any;
    const { CompiledContract } = await nodeImport("@midnight-ntwrk/compact-js") as any;

    const walletCtx = await getServerWallet();
    const ContractModule = await nodeImport(
      pathToFileURL(path.join(BUILD_DIR, "trial_matcher/contract/index.js")).href
    ) as any;

    const compiledContract = CompiledContract.make("trialMatcher", ContractModule.Contract)
      .pipe(
        CompiledContract.withWitnesses({
          getPatientAge:       () => [0n, 0n],
          getPatientDiagnosis: () => [0n, 0n],
        }),
        CompiledContract.withCompiledFileAssets(path.join(BUILD_DIR, "trial_matcher")),
      );

    const providers = await buildContractProviders("trial_matcher", "trial_matcher-state", walletCtx);
    const { callTx } = await findDeployedContract(providers, { compiledContract, contractAddress: TRIAL_MATCHER_ADDRESS });

    const phBytes = hexToBytes(protocolHash);
    const tx = await (callTx as any).createTrial(phBytes, BigInt(minAge), BigInt(maxAge), BigInt(diagnosisCode));
    const trialId = (tx as any)?.callTxData?.public?.result ?? "unknown";

    return NextResponse.json({ success: true, trialId: String(trialId) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[/api/midnight/trial]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function hexToBytes(hex: string): Uint8Array {
  const b = new Uint8Array(32);
  for (let i = 0; i < 32; i++) b[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return b;
}
