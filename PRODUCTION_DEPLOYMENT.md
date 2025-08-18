# Digital Homes - Production Deployment Guide

## Overview
This guide covers deploying the Digital Homes AI-powered real estate platform to production environments.

## Prerequisites

### Required Accounts & API Keys
- **Andromeda Protocol**: Mainnet wallet with ANDR tokens for contract deployment
- **MongoDB Atlas**: Production database cluster
- **Stripe**: Live API keys for payment processing
- **Coinbase Commerce**: API keys for crypto payments
- **Plaid**: Production API keys for bank connections
- **Real Estate APIs**: RentSpree, Zillow, WalkScore API keys
- **Economic Data**: FRED API key, Polygon.io API key
- **Cloud Provider**: AWS/GCP/Azure for hosting

### Environment Variables

#### Backend (.env)
```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/digitalhomes

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key

# Andromeda Blockchain
ANDROMEDA_RPC_URL=https://rpc.andromeda-1.andromeda.io:443
ANDROMEDA_CHAIN_ID=andromeda-1
ANDROMEDA_MNEMONIC=your-deployment-wallet-mnemonic

# Smart Contract Addresses (from deployment)
PROPERTY_DEED_NFT_ADDRESS=andr1...
SHARE_TOKEN_ADDRESS=andr1...
MARKETPLACE_ADDRESS=andr1...
SPLITTER_ADDRESS=andr1...
STAKING_ADDRESS=andr1...
AUCTION_ADDRESS=andr1...

# Payment Processing
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
COINBASE_API_KEY=your-coinbase-api-key
COINBASE_API_SECRET=your-coinbase-api-secret
COINBASE_WEBHOOK_SECRET=your-coinbase-webhook-secret
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret

# Real Estate APIs
RENTSPREE_API_KEY=your-rentspree-api-key
ZILLOW_API_KEY=your-zillow-api-key
WALKSCORE_API_KEY=your-walkscore-api-key

# Economic Data APIs
FRED_API_KEY=your-fred-api-key
POLYGON_API_KEY=your-polygon-api-key
RAPIDAPI_KEY=your-rapidapi-key

# Application
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://digitalhomes.com
```

