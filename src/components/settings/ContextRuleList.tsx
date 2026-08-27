import React from 'react';
import { ContextRule } from '../../types/account';
import './ContextRuleList.css';

interface ContextRuleListProps {
  rules: ContextRule[];
  selectedRule: ContextRule | null;
  onSelectRule: (rule: ContextRule) => void;
  onUpdateRule: (rule: ContextRule) => void;
  onDeleteRule: (ruleId: string) => void;
}

const ContextRuleList: React.FC<ContextRuleListProps> = ({
  rules,
  selectedRule,
  onSelectRule,
  onUpdateRule,
  onDeleteRule,
}) => {
  const getRuleStatus = (rule: ContextRule): { status: string; color: string } => {
    const now = Date.now();
    if (rule.expiry < now) {
      return { status: 'Expired', color: 'red' };
    }
    if (rule.expiry < now + 7 * 24 * 60 * 60 * 1000) {
      return { status: 'Expiring Soon', color: 'yellow' };
    }
    return { status: 'Active', color: 'green' };
  };

  const getSignerCount = (rule: ContextRule): string => {
    return `${rule.signers.length} signer${rule.signers.length !== 1 ? 's' : ''}`;
  };

  const getPolicyCount = (rule: ContextRule): string => {
    return `${rule.policies.length} polic${rule.policies.length !== 1 ? 'ies' : 'y'}`;
  };

  return (
    <div className="context-rule-list">
      {rules.map((rule) => {
        const status = getRuleStatus(rule);
        const isSelected = selectedRule?.id === rule.id;

        return (
          <div
            key={rule.id}
            className={`rule-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelectRule(rule)}
          >
            <div className="rule-header">
              <h3>{rule.name}</h3>
              <span className={`status-badge ${status.color}`}>
                {status.status}
              </span>
            </div>

            <div className="rule-details">
              <span className="rule-type">{rule.type}</span>
              <span className="rule-meta">
                {getSignerCount(rule)} • {getPolicyCount(rule)}
              </span>
              <span className="rule-threshold">
                Threshold: {rule.threshold}
              </span>
            </div>

            <div className="rule-actions">
              <button
                className="btn-edit"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRule(rule);
                }}
              >
                Edit
              </button>
              {rule.type !== 'default' && (
                <button
                  className="btn-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete rule "${rule.name}"?`)) {
                      onDeleteRule(rule.id);
                    }
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ContextRuleList;
