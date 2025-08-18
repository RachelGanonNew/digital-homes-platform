const { CosmWasmClient, SigningCosmWasmClient } = require('@cosmjs/cosmwasm-stargate');
const { DirectSecp256k1HdWallet } = require('@cosmjs/proto-signing');
const { GasPrice } = require('@cosmjs/stargate');
const fs = require('fs');
const path = require('path');

class AndromedaDeployer {
  constructor(config) {
    this.rpcUrl = config.rpcUrl;
    this.chainId = config.chainId;
    this.mnemonic = config.mnemonic;
    this.gasPrice = GasPrice.fromString('0.025uandr');
  }

  async initialize() {
    console.log('🔗 Connecting to Andromeda Protocol...');
    
    // Create wallet from mnemonic
    this.wallet = await DirectSecp256k1HdWallet.fromMnemonic(this.mnemonic, {
      prefix: 'andr',
    });

    // Get accounts
    const accounts = await this.wallet.getAccounts();
    this.senderAddress = accounts[0].address;
    console.log(`📝 Using address: ${this.senderAddress}`);

    // Create signing client
    this.client = await SigningCosmWasmClient.connectWithSigner(
      this.rpcUrl,
      this.wallet,
      {
        gasPrice: this.gasPrice,
      }
    );

    console.log('✅ Connected to Andromeda Protocol');
  }

  async deployPropertyDeedNFT() {
    console.log('🏠 Deploying Property Deed NFT (CW721)...');
    
    const contractConfig = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../smart-contracts/property-tokenization.json'))
    );

    const cw721Config = contractConfig.property_deed_nft;
    cw721Config.instantiate_msg.minter = this.senderAddress;

