/**
 * backend/patterns/strategy/payment/VnpayPayment.js
 * 📦 CONCRETE STRATEGY - Thanh toán VNPAY (Mô phỏng)
 */

const EWalletPayment = require('./EWalletPayment');

class VnpayPayment extends EWalletPayment {
  constructor() {
    super();
    this.paymentMethod = 'vnpay';
  }

  validatePaymentDetails(paymentDetails) {
    return true;
  }

  async processPayment(paymentDetails, amount) {
    try {
      console.log(`💳 [VNPAY] Generating payment URL for ${amount} VND`);
      
      await new Promise(r => setTimeout(r, 500));

      const transactionId = `VNPAY_${Date.now()}`;
      
      return {
        success: true,
        transactionId,
        paymentMethod: this.paymentMethod,
        amount,
        status: 'redirecting',
        // Link mô phỏng redirect
        redirectUrl: 'https://vnpay.vn/',
        message: 'Redirecting to VNPAY Secure Gateway...',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async refund(transactionId, amount) {
    return { success: true, message: 'VNPAY refund processed' };
  }
}

module.exports = VnpayPayment;
