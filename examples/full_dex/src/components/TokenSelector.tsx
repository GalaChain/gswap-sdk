import React, { useState } from 'react';
import { tokens } from '../data/tokens';
import './TokenSelector.css';

interface TokenSelectorProps {
  selectedToken?: {
    collection: string;
    image: string;
  } | null;
  onSelectToken: (token: typeof tokens[0]) => void;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({ selectedToken, onSelectToken }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSelectToken = (token: typeof tokens[0]) => {
    onSelectToken(token);
    setIsOpen(false);
  };

  return (
    <div className="token-selector-container">
      <div className="token-selector" onClick={toggleDropdown}>
        {selectedToken ? (
          <>
            <img src={selectedToken.image} alt={selectedToken.collection} className="token-logo" />
            <span>{selectedToken.collection}</span>
          </>
        ) : (
          <span>Select token</span>
        )}
        <span className="dropdown-arrow">▼</span>
      </div>

      {isOpen && (
        <div className="token-dropdown">
          <div className="token-list">
            {tokens.map((token) => (
              <div
                key={token.collection}
                className="token-item"
                onClick={() => handleSelectToken(token)}
              >
                <img src={token.image} alt={token.collection} className="token-logo" />
                <span className="token-name">{token.collection}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenSelector;
