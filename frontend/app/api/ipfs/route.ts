import { NextResponse } from "next/server";
import pinataSDK from "@pinata/sdk";

export async function POST(request: Request) {
  try {
    const { ciphertext, filename } = (await request.json()) as {
      ciphertext?: string;
      filename?: string;
    };

    if (!ciphertext || !filename) {
      return NextResponse.json({ error: "Missing ciphertext or filename" }, { status: 400 });
    }

    const apiKey = process.env.PINATA_API_KEY ?? "";
    const secret = process.env.PINATA_SECRET_KEY ?? "";
    const gateway = process.env.PINATA_GATEWAY_URL ?? "https://gateway.pinata.cloud";

    const pinata = new pinataSDK(apiKey, secret);
    const result = await pinata.pinJSONToIPFS({ ciphertext, filename });

    return NextResponse.json({ cid: result.IpfsHash, gatewayUrl: `${gateway}/ipfs/${result.IpfsHash}` });
  } catch (error) {
    return NextResponse.json({ error: "IPFS upload failed" }, { status: 500 });
  }
}
