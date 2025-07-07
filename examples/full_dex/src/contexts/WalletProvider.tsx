import { GalaWalletSigner, GSwap } from '@gala-chain/gswap-sdk';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { WalletContext } from './WalletContext.tsx';

interface GalaWindow extends Window {
  gala?: {
    request: (params: { method: string }) => Promise<string[]>;
  };
}

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gSwap, setGSwap] = useState<GSwap | null>(null);
  const connectionAttemptedRef = useRef(false);

  async function connectWallet() {
    setIsConnecting(true);
    connectionAttemptedRef.current = true;

    try {
      while (true) {
        // Cast window to our custom window type with gala property
        const galaWindow = window as unknown as GalaWindow;

        if (galaWindow.gala) {
          const accounts = await galaWindow.gala.request({
            method: 'eth_requestAccounts',
          });

          if (accounts && accounts.length > 0) {
            const address = accounts[0];
            setWalletAddress(address);

            // Create a new GSwap instance with a proper wallet signer
            const walletSigner = new GalaWalletSigner(address);
            const swapInstance = new GSwap({
              signer: walletSigner,
            });
            setGSwap(swapInstance);
          }

          setIsConnecting(false);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
      setIsConnecting(false);
    }
  }

  useEffect(() => {
    // Skip if we've already attempted to connect
    if (connectionAttemptedRef.current) {
      return;
    }

    connectWallet();
  }, []);

  useEffect(() => {
    async function connect() {
      GSwap.events.connectEventSocket();
    }

    connect();

    return () => GSwap.events.disconnectEventSocket();
  });

  const value = {
    connectWallet,
    walletAddress,
    isConnecting,
    error,
    gSwap,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};
