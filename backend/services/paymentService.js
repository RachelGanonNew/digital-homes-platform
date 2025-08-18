const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');

class PaymentService {
  constructor() {
    this.stripeClient = stripe;
    this.coinbaseApiKey = process.env.COINBASE_API_KEY;
    this.coinbaseSecret = process.env.COINBASE_SECRET;
  }

  async createPaymentIntent(amount, currency = 'usd', metadata = {}) {
    try {
      const paymentIntent = await this.stripeClient.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata: {
          platform: 'digital_homes',
          ...metadata
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency
      };
    } catch (error) {
      console.error('Stripe payment intent creation failed:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  async confirmPayment(paymentIntentId) {
    try {
      const paymentIntent = await this.stripeClient.paymentIntents.retrieve(paymentIntentId);
      
      return {
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        payment_method: paymentIntent.payment_method,
        metadata: paymentIntent.metadata
      };
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      throw new Error('Failed to confirm payment');
    }
  }

  async createCryptoPayment(amount, currency = 'USDC') {
    try {
      // Coinbase Commerce integration for crypto payments
      const response = await axios.post('https://api.commerce.coinbase.com/charges', {
        name: 'Digital Homes Property Investment',
        description: 'Purchase of fractional property shares',
        pricing_type: 'fixed_price',
        local_price: {
          amount: amount.toString(),
          currency: 'USD'
        },
        requested_info: ['email']
      }, {
        headers: {
          'X-CC-Api-Key': this.coinbaseApiKey,
          'X-CC-Version': '2018-03-22',
          'Content-Type': 'application/json'
        }
      });

      return {
        charge_id: response.data.data.id,
        hosted_url: response.data.data.hosted_url,
        payment_addresses: response.data.data.addresses,
        expires_at: response.data.data.expires_at
      };
    } catch (error) {
      console.error('Crypto payment creation failed:', error);
      throw new Error('Failed to create crypto payment');
    }
  }

  async processBankTransfer(amount, bankDetails, metadata = {}) {
    try {
      // Plaid integration for bank transfers
      const response = await axios.post('https://production.plaid.com/payment_initiation/payment/create', {
        recipient_id: process.env.PLAID_RECIPIENT_ID,
        reference: `DH_${metadata.property_id}_${Date.now()}`,
        amount: {
          currency: 'USD',
          value: amount.toString()
        },
        schedule: {
          interval: 'ONCE',
          interval_execution_day: null,
          start_date: new Date().toISOString().split('T')[0]
        }
      }, {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
          'PLAID-SECRET': process.env.PLAID_SECRET,
          'Content-Type': 'application/json'
        }
      });

      return {
        payment_id: response.data.payment_id,
        status: response.data.status,
        amount: amount,
        reference: response.data.reference
      };
    } catch (error) {
      console.error('Bank transfer failed:', error);
      throw new Error('Failed to process bank transfer');
    }
  }

  async distributeDividends(propertyId, totalAmount, shareholders) {
    try {
      const distributions = [];

      for (const shareholder of shareholders) {
        const dividendAmount = (shareholder.shares / shareholder.total_shares) * totalAmount;
        
        // Create Stripe transfer to shareholder
        const transfer = await this.stripeClient.transfers.create({
          amount: Math.round(dividendAmount * 100),
          currency: 'usd',
          destination: shareholder.stripe_account_id,
          metadata: {
            property_id: propertyId,
            dividend_distribution: 'true',
            shares: shareholder.shares.toString()
          }
        });

        distributions.push({
          user_address: shareholder.address,
          amount: dividendAmount,
          shares: shareholder.shares,
          transfer_id: transfer.id,
          status: transfer.status
        });
      }

      return {
        total_distributed: totalAmount,
        distributions,
        distribution_date: new Date()
      };
    } catch (error) {
      console.error('Dividend distribution failed:', error);
      throw new Error('Failed to distribute dividends');
    }
  }

  async createConnectedAccount(userInfo) {
    try {
      // Create Stripe Connected Account for dividend payouts
      const account = await this.stripeClient.accounts.create({
        type: 'express',
        country: userInfo.country || 'US',
        email: userInfo.email,
        capabilities: {
          transfers: { requested: true }
        },
        business_profile: {
          mcc: '6211', // Investment services
          product_description: 'Real estate investment dividends'
        }
      });

      // Create account link for onboarding
      const accountLink = await this.stripeClient.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.FRONTEND_URL}/dashboard?refresh=true`,
        return_url: `${process.env.FRONTEND_URL}/dashboard?connected=true`,
        type: 'account_onboarding'
      });

      return {
        account_id: account.id,
        onboarding_url: accountLink.url,
        expires_at: accountLink.expires_at
      };
    } catch (error) {
      console.error('Connected account creation failed:', error);
      throw new Error('Failed to create payout account');
    }
  }

  async validatePayment(paymentId, expectedAmount) {
    try {
      const payment = await this.stripeClient.paymentIntents.retrieve(paymentId);
      
      const isValid = payment.status === 'succeeded' && 
                     payment.amount === Math.round(expectedAmount * 100);

      return {
        valid: isValid,
        status: payment.status,
        amount: payment.amount / 100,
        payment_method: payment.payment_method
      };
    } catch (error) {
      console.error('Payment validation failed:', error);
      return { valid: false, error: error.message };
    }
  }
}

module.exports = PaymentService;
