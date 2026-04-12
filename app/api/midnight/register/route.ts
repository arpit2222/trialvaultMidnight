/**
 * POST /api/midnight/register
 * Body: { userId: string (hex32), role: "pharma" | "patient" }
 */
import { type NextRequest, NextResponse } from "next/server";
import { pathToFileURL } from "node:url";
import * as path from "node:path";
import { getServerWallet, buildContractProviders, BUILD_DIR } from "@/lib/server/wallet";
import { nodeImport } from "@/lib/server/dynamic-import";

const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_ADDRESS ?? "";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as { userId?: string; role?: string };
  const { userId: userIdHex, role } = body;

  if (!userIdHex || userIdHex.length !== 64)
    return NextResponse.json({ error: "userId must be a 64-char hex string" }, { status: 400 });
  if (role !== "pharma" && role !== "patient")
    return NextResponse.json({ error: "role must be 'pharma' or 'patient'" }, { status: 400 });
  if (!REGISTRY_ADDRESS)
    return NextResponse.json({ error: "Registry contract not deployed" }, { status: 503 });

  try {
    const { findDeployedContract } = await nodeImport("@midnight-ntwrk/midnight-js-contracts") as any;
    const { CompiledContract } = await nodeImport("@midnight-ntwrk/compact-js") as any;

    const walletCtx = await getServerWallet();
    const ContractModule = await nodeImport(
      pathToFileURL(path.join(BUILD_DIR, "registry/contract/index.js")).href
    );

    const compiledContract = CompiledContract.make("registry", (ContractModule as any).Contract)
      .pipe(CompiledContract.withVacantWitnesses, CompiledContract.withCompiledFileAssets(path.join(BUILD_DIR, "registry")));

    const providers = await buildContractProviders("registry", "registry-state", walletCtx);
    const { callTx } = await findDeployedContract(providers, { compiledContract, contractAddress: REGISTRY_ADDRESS });

    const userId = hexToBytes(userIdHex);
    const fn = role === "pharma" ? (callTx as any).registerAsPharma : (callTx as any).registerAsPatient;
    await fn.call(callTx, userId);

    return NextResponse.json({ success: true, role, txSubmitted: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[/api/midnight/register]", msg);
    if (msg.includes("Already registered"))
      return NextResponse.json({ success: true, role, alreadyRegistered: true });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function hexToBytes(hex: string): Uint8Array {
  const b = new Uint8Array(32);
  for (let i = 0; i < 32; i++) b[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return b;
}
