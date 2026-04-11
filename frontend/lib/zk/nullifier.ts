import { sha256Hex } from "@/lib/crypto/hash";

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

export async function generateNullifier(
  nullifierSecret: Uint8Array,
  protocolId: string
): Promise<string> {
  const protocolBytes = new TextEncoder().encode(protocolId);
  const combined = concatBytes(nullifierSecret, protocolBytes);
  return sha256Hex(combined);
}
