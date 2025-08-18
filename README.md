# Digital Homes - AI-Powered Fractionalized Real Estate Investment Platform

## Overview
Digital Homes is an innovative platform that makes real estate investment accessible to everyone through AI-powered property valuation and blockchain tokenization on the Andromeda Protocol.

## Key Features
- **AI Property Valuation**: Smart algorithms analyze market data, neighborhood trends, and property metrics
- **Fractionalized Ownership**: Properties tokenized into CW721 deed tokens and CW20 share tokens
- **Marketplace**: Buy and sell property shares seamlessly
- **Automatic Payouts**: Smart distribution of rental income and profits
- **Staking Rewards**: Earn bonuses by locking up your shares
- **Transparent Operations**: All transactions and property data on-chain

## Technology Stack
- **Frontend**: React.js with modern UI/UX
- **Backend**: Node.js with Express
- **AI/ML**: Python with TensorFlow for property valuation
- **Blockchain**: Andromeda Protocol ADOs (CW721, CW20, Marketplace, Splitter)
- **Database**: MongoDB for property metadata
- **APIs**: Real estate data integration

## Project Structure
```
digital-homes-platform/
├── frontend/              # React web application
├── backend/              # Node.js API server
├── ai-valuation/         # Python ML models
├── smart-contracts/      # Andromeda ADO configurations
├── docs/                 # Documentation
└── deployment/           # Deployment scripts
```

## Getting Started

### Prerequisites
- Node.js 16+
- Python 3.8+
- MongoDB Atlas account
- Keplr wallet with Andromeda testnet

### Quick Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables (see below)
4. Initialize database: `cd backend && npm run init-db`
5. Run platform: `npm run dev`

### Environment Configuration
The platform uses GitHub Secrets for secure configuration. For local development, set these environment variables:

**Required:**
- `MONGODB_URI` - Your MongoDB Atlas connection string
- `JWT_SECRET` - Secure string for authentication
- `ANDROMEDA_MNEMONIC` - Your Keplr testnet wallet mnemonic

**Optional (demo values work):**
- `REAL_ESTATE_API_KEY=demo_key`
- `MAPS_API_KEY=demo_key`
- `STRIPE_SECRET_KEY=sk_test_demo`

**Testnet Configuration:**
- RPC: `https://rpc.galileo-3.andromeda.io:443`
- Chain ID: `galileo-3`

## Hackathon Submission
Built for the Andromeda Flightplan Hackathon - Track 1: Real World Assets
# digital-homes-platform
