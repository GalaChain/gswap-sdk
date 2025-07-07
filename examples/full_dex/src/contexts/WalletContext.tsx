import type { GSwap } from '@gala-chain/gswap-sdk';
import { createContext } from 'react';

interface WalletContextType {
  walletAddress: string | null;
  isConnecting: boolean;
  error: string | null;
  gSwap: GSwap | null;
  connectWallet: () => Promise<void>;
}

export const WalletContext = createContext<WalletContextType>({
  walletAddress: null,
  isConnecting: false,
  error: null,
  gSwap: null,
  connectWallet: async () => {},
});
