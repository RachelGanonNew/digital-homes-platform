const { DirectSecp256k1HdWallet } = require('@cosmjs/proto-signing');
const { SigningCosmWasmClient } = require('@cosmjs/cosmwasm-stargate');
const { GasPrice } = require('@cosmjs/stargate');
const fs = require('fs').promises;

class AndromedaDeployer {
  constructor() {
    this.rpcEndpoint = process.env.ANDROMEDA_RPC_URL || 'https://rpc.andromeda-1.andromeda.io:443';
    this.chainId = process.env.ANDROMEDA_CHAIN_ID || 'andromeda-1';
    this.gasPrice = GasPrice.fromString('0.025uandr');
    this.deployedContracts = {};
  }

  async initialize() {
    try {
      // Create wallet from mnemonic
      const mnemonic = process.env.ANDROMEDA_MNEMONIC;
      if (!mnemonic) {
        throw new Error('ANDROMEDA_MNEMONIC environment variable required');
      }

      this.wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix: 'andr'
      });

      const accounts = await this.wallet.getAccounts();
      this.deployerAddress = accounts[0].address;

      // Create signing client
      this.client = await SigningCosmWasmClient.connectWithSigner(
        this.rpcEndpoint,
        this.wallet,
        {
          gasPrice: this.gasPrice
        }
      );

      console.log(`✅ Connected to Andromeda network`);
      console.log(`📍 Deployer address: ${this.deployerAddress}`);
      
