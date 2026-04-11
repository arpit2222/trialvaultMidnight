export async function retrieveEncryptedBlob(cid: string) {
  const gateway = process.env.PINATA_GATEWAY_URL ?? "https://gateway.pinata.cloud";
  const response = await fetch(`${gateway}/ipfs/${cid}`);
  if (!response.ok) {
    throw new Error("Failed to retrieve IPFS content");
  }
  return response.text();
}
