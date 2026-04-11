export interface EligibilityProof {
  proof: string;
  nullifier: string;
  publicInputs: {
    trialId: bigint;
    protocolId: string;
  };
}

export interface DisclosureFields {
  age: boolean;
  diagnosis: boolean;
  lab1: boolean;
  lab2: boolean;
}

export interface DisclosureProof {
  proof: string;
  disclosed: Record<string, string | number>;
  licenseId: bigint;
  paymentAmount: bigint;
}
