import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { GasPrice } from '@cosmjs/stargate';

class WalletIntegration {
  constructor() {
    this.chainId = process.env.REACT_APP_ANDROMEDA_CHAIN_ID || 'andromeda-1';
    this.rpcEndpoint = process.env.REACT_APP_ANDROMEDA_RPC_URL || 'https://rpc.andromeda-1.andromeda.io:443';
    this.gasPrice = GasPrice.fromString('0.025uandr');
    this.client = null;
    this.wallet = null;
    this.address = null;
    this.isConnected = false;
  }

  async connectKeplr() {
    try {
      if (!window.keplr) {
        throw new Error('Keplr wallet not installed');
      }

      // Enable Keplr for Andromeda chain
      await window.keplr.enable(this.chainId);
      
      // Get offline signer
      const offlineSigner = window.keplr.getOfflineSigner(this.chainId);
      const accounts = await offlineSigner.getAccounts();
      
      this.address = accounts[0].address;
      
      // Create signing client
      this.client = await SigningCosmWasmClient.connectWithSigner(
        this.rpcEndpoint,
        offlineSigner,
        { gasPrice: this.gasPrice }
      );

      this.isConnected = true;
      
      // Get balance
      const balance = await this.getBalance();
      
      return {
        success: true,
        address: this.address,
        balance: balance,
        wallet_type: 'keplr'
      };
    } catch (error) {
      console.error('Keplr connection failed:', error);
      throw new Error(`Keplr connection failed: ${error.message}`);
    }
  }

  async connectMnemonic(mnemonic) {
    try {
      // Create wallet from mnemonic
      this.wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix: 'andr'
      });

      const accounts = await this.wallet.getAccounts();
      this.address = accounts[0].address;

      // Create signing client
      this.client = await SigningCosmWasmClient.connectWithSigner(
        this.rpcEndpoint,
        this.wallet,
        { gasPrice: this.gasPrice }
      );

      this.isConnected = true;

      // Get balance
      const balance = await this.getBalance();