      return true;
    } catch (error) {
      console.error('❌ Andromeda initialization failed:', error);
      throw error;
    }
  }

  async deployPropertyDeedNFT() {
    try {
      console.log('🚀 Deploying Property Deed NFT contract...');

      const initMsg = {
        name: 'Digital Homes Property Deeds',
        symbol: 'DHPD',
        minter: this.deployerAddress,
        collection_info: {
          creator: this.deployerAddress,
          description: 'NFT deeds representing ownership of tokenized real estate properties',
          image: 'https://digitalhomes.example.com/deed-collection.png',
          external_link: 'https://digitalhomes.example.com',
          royalty_info: {
            payment_address: this.deployerAddress,
            share: '0.025' // 2.5% royalty
          }
        }
      };

      // Use Andromeda CW721 ADO
      const result = await this.client.instantiate(
        this.deployerAddress,
        process.env.ANDROMEDA_CW721_CODE_ID || 1, // Replace with actual code ID
        initMsg,
        'Digital Homes Property Deeds',
        'auto'
      );

      this.deployedContracts.propertyDeedNFT = result.contractAddress;
      console.log(`✅ Property Deed NFT deployed: ${result.contractAddress}`);
      
      return result.contractAddress;
    } catch (error) {
      console.error('❌ Property Deed NFT deployment failed:', error);
      throw error;
    }
  }

  async deployShareToken() {
    try {
      console.log('🚀 Deploying Share Token contract...');

      const initMsg = {
        name: 'Digital Homes Shares',
        symbol: 'DHS',
        decimals: 6,
        initial_balances: [],
        mint: {
          minter: this.deployerAddress,
          cap: null
        },
        marketing: {
          project: 'Digital Homes',
          description: 'Fractional ownership tokens for real estate properties',
          marketing: this.deployerAddress,
          logo: {
            url: 'https://digitalhomes.example.com/token-logo.png'
          }
        }
      };

      // Use Andromeda CW20 ADO
      const result = await this.client.instantiate(
        this.deployerAddress,
        process.env.ANDROMEDA_CW20_CODE_ID || 2, // Replace with actual code ID
        initMsg,
        'Digital Homes Share Token',
        'auto'
      );

      this.deployedContracts.shareToken = result.contractAddress;
      console.log(`✅ Share Token deployed: ${result.contractAddress}`);
      
      return result.contractAddress;
    } catch (error) {
      console.error('❌ Share Token deployment failed:', error);
      throw error;
    }
  }

  async deployMarketplace() {
    try {
      console.log('🚀 Deploying Marketplace contract...');

      const initMsg = {
        authorized_token_addresses: [this.deployedContracts.shareToken],
        authorized_cw721_addresses: [this.deployedContracts.propertyDeedNFT],
        modules: [
          {
            module_type: 'rates',
            address: this.deployerAddress,
            is_mutable: true
          }
        ]
      };

      // Use Andromeda Marketplace ADO
      const result = await this.client.instantiate(
        this.deployerAddress,
        process.env.ANDROMEDA_MARKETPLACE_CODE_ID || 3, // Replace with actual code ID
        initMsg,
        'Digital Homes Marketplace',
        'auto'
      );

      this.deployedContracts.marketplace = result.contractAddress;
      console.log(`✅ Marketplace deployed: ${result.contractAddress}`);
      
      return result.contractAddress;
    } catch (error) {
      console.error('❌ Marketplace deployment failed:', error);
      throw error;
    }
  }

  async deploySplitter() {
    try {
      console.log('🚀 Deploying Splitter contract...');

      const initMsg = {
        recipients: [
          {
            recipient: {
              address: this.deployerAddress
            },
            percent: '1.0' // 100% initially, will be updated per property
          }
        ],
        lock_time: null
      };

      // Use Andromeda Splitter ADO
      const result = await this.client.instantiate(
        this.deployerAddress,
        process.env.ANDROMEDA_SPLITTER_CODE_ID || 4, // Replace with actual code ID
        initMsg,
        'Digital Homes Dividend Splitter',
        'auto'
      );

      this.deployedContracts.splitter = result.contractAddress;
      console.log(`✅ Splitter deployed: ${result.contractAddress}`);
      
      return result.contractAddress;
    } catch (error) {
      console.error('❌ Splitter deployment failed:', error);
      throw error;
    }
  }

  async deployStaking() {
    try {
      console.log('🚀 Deploying Staking contract...');

      const initMsg = {
        staking_token: {
          cw20_token: {
            address: this.deployedContracts.shareToken
          }
        },
        additional_rewards: [],
        modules: [
          {
            module_type: 'rates',
            address: this.deployerAddress,
            is_mutable: true
          }
        ]
      };

      // Use Andromeda CW20 Staking ADO
      const result = await this.client.instantiate(
        this.deployerAddress,
        process.env.ANDROMEDA_STAKING_CODE_ID || 5, // Replace with actual code ID
        initMsg,
        'Digital Homes Staking',
        'auto'
      );

      this.deployedContracts.staking = result.contractAddress;
      console.log(`✅ Staking deployed: ${result.contractAddress}`);
      
      return result.contractAddress;
    } catch (error) {
      console.error('❌ Staking deployment failed:', error);
      throw error;
    }
  }

  async deployAuction() {
    try {
      console.log('🚀 Deploying Auction contract...');

      const initMsg = {
        authorized_token_addresses: [this.deployedContracts.shareToken],
        authorized_cw721_addresses: [this.deployedContracts.propertyDeedNFT],
        modules: [
          {
            module_type: 'rates',
            address: this.deployerAddress,
            is_mutable: true
          }
        ]
      };

      // Use Andromeda Auction ADO
      const result = await this.client.instantiate(
        this.deployerAddress,
        process.env.ANDROMEDA_AUCTION_CODE_ID || 6, // Replace with actual code ID
        initMsg,
        'Digital Homes Auction',
        'auto'
      );

      this.deployedContracts.auction = result.contractAddress;
      console.log(`✅ Auction deployed: ${result.contractAddress}`);
      
      return result.contractAddress;
    } catch (error) {
      console.error('❌ Auction deployment failed:', error);
      throw error;
    }
  }

  async deployAll() {
    try {
      console.log('🚀 Starting full deployment to Andromeda mainnet...');
      
      await this.initialize();
      
      // Deploy contracts in dependency order
      await this.deployPropertyDeedNFT();
      await this.deployShareToken();
      await this.deployMarketplace();
      await this.deploySplitter();
      await this.deployStaking();
      await this.deployAuction();

      // Save deployment info
      await this.saveDeploymentInfo();
      
      console.log('✅ All contracts deployed successfully!');
      console.log('📄 Deployment info saved to deployment-info.json');
      
      return this.deployedContracts;
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      throw error;
    }
  }

  async saveDeploymentInfo() {
    const deploymentInfo = {
      network: 'andromeda-1',
      deployer_address: this.deployerAddress,
      deployed_at: new Date().toISOString(),
      contracts: this.deployedContracts,
      gas_used: 'auto',
      transaction_hashes: {} // Would store actual tx hashes
    };

    await fs.writeFile(
      'deployment-info.json',
      JSON.stringify(deploymentInfo, null, 2)
    );

    // Also create environment variables file
    const envVars = `
# Andromeda Contract Addresses
PROPERTY_DEED_NFT_ADDRESS=${this.deployedContracts.propertyDeedNFT}
SHARE_TOKEN_ADDRESS=${this.deployedContracts.shareToken}
MARKETPLACE_ADDRESS=${this.deployedContracts.marketplace}
SPLITTER_ADDRESS=${this.deployedContracts.splitter}
STAKING_ADDRESS=${this.deployedContracts.staking}
AUCTION_ADDRESS=${this.deployedContracts.auction}

# Network Configuration
ANDROMEDA_CHAIN_ID=andromeda-1
ANDROMEDA_RPC_URL=https://rpc.andromeda-1.andromeda.io:443
`.trim();

    await fs.writeFile('.env.contracts', envVars);
  }

  async verifyDeployment() {
    try {
      console.log('🔍 Verifying deployment...');
      
      for (const [contractName, address] of Object.entries(this.deployedContracts)) {
        const contractInfo = await this.client.getContract(address);
        console.log(`✅ ${contractName}: ${address} (Code ID: ${contractInfo.codeId})`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Deployment verification failed:', error);
      return false;
    }
  }
}

// CLI execution
if (require.main === module) {
  const deployer = new AndromedaDeployer();
  
  deployer.deployAll()
    .then(() => {
      console.log('🎉 Deployment completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Deployment failed:', error);
      process.exit(1);
    });
}

module.exports = AndromedaDeployer;
