/**
 * Account settings service for managing context rules, signers, and policies
 */

import { 
  AccountSettings, 
  ContextRule, 
  CreateRuleParams, 
  UpdateRuleParams,
  AddSignerParams,
  RemoveSignerParams,
  InstallPolicyParams,
  RemovePolicyParams,
  Signer,
  Policy
} from '../types/account';

class SettingsService {
  private contract: any; // SmartAccount contract reference
  private accountAddress: string;

  constructor(accountAddress: string, contract: any) {
    this.accountAddress = accountAddress;
    this.contract = contract;
  }

  /**
   * Fetch all account settings
   */
  async getAccountSettings(): Promise<AccountSettings> {
    // Fetch from contract
    const settings = await this.contract.getSettings(this.accountAddress);
    return settings;
  }

  /**
   * Get a specific context rule
   */
  async getContextRule(ruleId: string): Promise<ContextRule | null> {
    const settings = await this.getAccountSettings();
    return settings.contextRules.find(rule => rule.id === ruleId) || null;
  }

  /**
   * Create a new context rule
   */
  async createContextRule(params: CreateRuleParams): Promise<ContextRule> {
    // Validate inputs
    this.validateRuleParams(params);

    const rule = {
      id: this.generateId(),
      name: params.name,
      type: params.type,
      signers: params.signers,
      policies: [],
      threshold: params.threshold,
      expiry: params.expiry,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Call contract
    await this.contract.addContextRule(
      this.accountAddress,
      rule.name,
      this.encodeRulePolicies(rule),
      rule.threshold,
      rule.expiry
    );

    return rule;
  }

  /**
   * Update an existing context rule
   */
  async updateContextRule(params: UpdateRuleParams): Promise<ContextRule> {
    const rule = await this.getContextRule(params.id);
    if (!rule) {
      throw new Error('Rule not found');
    }

    const updatedRule: ContextRule = {
      ...rule,
      name: params.name || rule.name,
      expiry: params.expiry || rule.expiry,
      signers: params.signers || rule.signers,
      policies: params.policies || rule.policies,
      threshold: params.threshold || rule.threshold,
      updatedAt: Date.now(),
    };

    // Call contract
    await this.contract.updateContextRule(
      this.accountAddress,
      params.id,
      updatedRule.name,
      this.encodeRulePolicies(updatedRule),
      updatedRule.threshold,
      updatedRule.expiry
    );

    return updatedRule;
  }

  /**
   * Delete a context rule
   */
  async deleteContextRule(ruleId: string): Promise<void> {
    // Check if rule exists
    const rule = await this.getContextRule(ruleId);
    if (!rule) {
      throw new Error('Rule not found');
    }

    // Cannot delete default rule
    if (rule.type === 'default') {
      throw new Error('Cannot delete default rule');
    }

    await this.contract.removeContextRule(this.accountAddress, ruleId);
  }

  /**
   * Add a signer to a context rule
   */
  async addSigner(params: AddSignerParams): Promise<ContextRule> {
    const rule = await this.getContextRule(params.ruleId);
    if (!rule) {
      throw new Error('Rule not found');
    }

    // Check for duplicate signer
    if (rule.signers.some(s => s.address === params.address)) {
      throw new Error('Signer already exists');
    }

    const newSigner: Signer = {
      address: params.address,
      weight: params.weight,
      addedAt: Date.now(),
    };

    const updatedSigners = [...rule.signers, newSigner];

    return await this.updateContextRule({
      id: params.ruleId,
      signers: updatedSigners,
    });
  }

  /**
   * Remove a signer from a context rule
   */
  async removeSigner(params: RemoveSignerParams): Promise<ContextRule> {
    const rule = await this.getContextRule(params.ruleId);
    if (!rule) {
      throw new Error('Rule not found');
    }

    // Check if signer exists
    if (!rule.signers.some(s => s.address === params.address)) {
      throw new Error('Signer not found');
    }

    // Check if removing signer would leave rule without signers
    if (rule.signers.length <= 1) {
      throw new Error('Cannot remove last signer');
    }

    const updatedSigners = rule.signers.filter(s => s.address !== params.address);

    return await this.updateContextRule({
      id: params.ruleId,
      signers: updatedSigners,
    });
  }

  /**
   * Install a policy on a context rule
   */
  async installPolicy(params: InstallPolicyParams): Promise<ContextRule> {
    const rule = await this.getContextRule(params.ruleId);
    if (!rule) {
      throw new Error('Rule not found');
    }

    const newPolicy: Policy = {
      id: this.generateId(),
      name: params.policy.name,
      type: params.policy.type,
      params: params.policy.params,
      installedAt: Date.now(),
    };

    const updatedPolicies = [...rule.policies, newPolicy];

    return await this.updateContextRule({
      id: params.ruleId,
      policies: updatedPolicies,
    });
  }

  /**
   * Remove a policy from a context rule
   */
  async removePolicy(params: RemovePolicyParams): Promise<ContextRule> {
    const rule = await this.getContextRule(params.ruleId);
    if (!rule) {
      throw new Error('Rule not found');
    }

    // Check if policy exists
    if (!rule.policies.some(p => p.id === params.policyId)) {
      throw new Error('Policy not found');
    }

    const updatedPolicies = rule.policies.filter(p => p.id !== params.policyId);

    return await this.updateContextRule({
      id: params.ruleId,
      policies: updatedPolicies,
    });
  }

  /**
   * Check if an operation is safe (warns about signer/policy removal)
   */
  async checkOperationSafety(
    operation: 'remove_signer' | 'remove_policy' | 'loosen_threshold',
    details: any
  ): Promise<{ safe: boolean; warnings: string[] }> {
    const warnings: string[] = [];

    if (operation === 'remove_signer') {
      const rule = await this.getContextRule(details.ruleId);
      if (rule) {
        const remainingSigners = rule.signers.filter(s => s.address !== details.address);
        const totalWeight = remainingSigners.reduce((sum, s) => sum + s.weight, 0);
        
        if (totalWeight < rule.threshold) {
          warnings.push(
            '⚠️ Removing this signer will drop the rule below its threshold. ' +
            'This may lock the account out of this context.'
          );
        }
        if (remainingSigners.length === 0) {
          warnings.push(
            '⚠️ This will remove the last signer from this rule. ' +
            'You will not be able to authorize actions for this context.'
          );
        }
      }
    }

    if (operation === 'remove_policy') {
      warnings.push(
        '⚠️ Removing a policy may change the behavior of this context rule.'
      );
    }

    if (operation === 'loosen_threshold') {
      warnings.push(
        '⚠️ Lowering the threshold may make this rule easier to authorize. ' +
        'Consider the security implications.'
      );
    }

    return {
      safe: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Get auth gap information (self-management risks)
   */
  async getAuthGapInfo(): Promise<{
    hasCustomRule: boolean;
    risks: string[];
    recommendations: string[];
  }> {
    const settings = await this.getAccountSettings();
    const risks: string[] = [];
    const recommendations: string[] = [];

    // Check if default rule is the only one
    if (settings.contextRules.length === 1) {
      risks.push(
        '⚠️ Only the Default rule exists. Adding/removing signers or policies ' +
        'requires only the Default-rule threshold.'
      );
      recommendations.push(
        '💡 Consider installing a CallContract(self_address) rule to require ' +
        'a higher threshold for sensitive operations.'
      );
    }

    // Check for custom CallContract rule
    const hasCustomRule = settings.contextRules.some(
      rule => rule.type === 'call_contract'
    );

    if (!hasCustomRule) {
      recommendations.push(
        '💡 Install a CallContract rule with a higher threshold for ' +
        'self-management operations.'
      );
    }

    return {
      hasCustomRule,
      risks,
      recommendations,
    };
  }

  /**
   * Validate rule creation parameters
   */
  private validateRuleParams(params: CreateRuleParams): void {
    if (!params.name || params.name.length === 0) {
      throw new Error('Rule name is required');
    }
    if (!params.signers || params.signers.length === 0) {
      throw new Error('At least one signer is required');
    }
    if (params.threshold <= 0) {
      throw new Error('Threshold must be greater than 0');
    }
    if (params.threshold > params.signers.reduce((sum, s) => sum + s.weight, 0)) {
      throw new Error('Threshold exceeds total signer weight');
    }
    if (params.expiry <= Date.now()) {
      throw new Error('Expiry must be in the future');
    }
  }

  /**
   * Encode policies for contract call
   */
  private encodeRulePolicies(rule: ContextRule): any {
    // This depends on latch-contracts#45 encoding format
    // Placeholder implementation
    return {
      policies: rule.policies.map(p => ({
        name: p.name,
        type: p.type,
        params: p.params,
      })),
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default SettingsService;