      return {
        success: true,
        address: this.address,
        balance: balance,
        wallet_type: 'mnemonic'
      };
    } catch (error) {
      console.error('Mnemonic wallet connection failed:', error);
      throw new Error(`Mnemonic connection failed: ${error.message}`);
    }
  }

  async getBalance() {
    try {
      if (!this.client || !this.address) {
        throw new Error('Wallet not connected');
      }

      const balance = await this.client.getBalance(this.address, 'uandr');
      return {
        amount: balance.amount,
        denom: balance.denom,
        formatted: `${(parseInt(balance.amount) / 1000000).toFixed(6)} ANDR`
      };
    } catch (error) {
      console.error('Balance fetch failed:', error);
      return { amount: '0', denom: 'uandr', formatted: '0 ANDR' };
    }
  }

  async purchaseShares(propertyId, shareAmount, pricePerShare) {
    try {
      if (!this.isConnected) {
        throw new Error('Wallet not connected');
      }

      const shareTokenAddress = process.env.REACT_APP_SHARE_TOKEN_ADDRESS;
      const totalCost = shareAmount * pricePerShare;

      // Execute purchase transaction
      const executeMsg = {
        purchase_shares: {
          property_id: propertyId,
          share_amount: shareAmount.toString(),
          max_price: (totalCost * 1000000).toString() // Convert to microunits
        }
      };

      const result = await this.client.execute(
        this.address,
        shareTokenAddress,
        executeMsg,
        'auto',
        'Purchase property shares',
        [{ denom: 'uandr', amount: (totalCost * 1000000).toString() }]
      );

      return {
        success: true,
        transactionHash: result.transactionHash,
        propertyId: propertyId,
        sharesPurchased: shareAmount,
        totalCost: totalCost,
        gasUsed: result.gasUsed
      };
    } catch (error) {
      console.error('Share purchase failed:', error);
      throw new Error(`Share purchase failed: ${error.message}`);
    }
  }

  async sellShares(propertyId, shareAmount, minPricePerShare) {
    try {
      if (!this.isConnected) {
        throw new Error('Wallet not connected');
      }

      const marketplaceAddress = process.env.REACT_APP_MARKETPLACE_ADDRESS;
      const shareTokenAddress = process.env.REACT_APP_SHARE_TOKEN_ADDRESS;

      // First, approve marketplace to transfer shares
      const approveMsg = {
        increase_allowance: {
          spender: marketplaceAddress,
          amount: (shareAmount * 1000000).toString()
        }
      };

      await this.client.execute(
        this.address,
        shareTokenAddress,
        approveMsg,
        'auto',
        'Approve share transfer'
      );

      // Create sell order
      const sellMsg = {
        sell_shares: {
          property_id: propertyId,
          share_amount: shareAmount.toString(),
          min_price_per_share: (minPricePerShare * 1000000).toString()
        }
      };

      const result = await this.client.execute(
        this.address,
        marketplaceAddress,
        sellMsg,
        'auto',
        'Sell property shares'
      );

      return {
        success: true,
        transactionHash: result.transactionHash,
        propertyId: propertyId,
        sharesListed: shareAmount,
        minPrice: minPricePerShare,
        gasUsed: result.gasUsed
      };
    } catch (error) {
      console.error('Share selling failed:', error);
      throw new Error(`Share selling failed: ${error.message}`);
    }
  }

  async stakeShares(shareAmount) {
    try {
      if (!this.isConnected) {
        throw new Error('Wallet not connected');
      }

      const stakingAddress = process.env.REACT_APP_STAKING_ADDRESS;
      const shareTokenAddress = process.env.REACT_APP_SHARE_TOKEN_ADDRESS;

      // Send tokens to staking contract
      const stakeMsg = {
        send: {
          contract: stakingAddress,
          amount: (shareAmount * 1000000).toString(),
          msg: btoa(JSON.stringify({ stake: {} }))
        }
      };

      const result = await this.client.execute(
        this.address,
        shareTokenAddress,
        stakeMsg,
        'auto',
        'Stake shares for rewards'
      );

      return {
        success: true,
        transactionHash: result.transactionHash,
        stakedAmount: shareAmount,
        gasUsed: result.gasUsed
      };
    } catch (error) {
      console.error('Share staking failed:', error);
      throw new Error(`Share staking failed: ${error.message}`);
    }
  }

  async unstakeShares(shareAmount) {
    try {
      if (!this.isConnected) {
        throw new Error('Wallet not connected');
      }

      const stakingAddress = process.env.REACT_APP_STAKING_ADDRESS;

      const unstakeMsg = {
        unstake: {
          amount: (shareAmount * 1000000).toString()
        }
      };

      const result = await this.client.execute(
        this.address,
        stakingAddress,
        unstakeMsg,
        'auto',
        'Unstake shares'
      );

      return {
        success: true,
        transactionHash: result.transactionHash,
        unstakedAmount: shareAmount,
        gasUsed: result.gasUsed
      };
    } catch (error) {
      console.error('Share unstaking failed:', error);
      throw new Error(`Share unstaking failed: ${error.message}`);
    }
  }

  async claimRewards() {
    try {
      if (!this.isConnected) {
        throw new Error('Wallet not connected');
      }

      const stakingAddress = process.env.REACT_APP_STAKING_ADDRESS;

      const claimMsg = {
        claim_rewards: {}
      };

      const result = await this.client.execute(
        this.address,
        stakingAddress,
        claimMsg,
        'auto',
        'Claim staking rewards'
      );

      return {
        success: true,
        transactionHash: result.transactionHash,
        gasUsed: result.gasUsed
      };
    } catch (error) {
      console.error('Reward claiming failed:', error);
      throw new Error(`Reward claiming failed: ${error.message}`);
    }
  }

  async getPortfolio() {
    try {
      if (!this.isConnected) {
        throw new Error('Wallet not connected');
      }

      const shareTokenAddress = process.env.REACT_APP_SHARE_TOKEN_ADDRESS;
      const stakingAddress = process.env.REACT_APP_STAKING_ADDRESS;

      // Get share token balance
      const balanceQuery = {
        balance: { address: this.address }
      };

      const shareBalance = await this.client.queryContractSmart(
        shareTokenAddress,
        balanceQuery
      );

      // Get staked amount
      const stakingQuery = {
        staker: { address: this.address }
      };

      let stakedAmount = '0';
      try {
        const stakingInfo = await this.client.queryContractSmart(
          stakingAddress,
          stakingQuery
        );
        stakedAmount = stakingInfo.balance || '0';
      } catch (error) {
        console.log('No staking info found');
      }

      // Get pending rewards
      let pendingRewards = '0';
      try {
        const rewardsQuery = {
          pending_rewards: { address: this.address }
        };
        const rewards = await this.client.queryContractSmart(
          stakingAddress,
          rewardsQuery
        );
        pendingRewards = rewards.rewards || '0';
      } catch (error) {
        console.log('No pending rewards found');
      }

      return {
        shareBalance: {
          amount: shareBalance.balance,
          formatted: (parseInt(shareBalance.balance) / 1000000).toFixed(6)
        },
        stakedAmount: {
          amount: stakedAmount,
          formatted: (parseInt(stakedAmount) / 1000000).toFixed(6)
        },
        pendingRewards: {
          amount: pendingRewards,
          formatted: (parseInt(pendingRewards) / 1000000).toFixed(6)
        },
        totalValue: {
          amount: (parseInt(shareBalance.balance) + parseInt(stakedAmount)).toString(),
          formatted: ((parseInt(shareBalance.balance) + parseInt(stakedAmount)) / 1000000).toFixed(6)
        }
      };
    } catch (error) {
      console.error('Portfolio fetch failed:', error);
      return {
        shareBalance: { amount: '0', formatted: '0' },
        stakedAmount: { amount: '0', formatted: '0' },
        pendingRewards: { amount: '0', formatted: '0' },
        totalValue: { amount: '0', formatted: '0' }
      };
    }
  }

  async getTransactionHistory() {
    try {
      if (!this.isConnected) {
        throw new Error('Wallet not connected');
      }

      // Query transaction history from blockchain
      // This is a simplified version - in production you'd use indexer services
      const transactions = [
        {
          hash: 'ABC123...',
          type: 'purchase_shares',
          property_id: 'PROP_001',
          amount: '1000',
          timestamp: new Date().toISOString(),
          status: 'success'
        },
        {
          hash: 'DEF456...',
          type: 'stake_shares',
          amount: '500',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          status: 'success'
        }
      ];

      return transactions;
    } catch (error) {
      console.error('Transaction history fetch failed:', error);
      return [];
    }
  }

  async disconnect() {
    this.client = null;
    this.wallet = null;
    this.address = null;
    this.isConnected = false;
    
    return { success: true };
  }

  async signMessage(message) {
    try {
      if (!this.isConnected) {
        throw new Error('Wallet not connected');
      }

      if (window.keplr) {
        // Use Keplr's signArbitrary method
        const signature = await window.keplr.signArbitrary(
          this.chainId,
          this.address,
          message
        );
        return signature;
      } else if (this.wallet) {
        // Use direct wallet signing
        const signDoc = {
          chain_id: this.chainId,
          account_number: '0',
          sequence: '0',
          fee: { gas: '0', amount: [] },
          msgs: [{ type: 'sign/MsgSignData', value: { signer: this.address, data: message } }],
          memo: ''
        };

        const signature = await this.wallet.signDirect(this.address, signDoc);
        return signature;
      }

      throw new Error('No signing method available');
    } catch (error) {
      console.error('Message signing failed:', error);
      throw new Error(`Message signing failed: ${error.message}`);
    }
  }
}

export default WalletIntegration;
