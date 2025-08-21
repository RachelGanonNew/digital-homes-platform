import React, { useState, useEffect } from 'react';
import { WalletIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import walletService from '../services/walletService';
import toast from 'react-hot-toast';

const WalletConnector = ({ onConnect, onDisconnect }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletInfo, setWalletInfo] = useState(null);
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      if (walletService.isConnected) {
        const balance = await walletService.getBalance();
        setWalletInfo({
          address: walletService.address,
          connected: true
        });
        setBalance(balance);
      }
    } catch (error) {
      console.error('Wallet check failed:', error);
    }
  };

  const connectKeplr = async () => {
    setIsConnecting(true);
    try {
      if (!window.keplr) {
        toast.error('Please install Keplr wallet extension');
        window.open('https://www.keplr.app/', '_blank');
        return;
      }

      const result = await walletService.connectWallet();
      const balance = await walletService.getBalance();
      
      setWalletInfo(result);
      setBalance(balance);
      
      // Authenticate with backend
      const authResponse = await fetch('/api/auth/connect-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: result.address,
          signature: 'demo_signature' // In production, sign a message
        })
      });

      const authData = await authResponse.json();
      localStorage.setItem('auth_token', authData.token);
      
      toast.success('Wallet connected successfully!');
      onConnect?.(result);
    } catch (error) {
      toast.error(`Connection failed: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const connectMnemonic = async () => {
    const mnemonic = prompt('Enter your mnemonic phrase (for demo only):');
    if (!mnemonic) return;

    setIsConnecting(true);
    try {
      const result = await walletService.connectWallet(mnemonic);
      const balance = await walletService.getBalance();
      
      setWalletInfo(result);
      setBalance(balance);
      
      toast.success('Wallet connected with mnemonic!');
      onConnect?.(result);
    } catch (error) {
      toast.error(`Connection failed: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    walletService.disconnect();
    setWalletInfo(null);
    setBalance(null);
    localStorage.removeItem('auth_token');
    toast.success('Wallet disconnected');
    onDisconnect?.();
  };

  if (walletInfo?.connected) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-green-50 text-green-800 px-3 py-2 rounded-lg">
          <CheckCircleIcon className="w-4 h-4" />
          <span className="text-sm font-medium">
            {walletInfo.address.substring(0, 8)}...{walletInfo.address.slice(-6)}
          </span>
        </div>
        {balance && (
          <div className="text-sm text-gray-600">
            {balance.formatted}
          </div>
        )}
        <button
          onClick={disconnect}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={connectKeplr}
        disabled={isConnecting}
        className="btn-primary flex items-center space-x-2 disabled:opacity-50"
      >
        <WalletIcon className="w-4 h-4" />
        <span>{isConnecting ? 'Connecting...' : 'Connect Keplr'}</span>
      </button>
      
      <button
        onClick={connectMnemonic}
        disabled={isConnecting}
        className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
      >
        <span>Demo Wallet</span>
      </button>
    </div>
  );
};

export default WalletConnector;
