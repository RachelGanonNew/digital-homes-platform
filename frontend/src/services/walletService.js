import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { GasPrice } from '@cosmjs/stargate';

class WalletService {
  constructor() {
    this.client = null;
    this.wallet = null;
    this.address = null;
    this.isConnected = false;
    this.chainId = process.env.REACT_APP_ANDROMEDA_CHAIN_ID || 'andromeda-1';
    this.rpcUrl = process.env.REACT_APP_ANDROMEDA_RPC_URL || 'https://rpc.andromeda-1.andromeda.io:443';
  }

  async connectWallet(mnemonic = null) {
    try {
      if (mnemonic) {
        // Connect with mnemonic
        this.wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
          prefix: 'andr',
        });
      } else {
        // Connect with Keplr wallet
        if (!window.keplr) {
          throw new Error('Keplr wallet not installed');
        }

        await window.keplr.enable(this.chainId);
        const offlineSigner = window.keplr.getOfflineSigner(this.chainId);
        this.wallet = offlineSigner;
      }

      // Get accounts
      const accounts = await this.wallet.getAccounts();
      this.address = accounts[0].address;

      // Create signing client
      this.client = await SigningCosmWasmClient.connectWithSigner(
        this.rpcUrl,
        this.wallet,
        {
          gasPrice: GasPrice.fromString('0.025uandr'),
        }
      );

      this.isConnected = true;
      return {
        address: this.address,
        connected: true
      };
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }

  async getBalance() {
    if (!this.client || !this.address) {
      throw new Error('Wallet not connected');
    }

    try {
      const balance = await this.client.getBalance(this.address, 'uandr');
      return {
        amount: balance.amount,
        denom: balance.denom,
        formatted: `${(parseInt(balance.amount) / 1000000).toFixed(2)} ANDR`
      };
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  async buyPropertyShares(contractAddress, shares, totalCost) {
    if (!this.client || !this.address) {
      throw new Error('Wallet not connected');
    }

    try {
      const msg = {
        transfer: {
          recipient: contractAddress,
          amount: (shares * 1000000).toString() // Convert to microunits
        }
      };

      const fee = {
        amount: [{ denom: 'uandr', amount: '5000' }],
        gas: '200000',
      };

      const result = await this.client.execute(
        this.address,
        contractAddress,
        msg,
        fee,
        'Buy property shares'
      );

      return {
        transactionHash: result.transactionHash,
        gasUsed: result.gasUsed,
        success: true
      };
    } catch (error) {
      console.error('Share purchase failed:', error);
      throw error;
    }
  }

  async sellPropertyShares(contractAddress, shares, pricePerShare) {
    if (!this.client || !this.address) {
      throw new Error('Wallet not connected');
    }

    try {
      const msg = {
        send: {
          contract: contractAddress,
          amount: (shares * 1000000).toString(),
          msg: btoa(JSON.stringify({
            list_for_sale: {
              price_per_share: (pricePerShare * 1000000).toString()
            }
          }))
        }
      };

      const fee = {
        amount: [{ denom: 'uandr', amount: '5000' }],
        gas: '200000',
      };

      const result = await this.client.execute(
        this.address,
        contractAddress,
        msg,
        fee,
        'List shares for sale'
      );

      return {
        transactionHash: result.transactionHash,
        success: true
      };
    } catch (error) {
      console.error('Share listing failed:', error);
      throw error;
    }
  }

  async stakeShares(stakingContract, amount, duration) {
    if (!this.client || !this.address) {
      throw new Error('Wallet not connected');
    }

    try {
      const msg = {
        stake: {
          amount: (amount * 1000000).toString(),
          duration: duration
        }
      };

      const fee = {
        amount: [{ denom: 'uandr', amount: '5000' }],
        gas: '200000',
      };

      const result = await this.client.execute(
        this.address,
        stakingContract,
        msg,
        fee,
        'Stake property shares'
      );

      return {
        transactionHash: result.transactionHash,
        success: true
      };
    } catch (error) {
      console.error('Staking failed:', error);
      throw error;
    }
  }

  async getStakingRewards(stakingContract) {
    if (!this.client || !this.address) {
      throw new Error('Wallet not connected');
    }

    try {
      const query = {
        staker_info: {
          staker: this.address
        }
      };

      const result = await this.client.queryContractSmart(stakingContract, query);
      return result;
    } catch (error) {
      console.error('Failed to get staking rewards:', error);
      throw error;
    }
  }

  async claimRewards(stakingContract) {
    if (!this.client || !this.address) {
      throw new Error('Wallet not connected');
    }

    try {
      const msg = {
        claim_rewards: {}
      };

      const fee = {
        amount: [{ denom: 'uandr', amount: '5000' }],
        gas: '200000',
      };

      const result = await this.client.execute(
        this.address,
        stakingContract,
        msg,
        fee,
        'Claim staking rewards'
      );

      return {
        transactionHash: result.transactionHash,
        success: true
      };
    } catch (error) {
      console.error('Reward claim failed:', error);
      throw error;
    }
  }

  disconnect() {
    this.client = null;
    this.wallet = null;
    this.address = null;
    this.isConnected = false;
  }
}

export default new WalletService();
