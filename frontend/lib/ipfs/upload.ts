import axios from "axios";

export async function uploadEncryptedBlob(params: {
  ciphertext: string;
  filename: string;
}) {
  const response = await axios.post("/api/ipfs", params);
  return response.data as { cid: string; gatewayUrl: string };
}