#### Frontend (.env.production)
```bash
REACT_APP_API_URL=https://api.digitalhomes.com
REACT_APP_AI_SERVICE_URL=https://ai.digitalhomes.com
REACT_APP_ANDROMEDA_CHAIN_ID=andromeda-1
REACT_APP_ANDROMEDA_RPC_URL=https://rpc.andromeda-1.andromeda.io:443
REACT_APP_SHARE_TOKEN_ADDRESS=andr1...
REACT_APP_MARKETPLACE_ADDRESS=andr1...
REACT_APP_STAKING_ADDRESS=andr1...
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## Deployment Steps

### 1. Smart Contract Deployment
```bash
cd smart-contracts
node deploy.js
```
This will:
- Deploy all Andromeda ADO contracts to mainnet
- Generate deployment-info.json with contract addresses
- Create .env.contracts file with environment variables

### 2. Database Setup
```bash
# Create production database
# Import initial data if needed
mongoimport --uri="$MONGODB_URI" --collection=properties --file=data/initial-properties.json
```

### 3. Backend Deployment
```bash
cd backend
npm install --production
npm run build
pm2 start ecosystem.config.js --env production
```

### 4. AI Service Deployment
```bash
cd ai-valuation
pip install -r requirements.txt
gunicorn --bind 0.0.0.0:5001 --workers 4 app:app
```

### 5. Frontend Deployment
```bash
cd frontend
npm install
npm run build
# Deploy build/ folder to CDN or static hosting
```

## Infrastructure Requirements

### Recommended Architecture
- **Load Balancer**: Nginx or AWS ALB
- **Backend**: 2+ instances (PM2 cluster mode)
- **AI Service**: 2+ instances with GPU support
- **Database**: MongoDB Atlas M30+ cluster
- **CDN**: CloudFlare or AWS CloudFront for frontend
- **Monitoring**: DataDog, New Relic, or custom dashboard

### Security Considerations
- SSL/TLS certificates for all endpoints
- API rate limiting and DDoS protection
- Database encryption at rest and in transit
- Secure key management (AWS KMS, HashiCorp Vault)
- Regular security audits and penetration testing

### Compliance Requirements
- SOC 2 Type II certification
- PCI DSS compliance for payment processing
- GDPR compliance for EU users
- SEC registration and reporting
- State securities law compliance

## Monitoring & Alerting

### Key Metrics to Monitor
- API response times and error rates
- Database performance and connection health
- Blockchain transaction success rates
- Payment processing success rates
- User authentication and KYC completion rates
- System resource utilization

### Alert Thresholds
- API response time > 2 seconds
- Error rate > 5%
- Memory usage > 85%
- CPU usage > 80%
- Failed transactions > 2%

## Backup & Recovery

### Database Backups
- Automated daily backups to encrypted storage
- Point-in-time recovery capability
- Cross-region backup replication
- Regular restore testing

### Application Backups
- Source code in version control
- Environment configurations in secure storage
- Smart contract code and deployment artifacts
- Documentation and runbooks

## Legal & Regulatory Compliance

### Required Filings
- SEC Form D for Regulation D offerings
- State blue sky law notices
- FinCEN reporting for large transactions
- Annual compliance reports

### Ongoing Obligations
- Quarterly investor reports
- Annual audited financial statements
- Material change notifications
- Regulatory examination cooperation

## Performance Optimization

### Backend Optimizations
- Database indexing strategy
- API response caching
- Connection pooling
- Background job processing

### Frontend Optimizations
- Code splitting and lazy loading
- Image optimization and compression
- CDN for static assets
- Progressive Web App features

### AI Service Optimizations
- Model caching and preloading
- Batch prediction processing
- GPU utilization optimization
- Model versioning and A/B testing

## Disaster Recovery Plan

### RTO/RPO Targets
- Recovery Time Objective (RTO): 4 hours
- Recovery Point Objective (RPO): 1 hour

### Failover Procedures
1. Activate backup infrastructure
2. Restore database from latest backup
3. Deploy application from version control
4. Update DNS to point to backup environment
5. Verify all services operational
6. Communicate status to users

## Support & Maintenance

### 24/7 Support Coverage
- On-call rotation for critical issues
- Escalation procedures for security incidents
- User support ticketing system
- Documentation and knowledge base

### Regular Maintenance
- Weekly security updates
- Monthly dependency updates
- Quarterly security audits
- Annual compliance reviews

## Cost Optimization

### Infrastructure Costs
- Auto-scaling based on demand
- Reserved instances for predictable workloads
- Spot instances for batch processing
- Regular cost analysis and optimization

### Third-Party Service Costs
- API usage monitoring and optimization
- Payment processing fee analysis
- Blockchain transaction cost optimization
- Data storage lifecycle management

## Launch Checklist

### Pre-Launch
- [ ] All smart contracts deployed and verified
- [ ] Production database configured and seeded
- [ ] All API keys and secrets configured
- [ ] SSL certificates installed
- [ ] Monitoring and alerting configured
- [ ] Backup systems tested
- [ ] Security audit completed
- [ ] Legal compliance verified
- [ ] Load testing completed
- [ ] Documentation updated

### Launch Day
- [ ] Final deployment to production
- [ ] DNS cutover to production
- [ ] Monitoring dashboard active
- [ ] Support team on standby
- [ ] User communication sent
- [ ] Performance metrics baseline established

### Post-Launch
- [ ] Monitor for 48 hours continuously
- [ ] Address any performance issues
- [ ] Collect user feedback
- [ ] Plan next iteration
- [ ] Update documentation with lessons learned

## Contact Information
- **Technical Lead**: dev@digitalhomes.com
- **Compliance Officer**: compliance@digitalhomes.com
- **Security Team**: security@digitalhomes.com
- **Emergency Hotline**: +1-555-EMERGENCY
