import { FEE_TIER, GSwap } from '@gala-chain/gswap-sdk';
import React, { useEffect, useState } from 'react';
import TokenSelector from '../components/TokenSelector';
import { tokens } from '../data/tokens';
import { useWallet } from '../hooks/useWallet.ts';
import './SwapPage.css';

type Token = (typeof tokens)[0];

let timer: NodeJS.Timeout;

const debounce = (func: () => unknown, delay: number) => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    func();
  }, delay);
};

const SwapPage: React.FC = () => {
  const [sellingToken, setSellingToken] = useState<Token>(tokens[0]);
  const [buyingToken, setBuyingToken] = useState<Token>(tokens[1]);
  const [ioMode, setIoMode] = useState<'exactInput' | 'exactOutput' | null>('exactInput');
  const [sellingAmount, setSellingAmount] = useState('');
  const [buyingAmount, setBuyingAmount] = useState('');
  const [feeTier, setFeeTier] = useState<FEE_TIER>(FEE_TIER.PERCENT_01_00);
  const { gSwap, walletAddress, connectWallet } = useWallet();

  useEffect(() => {
    async function fetchQuote() {
      const gSwap = new GSwap();
      if (ioMode === 'exactInput') {
        const quote = await gSwap.quoting.quoteExactInput(sellingToken, buyingToken, sellingAmount);
        setBuyingAmount(quote.outTokenAmount.toString());
        setFeeTier(quote.feeTier);
      } else {
        const quote = await gSwap.quoting.quoteExactOutput(sellingToken, buyingToken, buyingAmount);
        setSellingAmount(quote.inTokenAmount.toString());
        setFeeTier(quote.feeTier);
      }
    }

    debounce(fetchQuote, 500);
  }, [sellingToken, buyingToken, sellingAmount, buyingAmount, ioMode]);

  const handleSwapTokens = () => {
    const temp = sellingToken;
    setSellingToken(buyingToken || tokens[0]);
    setBuyingToken(temp);

    // Also swap the amounts
    setSellingAmount(buyingAmount);
    setBuyingAmount(sellingAmount);

    // Invert the last changed direction
    setIoMode(ioMode === 'exactInput' ? 'exactOutput' : 'exactInput');
  };

  const doSwap = async () => {
    if (!gSwap) {
      return connectWallet();
    }

    try {
      const modeParams =
        ioMode === 'exactInput' ? { exactIn: sellingAmount } : { exactOut: buyingAmount };

      const result = await gSwap!.swaps.swap(
        sellingToken,
        buyingToken,
        feeTier,
        {
          ...modeParams,
        },
        walletAddress!,
      );

      await result.wait();

      alert('Swap complete!');
    } catch (error) {
      console.error('Swap failed', error);
      alert('Swap failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <div className="swap-page">
      <div className="swap-container">
        <div className="swap-header">
          <h2>Swap</h2>
          <button className="settings-btn">⚙️</button>
        </div>

        <div className="swap-form">
          <div className="token-input">
            <div className="input-header">
              <span className="label">Selling</span>
              <span className="balance">MAX</span>
            </div>
            <div className="input-row">
              <input
                type="number"
                placeholder="0.00"
                className="amount-input"
                value={sellingAmount}
                onChange={(e) => {
                  setSellingAmount(e.target.value);
                  setIoMode('exactInput');
                }}
              />
              <TokenSelector
                selectedToken={sellingToken}
                onSelectToken={(token) => {
                  setSellingToken(token);
                  setIoMode('exactInput');
                }}
              />
            </div>
            <div className="usd-value">$ 0.00</div>
          </div>

          <div className="swap-arrow">
            <button className="swap-arrow-btn" onClick={handleSwapTokens}>
              🔄
            </button>
          </div>

          <div className="token-input">
            <div className="input-header">
              <span className="label">Buying</span>
            </div>
            <div className="input-row">
              <input
                type="number"
                placeholder="0.00"
                className="amount-input"
                value={buyingAmount}
                onChange={(e) => {
                  setBuyingAmount(e.target.value);
                  setIoMode('exactOutput');
                }}
              />
              <TokenSelector
                selectedToken={buyingToken}
                onSelectToken={(token) => {
                  setBuyingToken(token);
                  setIoMode('exactOutput');
                }}
              />
            </div>
            <div className="usd-value">$ 0.00</div>
          </div>

          <button
            className="swap-button"
            disabled={!sellingToken || !buyingToken || !sellingAmount || sellingAmount === '0'}
            onClick={doSwap}
          >
            Swap
          </button>
        </div>
      </div>
    </div>
  );
};

export default SwapPage;
