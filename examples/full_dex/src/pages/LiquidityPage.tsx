import React from 'react';
import './LiquidityPage.css';

const LiquidityPage: React.FC = () => {
  return (
    <div className="liquidity-page">
      <div className="liquidity-container">
        <div className="liquidity-header">
          <button className="back-btn">←</button>
          <h2>Add Liquidity</h2>
          <button className="settings-btn">⚙️</button>
        </div>

        <div className="pair-selection">
          <h3>Select pair</h3>
          <div className="token-pair">
            <div className="token-selector">
              <img
                src="https://cryptologos.cc/logos/gala-gala-logo.png"
                alt="GALA"
                className="token-logo"
              />
              <span>GALA</span>
              <span className="dropdown-arrow">▼</span>
            </div>
            <div className="pair-arrow">⇄</div>
            <div className="token-selector">
              <img
                src="https://cryptologos.cc/logos/silk-silk-logo.png"
                alt="SILK"
                className="token-logo"
              />
              <span>SILK</span>
              <span className="dropdown-arrow">▼</span>
            </div>
          </div>
        </div>

        <div className="fee-tiers">
          <h3>Fee Tier</h3>
          <div className="fee-options">
            <div className="fee-option">
              <div className="fee-rate">0.05%</div>
              <div className="fee-select">0% select</div>
            </div>
            <div className="fee-option">
              <div className="fee-rate">0.30%</div>
              <div className="fee-select">0% select</div>
            </div>
            <div className="fee-option active">
              <div className="fee-rate">1.00%</div>
              <div className="fee-select">
                <span className="best-fee">⭐ Best Fee Tier</span>
                <br />
                0% select
              </div>
            </div>
          </div>
        </div>

        <div className="price-range">
          <div className="range-header">
            <h3>Set price range</h3>
            <div className="range-tabs">
              <button className="range-tab">Full range</button>
              <button className="range-tab active">GALA</button>
              <button className="range-tab">SILK</button>
            </div>
          </div>

          <div className="price-inputs">
            <div className="price-input">
              <label>Low price</label>
              <input type="number" placeholder="0" />
              <div className="price-label">SILK per GALA</div>
            </div>
            <div className="price-input">
              <label>High price</label>
              <input type="number" placeholder="∞" />
              <div className="price-label">SILK per GALA</div>
            </div>
          </div>

          <div className="current-price">
            <h4>Current price</h4>
            <div className="price-value">0.028707610813829</div>
            <div className="price-label">SILK per GALA</div>
          </div>
        </div>

        <div className="deposit-amounts">
          <h3>Deposit amount</h3>
          <div className="amount-input">
            <input type="number" placeholder="0" />
            <div className="token-info">
              <img
                src="https://cryptologos.cc/logos/gala-gala-logo.png"
                alt="GALA"
                className="token-logo"
              />
              <span>GALA</span>
            </div>
            <div className="balance">Balance: 22012.5</div>
          </div>
          <div className="amount-input">
            <input type="number" placeholder="0" />
            <div className="token-info">
              <img
                src="https://cryptologos.cc/logos/silk-silk-logo.png"
                alt="SILK"
                className="token-logo"
              />
              <span>SILK</span>
            </div>
            <div className="balance">Balance: 500</div>
          </div>
        </div>

        <button className="add-liquidity-button" disabled>
          Please enter deposit amounts
        </button>
      </div>
    </div>
  );
};

export default LiquidityPage;
