import type { ContractAddresses } from "@/types/contracts";

export const contractAddresses: ContractAddresses = {
  registry: process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_ADDRESS ?? "",
  patientVault: process.env.NEXT_PUBLIC_PATIENT_VAULT_CONTRACT_ADDRESS ?? "",
  trialMatcher: process.env.NEXT_PUBLIC_TRIAL_MATCHER_CONTRACT_ADDRESS ?? "",
  licenseMarket: process.env.NEXT_PUBLIC_LICENSE_MARKET_CONTRACT_ADDRESS ?? "",
  resultIntegrity: process.env.NEXT_PUBLIC_RESULT_INTEGRITY_CONTRACT_ADDRESS ?? "",
  eventReporter: process.env.NEXT_PUBLIC_EVENT_REPORTER_CONTRACT_ADDRESS ?? "",
  tvaultToken: process.env.NEXT_PUBLIC_TVAULT_TOKEN_ADDRESS ?? "",
};

export const registryAbi = [
  { type: "function", name: "registerAsPharma", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "registerAsPatient", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "getRole", stateMutability: "view", inputs: [{ name: "addr", type: "address" }], outputs: [{ type: "uint8" }] },
] as const;

export const trialMatcherAbi = [
  {
    type: "function",
    name: "createTrial",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "bytes32" },
      { name: "protocolHash", type: "bytes32" },
      { name: "minAge", type: "uint8" },
      { name: "maxAge", type: "uint8" },
      { name: "diagnosisCode", type: "uint16" },
      { name: "labMin1", type: "uint32" },
      { name: "labMax1", type: "uint32" },
    ],
    outputs: [{ type: "uint64" }],
  },
  {
    type: "function",
    name: "proveEligibility",
    stateMutability: "nonpayable",
    inputs: [
      { name: "trialId", type: "uint64" },
      { name: "protocolId", type: "bytes32" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "getEligibleCount",
    stateMutability: "view",
    inputs: [{ name: "trialId", type: "uint64" }],
    outputs: [{ type: "uint32" }],
  },
] as const;

export const patientVaultAbi = [
  {
    type: "function",
    name: "registerVault",
    stateMutability: "nonpayable",
    inputs: [{ name: "ipfsCidHash", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "issueConsentToken",
    stateMutability: "nonpayable",
    inputs: [
      { name: "trialId", type: "uint64" },
      { name: "nullifier", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "revokeConsent",
    stateMutability: "nonpayable",
    inputs: [{ name: "trialId", type: "uint64" }],
    outputs: [],
  },
  {
    type: "function",
    name: "isNullifierUsed",
    stateMutability: "view",
    inputs: [{ name: "nullifier", type: "bytes32" }],
    outputs: [{ type: "bool" }],
  },
] as const;

export const licenseMarketAbi = [
  {
    type: "function",
    name: "requestLicense",
    stateMutability: "nonpayable",
    inputs: [
      { name: "patientNullifier", type: "bytes32" },
      { name: "fields", type: "uint8" },
      { name: "paymentAmount", type: "uint128" },
    ],
    outputs: [{ type: "uint64" }],
  },
  {
    type: "function",
    name: "fulfillLicense",
    stateMutability: "nonpayable",
    inputs: [
      { name: "licenseId", type: "uint64" },
      { name: "disclosureProof", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "revokeActiveLicense",
    stateMutability: "nonpayable",
    inputs: [{ name: "licenseId", type: "uint64" }],
    outputs: [],
  },
] as const;

export const resultIntegrityAbi = [
  {
    type: "function",
    name: "commitProtocol",
    stateMutability: "nonpayable",
    inputs: [
      { name: "trialId", type: "uint64" },
      { name: "protocolHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "commitDataset",
    stateMutability: "nonpayable",
    inputs: [
      { name: "trialId", type: "uint64" },
      { name: "merkleRoot", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "publishResults",
    stateMutability: "nonpayable",
    inputs: [
      { name: "trialId", type: "uint64" },
      { name: "resultsHash", type: "bytes32" },
      { name: "merkleProof", type: "bytes" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "verifyIntegrity",
    stateMutability: "view",
    inputs: [
      { name: "trialId", type: "uint64" },
      { name: "resultsHash", type: "bytes32" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

export const eventReporterAbi = [
  {
    type: "function",
    name: "submitEvent",
    stateMutability: "nonpayable",
    inputs: [
      { name: "trialId", type: "uint64" },
      { name: "eventCode", type: "uint8" },
      { name: "severity", type: "uint8" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "checkThreshold",
    stateMutability: "view",
    inputs: [{ name: "trialId", type: "uint64" }],
    outputs: [{ type: "bool" }],
  },
] as const;

export const tvaultTokenAbi = [
  { type: "function", name: "mint", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint128" }], outputs: [] },
  { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint128" }], outputs: [] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint128" }], outputs: [] },
  { type: "function", name: "transferFrom", stateMutability: "nonpayable", inputs: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "amount", type: "uint128" }], outputs: [] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "addr", type: "address" }], outputs: [{ type: "uint128" }] },
] as const;
