/**
 * backend/patterns/strategy/payment/MomoPayment.js
 * 📦 CONCRETE STRATEGY - Thanh toán Momo (Mô phỏng)
 */

const EWalletPayment = require('./EWalletPayment');

class MomoPayment extends EWalletPayment {
  constructor() {
    super();
    this.paymentMethod = 'momo';
  }

  validatePaymentDetails(paymentDetails) {
    if (!paymentDetails.phone && !paymentDetails.qrCode) {
      console.warn('⚠️ Momo: No phone or QR provided, using simulation.');
    }
    return true;
  }

  async processPayment(paymentDetails, amount) {
    try {
      console.log(`💳 [Momo] Initiating payment request for ${amount} VND`);
      
      // Giả lập trễ mạng
      await new Promise(r => setTimeout(r, 600));

      const transactionId = `MOMO_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      
      return {
        success: true,
        transactionId,
        paymentMethod: this.paymentMethod,
        amount,
        status: 'pending_confirmation',
        // Link mô phỏng QR Code (Dùng một ảnh mẫu của Momo)
        qrUrl: 'https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png',
        message: 'Please scan the QR code to complete payment',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async refund(transactionId, amount) {
    console.log(`🔄 Momo Refund: ${amount} VND (Transaction: ${transactionId})`);
    return { success: true, refundId: `REFUND_${transactionId}` };
  }
}

module.exports = MomoPayment;
