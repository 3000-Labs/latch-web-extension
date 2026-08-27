import React, { useState, useEffect } from 'react';
import { AccountSettings as AccountSettingsType, ContextRule } from '../../types/account';
import SettingsService from '../../services/settingsService';
import ContextRuleList from './ContextRuleList';
import AuthGapWarning from './AuthGapWarning';
import './AccountSettings.css';

interface AccountSettingsProps {
  accountAddress: string;
  contract: any;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ accountAddress, contract }) => {
  const [settings, setSettings] = useState<AccountSettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRule, setSelectedRule] = useState<ContextRule | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [authGap, setAuthGap] = useState<any>(null);

  const settingsService = new SettingsService(accountAddress, contract);

  useEffect(() => {
    loadSettings();
  }, [accountAddress]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsService.getAccountSettings();
      setSettings(data);
      const gap = await settingsService.getAuthGapInfo();
      setAuthGap(gap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleRuleUpdate = async (updatedRule: ContextRule) => {
    try {
      setLoading(true);
      await settingsService.updateContextRule({
        id: updatedRule.id,
        name: updatedRule.name,
        expiry: updatedRule.expiry,
        signers: updatedRule.signers,
        policies: updatedRule.policies,
        threshold: updatedRule.threshold,
      });
      await loadSettings();
      setSelectedRule(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update rule');
    } finally {
      setLoading(false);
    }
  };

  const handleRuleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) {
      return;
    }
    try {
      setLoading(true);
      await settingsService.deleteContextRule(ruleId);
      await loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete rule');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading account settings...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!settings) {
    return <div className="empty">No settings found</div>;
  }

  return (
    <div className="account-settings">
      <header className="settings-header">
        <h1>Account Settings</h1>
        <div className="account-info">
          <span className="address">{accountAddress}</span>
          <span className="status">
            {settings.isInitialized ? '✅ Active' : '⚠️ Not initialized'}
          </span>
        </div>
      </header>

      {authGap && authGap.risks.length > 0 && (
        <AuthGapWarning risks={authGap.risks} recommendations={authGap.recommendations} />
      )}

      <section className="rules-section">
        <div className="section-header">
          <h2>Context Rules</h2>
          <button
            className="btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            + New Rule
          </button>
        </div>

        <ContextRuleList
          rules={settings.contextRules}
          selectedRule={selectedRule}
          onSelectRule={setSelectedRule}
          onUpdateRule={handleRuleUpdate}
          onDeleteRule={handleRuleDelete}
        />

        {selectedRule && (
          <ContextRuleDetail
            rule={selectedRule}
            onUpdate={handleRuleUpdate}
            onClose={() => setSelectedRule(null)}
          />
        )}
      </section>
    </div>
  );
};

export default AccountSettings;
