import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import Navigation from './components/Navigation';
import { WalletProvider } from './contexts/WalletProvider';
import LiquidityPage from './pages/LiquidityPage';
import SwapPage from './pages/SwapPage';

function App() {
  return (
    <WalletProvider>
      <Router>
        <div className="app">
          <Navigation />
          <Routes>
            <Route path="/" element={<Navigate to="/swap" replace />} />
            <Route path="/swap" element={<SwapPage />} />
            M<Route path="/liquidity" element={<LiquidityPage />} />
          </Routes>
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;
