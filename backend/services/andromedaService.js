const { SigningCosmWasmClient } = require('@cosmjs/cosmwasm-stargate');
const { DirectSecp256k1HdWallet } = require('@cosmjs/proto-signing');
const { GasPrice } = require('@cosmjs/stargate');
const axios = require('axios');

class AndromedaService {
  constructor() {
    this.rpcUrl = process.env.ANDROMEDA_RPC_URL;
    this.chainId = process.env.ANDROMEDA_CHAIN_ID;
    this.client = null;
    this.wallet = null;
    this.address = null;
    
    // Contract addresses (loaded from deployment)
    this.contracts = {
      cw721_deed: process.env.CW721_DEED_ADDRESS,
      cw20_shares: process.env.CW20_SHARES_ADDRESS,
      marketplace: process.env.MARKETPLACE_ADDRESS,
      splitter: process.env.SPLITTER_ADDRESS,
      staking: process.env.STAKING_ADDRESS,
      auction: process.env.AUCTION_ADDRESS
    };
  }

  async initialize() {
    try {
      this.wallet = await DirectSecp256k1HdWallet.fromMnemonic(
        process.env.ANDROMEDA_MNEMONIC,
        { prefix: 'andr' }
      );

      const accounts = await this.wallet.getAccounts();
      this.address = accounts[0].address;

      this.client = await SigningCosmWasmClient.connectWithSigner(
        this.rpcUrl,
        this.wallet,
        { gasPrice: GasPrice.fromString('0.025uandr') }
      );

      console.log('✅ Andromeda service initialized');
      return true;
    } catch (error) {
      console.error('❌ Andromeda initialization failed:', error);
      throw error;
    }
  }

  async mintPropertyDeed(propertyData) {
    try {
      const tokenId = `DEED_${propertyData.id}`;
      const tokenUri = `https://api.digitalhomes.com/metadata/deed/${propertyData.id}`;

      const msg = {
        mint: {
          token_id: tokenId,
          owner: this.address,
          token_uri: tokenUri,
          extension: {
            property_id: propertyData.id,
            property_address: propertyData.address,
            valuation: propertyData.valuation.ai_estimated_value,
            tokenization_date: new Date().toISOString()
          }
        }
      };

      const result = await this.client.execute(
        this.address,
        this.contracts.cw721_deed,
        msg,
        'auto',
        'Mint property deed NFT'
      );

      return {
        token_id: tokenId,
        transaction_hash: result.transactionHash,
        contract_address: this.contracts.cw721_deed
      };
    } catch (error) {
      console.error('Deed minting failed:', error);
      throw error;
    }
  }

  async mintPropertyShares(propertyId, totalShares, sharePrice) {
    try {
      const totalAmount = (totalShares * sharePrice * 1000000).toString(); // Convert to microunits

      const msg = {
        mint: {
          recipient: this.address,
          amount: totalAmount
        }
      };

      const result = await this.client.execute(
        this.address,
        this.contracts.cw20_shares,
        msg,
        'auto',
        'Mint property shares'
      );

      return {
        total_shares: totalShares,
        share_price: sharePrice,
        total_amount: totalAmount,
        transaction_hash: result.transactionHash,
        contract_address: this.contracts.cw20_shares
      };
    } catch (error) {
      console.error('Shares minting failed:', error);
      throw error;
    }
  }

  async transferShares(recipientAddress, amount) {
    try {
      const msg = {
        transfer: {
          recipient: recipientAddress,
          amount: (amount * 1000000).toString()
        }
      };

      const result = await this.client.execute(
        this.address,
        this.contracts.cw20_shares,
        msg,
        'auto',
        'Transfer property shares'
      );

      return {
        transaction_hash: result.transactionHash,
        amount: amount,
        recipient: recipientAddress
      };
    } catch (error) {
      console.error('Share transfer failed:', error);
      throw error;
    }
  }

