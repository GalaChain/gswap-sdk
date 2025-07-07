import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import './Navigation.css';

const Navigation: React.FC = () => {
  const location = useLocation();
  const { walletAddress, isConnecting } = useWallet();

  const formatWalletAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <h1>DEX</h1>
        </div>
        <div className="nav-links">
          <Link to="/swap" className={`nav-link ${location.pathname === '/swap' ? 'active' : ''}`}>
            Swap
          </Link>
        </div>
        <div className="wallet-info">
          {isConnecting ? (
            <span className="connecting">Connecting...</span>
          ) : walletAddress ? (
            <span className="wallet-address">{formatWalletAddress(walletAddress)}</span>
          ) : (
            <span className="wallet-not-connected">Wallet not connected</span>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
