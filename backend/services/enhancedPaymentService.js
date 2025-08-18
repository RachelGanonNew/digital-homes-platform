const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');
const crypto = require('crypto');

class EnhancedPaymentService {
  constructor() {
    this.stripeClient = stripe;
    this.coinbaseApiKey = process.env.COINBASE_API_KEY;
    this.coinbaseApiSecret = process.env.COINBASE_API_SECRET;
    this.plaidClientId = process.env.PLAID_CLIENT_ID;
    this.plaidSecret = process.env.PLAID_SECRET;
  }

  async createPaymentIntent(amount, currency, paymentMethod, metadata = {}) {
    try {
      switch (paymentMethod) {
        case 'card':
          return await this.createStripePaymentIntent(amount, currency, metadata);
        case 'crypto':
          return await this.createCryptoPayment(amount, currency, metadata);
        case 'bank_transfer':
          return await this.createBankTransfer(amount, currency, metadata);
        default:
          throw new Error('Unsupported payment method');
      }
    } catch (error) {
      console.error('Payment intent creation failed:', error);
      throw error;
    }
  }

  async createStripePaymentIntent(amount, currency, metadata) {
    try {
      const paymentIntent = await this.stripeClient.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          platform: 'digital_homes',
          ...metadata
        },
        description: `Digital Homes property investment - ${metadata.property_id || 'N/A'}`
      });

      return {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: amount,
        currency: currency,
        status: paymentIntent.status,
        payment_method: 'card',
        created_at: new Date(paymentIntent.created * 1000)
      };
    } catch (error) {
      console.error('Stripe payment intent failed:', error);
      throw new Error(`Stripe payment failed: ${error.message}`);
    }
  }

  async createCryptoPayment(amount, currency, metadata) {
    try {
      // Create Coinbase Commerce charge
      const chargeData = {
        name: 'Digital Homes Property Investment',
        description: `Investment in property ${metadata.property_id || 'N/A'}`,
        pricing_type: 'fixed_price',
        local_price: {
          amount: amount.toString(),
          currency: currency
        },
        metadata: {
          platform: 'digital_homes',
          ...metadata
        },
        redirect_url: `${process.env.FRONTEND_URL}/payment/success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
      };

      const response = await axios.post('https://api.commerce.coinbase.com/charges', chargeData, {
        headers: {
          'Content-Type': 'application/json',
          'X-CC-Api-Key': this.coinbaseApiKey,
          'X-CC-Version': '2018-03-22'
        }
      });

      const charge = response.data.data;

      return {
        id: charge.id,
        hosted_url: charge.hosted_url,
        amount: amount,
        currency: currency,
        status: 'pending',
        payment_method: 'crypto',
        addresses: charge.addresses,
        created_at: new Date(charge.created_at)
      };
    } catch (error) {
      console.error('Crypto payment creation failed:', error);
      throw new Error(`Crypto payment failed: ${error.message}`);
    }
  }

  async createBankTransfer(amount, currency, metadata) {
    try {
      // Create Stripe payment intent for bank transfer
      const paymentIntent = await this.stripeClient.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        payment_method_types: ['us_bank_account'],
        metadata: {
          platform: 'digital_homes',
          ...metadata
        }
      });

      return {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: amount,
        currency: currency,
        status: paymentIntent.status,
        payment_method: 'bank_transfer',
        created_at: new Date(paymentIntent.created * 1000)
      };
    } catch (error) {
      console.error('Bank transfer creation failed:', error);
      throw new Error(`Bank transfer failed: ${error.message}`);
    }
  }

  async processRecurringPayment(customerId, amount, currency, interval = 'monthly') {
    try {
      // Create or retrieve customer
      let customer;
      try {
        customer = await this.stripeClient.customers.retrieve(customerId);
      } catch (error) {
        throw new Error('Customer not found');
      }

      // Create subscription for recurring payments
      const subscription = await this.stripeClient.subscriptions.create({
        customer: customerId,
        items: [{
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: 'Digital Homes Recurring Investment'
            },
            unit_amount: Math.round(amount * 100),
            recurring: {
              interval: interval
            }
          }
        }],
        metadata: {
          platform: 'digital_homes',
          payment_type: 'recurring_investment'
        }
      });

      return {
        subscription_id: subscription.id,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        amount: amount,
        currency: currency,
        interval: interval
      };
    } catch (error) {
      console.error('Recurring payment setup failed:', error);
      throw error;
    }
  }

  async distributeDividends(propertyId, totalAmount, shareholders) {
    try {
      const distributions = [];
      
      for (const shareholder of shareholders) {
        const dividendAmount = (shareholder.share_percentage / 100) * totalAmount;
        
        if (dividendAmount < 1) continue; // Skip micro-payments
        
        try {
          const distribution = await this.sendDividend(
            shareholder.user_id,
            dividendAmount,
            'USD',
            {
              property_id: propertyId,
              share_percentage: shareholder.share_percentage,
              distribution_date: new Date().toISOString()
            }
          );
          
          distributions.push({
            user_id: shareholder.user_id,
            amount: dividendAmount,
            status: 'success',
            transaction_id: distribution.id
          });
        } catch (error) {
          distributions.push({
            user_id: shareholder.user_id,
            amount: dividendAmount,
            status: 'failed',
            error: error.message
          });
        }
      }

      return {
        property_id: propertyId,
        total_distributed: distributions
          .filter(d => d.status === 'success')
          .reduce((sum, d) => sum + d.amount, 0),
        successful_distributions: distributions.filter(d => d.status === 'success').length,
        failed_distributions: distributions.filter(d => d.status === 'failed').length,
        distributions: distributions
      };
    } catch (error) {
      console.error('Dividend distribution failed:', error);
      throw error;
    }
  }

  async sendDividend(userId, amount, currency, metadata) {
    try {
      // Get user's preferred payout method
      const payoutMethod = await this.getUserPayoutMethod(userId);
      
      switch (payoutMethod.type) {
        case 'bank_account':
          return await this.sendBankPayout(payoutMethod.account_id, amount, currency, metadata);
        case 'crypto_wallet':
          return await this.sendCryptoPayout(payoutMethod.wallet_address, amount, currency, metadata);
        case 'stripe_account':
          return await this.sendStripePayout(payoutMethod.account_id, amount, currency, metadata);
        default:
          throw new Error('No valid payout method found');
      }
    } catch (error) {
      console.error('Dividend sending failed:', error);
      throw error;
    }
  }

  async sendBankPayout(accountId, amount, currency, metadata) {
    try {
      const transfer = await this.stripeClient.transfers.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        destination: accountId,
        metadata: {
          type: 'dividend_payout',
          ...metadata
        }
      });

      return {
        id: transfer.id,
        amount: amount,
        currency: currency,
        status: 'pending',
        created_at: new Date(transfer.created * 1000)
      };
    } catch (error) {
      console.error('Bank payout failed:', error);
      throw error;
    }
  }

  async sendCryptoPayout(walletAddress, amount, currency, metadata) {
    try {
      // Use Coinbase Commerce or similar for crypto payouts
      const payout = {
        id: `crypto_${Date.now()}`,
        wallet_address: walletAddress,
        amount: amount,
        currency: currency,
        status: 'pending',
        created_at: new Date()
      };

      // In production, integrate with actual crypto payout service
      console.log('Crypto payout initiated:', payout);
      
      return payout;
    } catch (error) {
      console.error('Crypto payout failed:', error);
      throw error;
    }
  }

  async sendStripePayout(accountId, amount, currency, metadata) {
    try {
      const payout = await this.stripeClient.payouts.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        metadata: {
          type: 'dividend_payout',
          ...metadata
        }
      }, {
        stripeAccount: accountId
      });

      return {
        id: payout.id,
        amount: amount,
        currency: currency,
        status: payout.status,
        created_at: new Date(payout.created * 1000)
      };
    } catch (error) {
      console.error('Stripe payout failed:', error);
      throw error;
    }
  }

  async getUserPayoutMethod(userId) {
    try {
      // Query database for user's payout preferences
      // Mock implementation
      return {
        type: 'bank_account',
        account_id: 'acct_test123',
        verified: true,
        default: true
      };
    } catch (error) {
      console.error('Payout method retrieval failed:', error);
      throw error;
    }
  }

  async createConnectedAccount(userInfo) {
    try {
      const account = await this.stripeClient.accounts.create({
        type: 'express',
        country: userInfo.country || 'US',
        email: userInfo.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        business_type: 'individual',
        individual: {
          first_name: userInfo.firstName,
          last_name: userInfo.lastName,
          email: userInfo.email,
          phone: userInfo.phone,
          dob: {
            day: userInfo.dateOfBirth?.day,
            month: userInfo.dateOfBirth?.month,
            year: userInfo.dateOfBirth?.year
          }
        },
        metadata: {
          platform: 'digital_homes',
          user_id: userInfo.userId
        }
      });

      // Create account link for onboarding
      const accountLink = await this.stripeClient.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.FRONTEND_URL}/account/stripe/refresh`,
        return_url: `${process.env.FRONTEND_URL}/account/stripe/return`,
        type: 'account_onboarding'
      });

      return {
        account_id: account.id,
        onboarding_url: accountLink.url,
        created_at: new Date(account.created * 1000)
      };
    } catch (error) {
      console.error('Connected account creation failed:', error);
      throw error;
    }
  }

  async verifyPayment(paymentId, paymentMethod) {
    try {
      switch (paymentMethod) {
        case 'card':
        case 'bank_transfer':
          return await this.verifyStripePayment(paymentId);
        case 'crypto':
          return await this.verifyCryptoPayment(paymentId);
        default:
          throw new Error('Unsupported payment method for verification');
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
      throw error;
    }
  }

  async verifyStripePayment(paymentIntentId) {
    try {
      const paymentIntent = await this.stripeClient.paymentIntents.retrieve(paymentIntentId);
      
      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        verified: paymentIntent.status === 'succeeded',
        created_at: new Date(paymentIntent.created * 1000)
      };
    } catch (error) {
      console.error('Stripe payment verification failed:', error);
      throw error;
    }
  }

  async verifyCryptoPayment(chargeId) {
    try {
      const response = await axios.get(`https://api.commerce.coinbase.com/charges/${chargeId}`, {
        headers: {
          'X-CC-Api-Key': this.coinbaseApiKey,
          'X-CC-Version': '2018-03-22'
        }
      });

      const charge = response.data.data;
      
      return {
        id: charge.id,
        status: charge.timeline[charge.timeline.length - 1].status,
        amount: parseFloat(charge.pricing.local.amount),
        currency: charge.pricing.local.currency,
        verified: charge.timeline.some(t => t.status === 'COMPLETED'),
        created_at: new Date(charge.created_at)
      };
    } catch (error) {
      console.error('Crypto payment verification failed:', error);
      throw error;
    }
  }

  async handleWebhook(payload, signature, webhookSecret) {
    try {
      let event;
      
      if (webhookSecret.startsWith('whsec_')) {
        // Stripe webhook
        event = this.stripeClient.webhooks.constructEvent(payload, signature, webhookSecret);
        return await this.handleStripeWebhook(event);
      } else {
        // Coinbase webhook
        const computedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(payload)
          .digest('hex');
        
        if (computedSignature !== signature) {
          throw new Error('Invalid webhook signature');
        }
        
        const event = JSON.parse(payload);
        return await this.handleCoinbaseWebhook(event);
      }
    } catch (error) {
      console.error('Webhook handling failed:', error);
      throw error;
    }
  }

  async handleStripeWebhook(event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          return await this.processSuccessfulPayment(event.data.object);
        case 'payment_intent.payment_failed':
          return await this.processFailedPayment(event.data.object);
        case 'account.updated':
          return await this.processAccountUpdate(event.data.object);
        default:
          console.log(`Unhandled Stripe event type: ${event.type}`);
          return { processed: false };
      }
    } catch (error) {
      console.error('Stripe webhook processing failed:', error);
      throw error;
    }
  }

  async handleCoinbaseWebhook(event) {
    try {
      switch (event.type) {
        case 'charge:confirmed':
          return await this.processCryptoPaymentConfirmed(event.data);
        case 'charge:failed':
          return await this.processCryptoPaymentFailed(event.data);
        default:
          console.log(`Unhandled Coinbase event type: ${event.type}`);
          return { processed: false };
      }
    } catch (error) {
      console.error('Coinbase webhook processing failed:', error);
      throw error;
    }
  }

  async processSuccessfulPayment(paymentIntent) {
    // Update database, trigger share allocation, send confirmation
    console.log('Processing successful payment:', paymentIntent.id);
    return { processed: true, action: 'payment_confirmed' };
  }

  async processFailedPayment(paymentIntent) {
    // Handle failed payment, notify user, update records
    console.log('Processing failed payment:', paymentIntent.id);
    return { processed: true, action: 'payment_failed' };
  }

  async processAccountUpdate(account) {
    // Update user's connected account status
    console.log('Processing account update:', account.id);
    return { processed: true, action: 'account_updated' };
  }

  async processCryptoPaymentConfirmed(charge) {
    // Process confirmed crypto payment
    console.log('Processing crypto payment confirmation:', charge.id);
    return { processed: true, action: 'crypto_payment_confirmed' };
  }

  async processCryptoPaymentFailed(charge) {
    // Handle failed crypto payment
    console.log('Processing crypto payment failure:', charge.id);
    return { processed: true, action: 'crypto_payment_failed' };
  }
}

module.exports = EnhancedPaymentService;
