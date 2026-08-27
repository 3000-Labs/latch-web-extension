/**
 * Account settings types for the Latch web extension
 */

export interface Signer {
  address: string;
  weight: number;
  addedAt: number;
}

export interface Policy {
  id: string;
  name: string;
  type: string;
  params: Record<string, any>;
  installedAt: number;
}

export interface ContextRule {
  id: string;
  name: string;
  type: 'call_contract' | 'transfer' | 'default';
  signers: Signer[];
  policies: Policy[];
  threshold: number;
  expiry: number;
  createdAt: number;
  updatedAt: number;
}

export interface AccountSettings {
  address: string;
  contextRules: ContextRule[];
  defaultRule: ContextRule;
  isInitialized: boolean;
}

export interface CreateRuleParams {
  name: string;
  type: ContextRule['type'];
  signers: Signer[];
  threshold: number;
  expiry: number;
}

export interface UpdateRuleParams {
  id: string;
  name?: string;
  expiry?: number;
  signers?: Signer[];
  policies?: Policy[];
  threshold?: number;
}

export interface AddSignerParams {
  ruleId: string;
  address: string;
  weight: number;
}

export interface RemoveSignerParams {
  ruleId: string;
  address: string;
}

export interface InstallPolicyParams {
  ruleId: string;
  policy: Omit<Policy, 'id' | 'installedAt'>;
}

export interface RemovePolicyParams {
  ruleId: string;
  policyId: string;
}
