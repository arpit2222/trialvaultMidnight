import type { ContractAddresses } from "@/types/contracts";

/**
 * On-chain Midnight Compact contract addresses (from .env.local).
 * These are not EVM addresses — they are Midnight contract identifiers.
 */
export const contractAddresses: ContractAddresses = {
  registry: process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_ADDRESS ?? "",
  patientVault: process.env.NEXT_PUBLIC_PATIENT_VAULT_CONTRACT_ADDRESS ?? "",
  trialMatcher: process.env.NEXT_PUBLIC_TRIAL_MATCHER_CONTRACT_ADDRESS ?? "",
  licenseMarket: process.env.NEXT_PUBLIC_LICENSE_MARKET_CONTRACT_ADDRESS ?? "",
  resultIntegrity: process.env.NEXT_PUBLIC_RESULT_INTEGRITY_CONTRACT_ADDRESS ?? "",
  eventReporter: process.env.NEXT_PUBLIC_EVENT_REPORTER_CONTRACT_ADDRESS ?? "",
  tvaultToken: process.env.NEXT_PUBLIC_TVAULT_TOKEN_ADDRESS ?? "",
};
