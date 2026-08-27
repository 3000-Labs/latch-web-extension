import React, { useState } from 'react';
import './AuthGapWarning.css';

interface AuthGapWarningProps {
  risks: string[];
  recommendations: string[];
}

const AuthGapWarning: React.FC<AuthGapWarningProps> = ({ risks, recommendations }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <div className="auth-gap-warning">
      <div className="warning-header">
        <span className="warning-icon">⚠️</span>
        <h3>Security Warning</h3>
        <button className="btn-dismiss" onClick={() => setDismissed(true)}>
          ✕
        </button>
      </div>

      <div className="warning-body">
        <p>
          <strong>Self-management operations may not be fully protected.</strong>
        </p>
        <p>
          By default, adding/removing signers or policies needs only the 
          account's Default-rule threshold.
        </p>

        {risks.length > 0 && (
          <div className="risks">
            <h4>Risks:</h4>
            <ul>
              {risks.map((risk, i) => (
                <li key={i}>{risk}</li>
              ))}
            </ul>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="recommendations">
            <h4>Recommendations:</h4>
            <ul>
              {recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthGapWarning;