  async listOnMarketplace(tokenId, price, tokenType = 'cw20') {
    try {
      const msg = {
        receive_nft: {
          sender: this.address,
          token_id: tokenId,
          msg: btoa(JSON.stringify({
            start_sale: {
              price: {
                amount: (price * 1000000).toString(),
                denom: 'uandr'
              },
              coin_denom: 'uandr'
            }
          }))
        }
      };

      const contractAddress = tokenType === 'cw721' ? this.contracts.cw721_deed : this.contracts.cw20_shares;

      const result = await this.client.execute(
        this.address,
        contractAddress,
        msg,
        'auto',
        'List on marketplace'
      );

      return {
        listing_id: `${tokenId}_${Date.now()}`,
        transaction_hash: result.transactionHash,
        price: price
      };
    } catch (error) {
      console.error('Marketplace listing failed:', error);
      throw error;
    }
  }

  async distributeDividends(propertyId, totalAmount, recipients) {
    try {
      // Update splitter recipients
      const updateMsg = {
        update_recipients: {
          recipients: recipients.map(r => ({
            address: r.address,
            percent: (r.shares / r.total_shares).toString()
          }))
        }
      };

      await this.client.execute(
        this.address,
        this.contracts.splitter,
        updateMsg,
        'auto',
        'Update dividend recipients'
      );

      // Send funds to splitter for distribution
      const distributeMsg = {
        send: {}
      };

      const funds = [{
        denom: 'uandr',
        amount: (totalAmount * 1000000).toString()
      }];

      const result = await this.client.execute(
        this.address,
        this.contracts.splitter,
        distributeMsg,
        'auto',
        'Distribute dividends',
        funds
      );

      return {
        transaction_hash: result.transactionHash,
        total_distributed: totalAmount,
        recipients_count: recipients.length
      };
    } catch (error) {
      console.error('Dividend distribution failed:', error);
      throw error;
    }
  }

  async stakeShares(amount, duration) {
    try {
      const msg = {
        send: {
          contract: this.contracts.staking,
          amount: (amount * 1000000).toString(),
          msg: btoa(JSON.stringify({
            stake: {
              duration: duration
            }
          }))
        }
      };

      const result = await this.client.execute(
        this.address,
        this.contracts.cw20_shares,
        msg,
        'auto',
        'Stake property shares'
      );

      return {
        transaction_hash: result.transactionHash,
        staked_amount: amount,
        duration: duration
      };
    } catch (error) {
      console.error('Staking failed:', error);
      throw error;
    }
  }

  async getContractInfo(contractAddress) {
    try {
      const contractInfo = await this.client.getContract(contractAddress);
      return contractInfo;
    } catch (error) {
      console.error('Failed to get contract info:', error);
      throw error;
    }
  }

  async queryBalance(userAddress, tokenContract) {
    try {
      const query = {
        balance: {
          address: userAddress
        }
      };

      const result = await this.client.queryContractSmart(tokenContract, query);
      return {
        balance: parseInt(result.balance) / 1000000,
        raw_balance: result.balance
      };
    } catch (error) {
      console.error('Balance query failed:', error);
      throw error;
    }
  }

  async getStakingInfo(userAddress) {
    try {
      const query = {
        staker_info: {
          staker: userAddress
        }
      };

      const result = await this.client.queryContractSmart(this.contracts.staking, query);
      return {
        staked_amount: parseInt(result.staked_amount) / 1000000,
        pending_rewards: parseInt(result.pending_rewards) / 1000000,
        stake_start_time: result.stake_start_time,
        stake_duration: result.stake_duration
      };
    } catch (error) {
      console.error('Staking info query failed:', error);
      return null;
    }
  }

  async getMarketplaceListings() {
    try {
      const query = {
        latest_sale_states: {
          limit: 50
        }
      };

      const result = await this.client.queryContractSmart(this.contracts.marketplace, query);
      return result.sale_states || [];
    } catch (error) {
      console.error('Marketplace query failed:', error);
      return [];
    }
  }
}

module.exports = AndromedaService;
