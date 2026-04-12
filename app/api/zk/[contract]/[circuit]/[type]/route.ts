import { type NextRequest, NextResponse } from "next/server";
import * as fs from "node:fs";
import * as path from "node:path";

const BUILD_DIR = path.resolve(process.cwd(), "contracts/build");

const CONTRACT_DIRS: Record<string, string> = {
  registry: "registry",
  trialMatcher: "trial_matcher",
  patientVault: "patient_vault",
  licenseMarket: "license_market",
  resultIntegrity: "result_integrity",
  eventReporter: "event_reporter",
  tvaultToken: "tvault_token",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { contract: string; circuit: string; type: string } },
): Promise<NextResponse> {
  const { contract, circuit, type } = params;

  const contractDir = CONTRACT_DIRS[contract];
  if (!contractDir) {
    return NextResponse.json({ error: `Unknown contract: ${contract}` }, { status: 404 });
  }

  // Sanitise inputs — only allow alphanum + underscore
  if (!/^[\w]+$/.test(circuit)) {
    return NextResponse.json({ error: "Invalid circuit id" }, { status: 400 });
  }

  let filePath: string;
  if (type === "zkir") {
    filePath = path.join(BUILD_DIR, contractDir, "zkir", `${circuit}.zkir`);
  } else if (type === "prover") {
    filePath = path.join(BUILD_DIR, contractDir, "keys", `${circuit}.prover`);
  } else if (type === "verifier") {
    filePath = path.join(BUILD_DIR, contractDir, "keys", `${circuit}.verifier`);
  } else {
    return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
  }

  // Prevent path traversal
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(BUILD_DIR)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: `Not found: ${path.basename(filePath)}` }, { status: 404 });
  }

  const buf = fs.readFileSync(filePath);
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