    try {
      // In a real deployment, you would use the Andromeda App Builder
      // This is a simplified example for demonstration
      const result = await this.client.instantiate(
        this.senderAddress,
        'andromeda_cw721_code_id', // Replace with actual code ID
        cw721Config.instantiate_msg,
        'Digital Homes Property Deeds',
        'auto'
      );

      console.log(`✅ Property Deed NFT deployed at: ${result.contractAddress}`);
      return result.contractAddress;
    } catch (error) {
      console.error('❌ Failed to deploy Property Deed NFT:', error);
      throw error;
    }
  }

  async deployPropertySharesToken() {
    console.log('🪙 Deploying Property Shares Token (CW20)...');
    
    const contractConfig = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../smart-contracts/property-tokenization.json'))
    );

    const cw20Config = contractConfig.property_shares_token;
    cw20Config.instantiate_msg.mint.minter = this.senderAddress;

    try {
      const result = await this.client.instantiate(
        this.senderAddress,
        'andromeda_cw20_code_id', // Replace with actual code ID
        cw20Config.instantiate_msg,
        'Property Shares Token',
        'auto'
      );

      console.log(`✅ Property Shares Token deployed at: ${result.contractAddress}`);
      return result.contractAddress;
    } catch (error) {
      console.error('❌ Failed to deploy Property Shares Token:', error);
      throw error;
    }
  }

  async deployMarketplace(nftAddress, tokenAddress) {
    console.log('🏪 Deploying Marketplace...');
    
    const contractConfig = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../smart-contracts/property-tokenization.json'))
    );

    const marketplaceConfig = contractConfig.marketplace;
    marketplaceConfig.instantiate_msg.authorized_cw20_address = tokenAddress;
    marketplaceConfig.instantiate_msg.authorized_token_addresses = [nftAddress];

    try {
      const result = await this.client.instantiate(
        this.senderAddress,
        'andromeda_marketplace_code_id', // Replace with actual code ID
        marketplaceConfig.instantiate_msg,
        'Digital Homes Marketplace',
        'auto'
      );

      console.log(`✅ Marketplace deployed at: ${result.contractAddress}`);
      return result.contractAddress;
    } catch (error) {
      console.error('❌ Failed to deploy Marketplace:', error);
      throw error;
    }
  }

  async deploySplitter() {
    console.log('💰 Deploying Revenue Splitter...');
    
    const contractConfig = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../smart-contracts/property-tokenization.json'))
    );

    const splitterConfig = contractConfig.revenue_splitter;

    try {
      const result = await this.client.instantiate(
        this.senderAddress,
        'andromeda_splitter_code_id', // Replace with actual code ID
        splitterConfig.instantiate_msg,
        'Digital Homes Revenue Splitter',
        'auto'
      );

      console.log(`✅ Revenue Splitter deployed at: ${result.contractAddress}`);
      return result.contractAddress;
    } catch (error) {
      console.error('❌ Failed to deploy Revenue Splitter:', error);
      throw error;
    }
  }

  async deployStaking(tokenAddress) {
    console.log('🔒 Deploying Staking Contract...');
    
    const contractConfig = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../smart-contracts/staking-contract.json'))
    );

    const stakingConfig = contractConfig.staking_rewards_system;
    stakingConfig.instantiate_msg.staking_token = tokenAddress;
    stakingConfig.instantiate_msg.reward_token = tokenAddress;

    try {
      const result = await this.client.instantiate(
        this.senderAddress,
        'andromeda_cw20_staking_code_id', // Replace with actual code ID
        stakingConfig.instantiate_msg,
        'Digital Homes Staking',
        'auto'
      );

      console.log(`✅ Staking Contract deployed at: ${result.contractAddress}`);
      return result.contractAddress;
    } catch (error) {
      console.error('❌ Failed to deploy Staking Contract:', error);
      throw error;
    }
  }

  async deployAll() {
    console.log('🚀 Starting full Digital Homes deployment...');
    
    try {
      await this.initialize();

      // Deploy core contracts
      const nftAddress = await this.deployPropertyDeedNFT();
      const tokenAddress = await this.deployPropertySharesToken();
      const marketplaceAddress = await this.deployMarketplace(nftAddress, tokenAddress);
      const splitterAddress = await this.deploySplitter();
      const stakingAddress = await this.deployStaking(tokenAddress);

      // Save deployment addresses
      const deploymentInfo = {
        network: this.chainId,
        deployer: this.senderAddress,
        timestamp: new Date().toISOString(),
        contracts: {
          property_deed_nft: nftAddress,
          property_shares_token: tokenAddress,
          marketplace: marketplaceAddress,
          revenue_splitter: splitterAddress,
          staking_contract: stakingAddress
        }
      };

      fs.writeFileSync(
        path.join(__dirname, 'deployment-addresses.json'),
        JSON.stringify(deploymentInfo, null, 2)
      );

      console.log('\n🎉 Digital Homes Platform deployed successfully!');
      console.log('📋 Deployment Summary:');
      console.log(`   Property Deed NFT: ${nftAddress}`);
      console.log(`   Property Shares Token: ${tokenAddress}`);
      console.log(`   Marketplace: ${marketplaceAddress}`);
      console.log(`   Revenue Splitter: ${splitterAddress}`);
      console.log(`   Staking Contract: ${stakingAddress}`);
      console.log('\n📄 Addresses saved to deployment-addresses.json');

      return deploymentInfo;

    } catch (error) {
      console.error('❌ Deployment failed:', error);
      throw error;
    }
  }
}

// Main deployment function
async function main() {
  const config = {
    rpcUrl: process.env.ANDROMEDA_RPC_URL || 'https://rpc.andromeda-1.andromeda.io:443',
    chainId: process.env.ANDROMEDA_CHAIN_ID || 'andromeda-1',
    mnemonic: process.env.ANDROMEDA_MNEMONIC
  };

  if (!config.mnemonic) {
    console.error('❌ ANDROMEDA_MNEMONIC environment variable is required');
    process.exit(1);
  }

  const deployer = new AndromedaDeployer(config);
  await deployer.deployAll();
}

// Run deployment if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { AndromedaDeployer };
