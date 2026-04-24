/**
 * backend/patterns/strategy/payment/PaymentProcessor.js
 * Context class sử dụng Strategy pattern
 * Organized into patterns/strategy/payment
 */

const CreditCardPayment = require('./CreditCardPayment');
const BankTransferPayment = require('./BankTransferPayment');
const EWalletPayment = require('./EWalletPayment');
const CashOnDeliveryPayment = require('./CashOnDeliveryPayment');
const MomoPayment = require('./MomoPayment');
const VnpayPayment = require('./VnpayPayment');

class PaymentProcessor {
  constructor(strategy = null) {
    this.strategy = strategy;
  }

  setStrategy(strategy) {
    if (!strategy) {
      throw new Error('Strategy cannot be null');
    }
    this.strategy = strategy;
    console.log(`✅ Strategy changed to: ${strategy.constructor.name}`);
  }

  getStrategyByType(paymentMethod) {
    const method = paymentMethod.toLowerCase().replace(/\s+/g, '_');
    
    switch (method) {
      case 'credit_card':
      case 'creditcard':
      case 'card':
        return new CreditCardPayment();
      case 'bank_transfer':
      case 'banktransfer':
      case 'bank':
        return new BankTransferPayment();
      case 'ewallet':
      case 'wallet':
      case 'e_wallet':
      case 'paypal':
      case 'zalopay':
        return new EWalletPayment();
      case 'vnpay':
        return new VnpayPayment();
      case 'momo':
        return new MomoPayment();
      case 'cod':
      case 'cash':
        return new CashOnDeliveryPayment();
      default:
        throw new Error(`Unknown payment method: ${paymentMethod}`);
    }
  }

  async processPayment(paymentMethod, paymentDetails, amount) {
    try {
      if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      const strategy = this.getStrategyByType(paymentMethod);
      this.setStrategy(strategy);

      return await this.strategy.processPayment(paymentDetails, amount);
    } catch (error) {
      console.error('❌ Payment Processing Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async refundPayment(transactionId, amount) {
    try {
      if (!this.strategy) {
        throw new Error('No payment strategy set. Process a payment first.');
      }
      return await this.strategy.refund(transactionId, amount);
    } catch (error) {
      console.error('❌ Refund Processing Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  getSupportedPaymentMethods() {
    return ['credit_card', 'bank_transfer', 'ewallet'];
  }
}

module.exports = PaymentProcessor;
