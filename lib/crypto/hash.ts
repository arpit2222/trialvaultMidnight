function toBytes(input: Uint8Array | string): Uint8Array {
  if (input instanceof Uint8Array) return input;
  return new TextEncoder().encode(input);
}

export async function sha256(input: Uint8Array | string): Promise<Uint8Array> {
  const data = toBytes(input);
  // Cast to ArrayBuffer — SubtleCrypto requires it; TextEncoder always produces one.
  const digest = await crypto.subtle.digest("SHA-256", data.buffer as ArrayBuffer);
  return new Uint8Array(digest);
}

export async function sha256Hex(input: Uint8Array | string): Promise<string> {
  const hash = await sha256(input);
  return Array.from(hash)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function merkleRootHex(leaves: Uint8Array[]): Promise<string> {
  if (leaves.length === 0) return "";
  let level = leaves.slice();
  while (level.length > 1) {
    const next: Uint8Array[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] ?? level[i];
      const combined = new Uint8Array([...left, ...right]);
      next.push(await sha256(combined));
    }
    level = next;
  }
  return Array.from(level[0])
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
