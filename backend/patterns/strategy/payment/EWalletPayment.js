/**
 * backend/patterns/strategy/payment/EWalletPayment.js
 * Implement thanh toán bằng ví điện tử (PayPal, Momo, Zalo Pay, v.v.)
 * Organized into patterns/strategy/payment
 */

const PaymentStrategy = require('./PaymentStrategy');

class EWalletPayment extends PaymentStrategy {
  constructor() {
    super();
    this.paymentMethod = 'ewallet';
    this.supportedWallets = ['PayPal', 'Google Pay', 'Apple Pay', 'Momo', 'ZaloPay', 'VNPay'];
  }

  validatePaymentDetails(paymentDetails) {
    const { walletType, walletEmail, walletPhone } = paymentDetails;
    if (!this.supportedWallets.includes(walletType)) {
      throw new Error(`Wallet type must be one of: ${this.supportedWallets.join(', ')}`);
    }
    if (!walletEmail && !walletPhone) {
      throw new Error('Wallet email or phone is required');
    }
    if (walletEmail && !this._isValidEmail(walletEmail)) {
      throw new Error('Invalid wallet email address');
    }
    if (walletPhone && !this._isValidPhone(walletPhone)) {
      throw new Error('Invalid wallet phone number');
    }
    return true;
  }

  async processPayment(paymentDetails, amount) {
    try {
      this.validatePaymentDetails(paymentDetails);
      console.log(`💳 Processing E-Wallet Payment: ${amount} VND via ${paymentDetails.walletType}`);
      const transactionId = this._generateTransactionId();
      await this._simulatePaymentProcessing();

      return {
        success: true,
        transactionId,
        paymentMethod: this.paymentMethod,
        walletType: paymentDetails.walletType,
        amount,
        timestamp: new Date().toISOString(),
        walletEmail: paymentDetails.walletEmail || 'hidden',
        status: 'completed',
        processingTime: '2-5 seconds',
      };
    } catch (error) {
      console.error('❌ E-Wallet Payment Failed:', error.message);
      return {
        success: false,
        error: error.message,
        paymentMethod: this.paymentMethod,
      };
    }
  }

  async refund(transactionId, amount) {
    try {
      console.log(`🔄 Refunding E-Wallet Payment: ${amount} VND (Transaction: ${transactionId})`);
      await this._simulatePaymentProcessing();
      return {
        success: true,
        refundId: this._generateTransactionId(),
        originalTransaction: transactionId,
        amount,
        timestamp: new Date().toISOString(),
        status: 'completed',
      };
    } catch (error) {
      console.error('❌ E-Wallet Refund Failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  _isValidPhone(phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  _generateTransactionId() {
    return `EW_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async _simulatePaymentProcessing() {
    return new Promise((resolve) => { setTimeout(() => resolve(), 800); });
  }
}

module.exports = EWalletPayment;
