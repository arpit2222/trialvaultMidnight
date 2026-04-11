import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { midnightTestnet } from "@/lib/midnight/chain";
import { contractAddresses, resultIntegrityAbi } from "@/lib/midnight/contracts";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trialId = searchParams.get("trialId");
  const resultsHash = searchParams.get("resultsHash");

  if (!trialId || !resultsHash) {
    return NextResponse.json({ error: "Missing trialId or resultsHash" }, { status: 400 });
  }

  try {
    const client = createPublicClient({
      chain: midnightTestnet,
      transport: http(process.env.NEXT_PUBLIC_MIDNIGHT_RPC_URL ?? "https://rpc.testnet.midnight.network"),
    });

    const verified = await client.readContract({
      address: contractAddresses.resultIntegrity as `0x${string}`,
      abi: resultIntegrityAbi,
      functionName: "verifyIntegrity",
      args: [BigInt(trialId), resultsHash as `0x${string}`],
    });

    return NextResponse.json({
      verified: Boolean(verified),
      protocolHash: "",
      datasetRoot: "",
      timestamp: Date.now(),
    });
  } catch (error) {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
