/**
 * backend/patterns/strategy/payment/CreditCardPayment.js
 * Implement thanh toán bằng thẻ tín dụng
 * Organized into patterns/strategy/payment
 */

const PaymentStrategy = require('./PaymentStrategy');

class CreditCardPayment extends PaymentStrategy {
  constructor() {
    super();
    this.paymentMethod = 'credit_card';
  }

  validatePaymentDetails(paymentDetails) {
    console.log("🚀 [CreditCardPayment] EXECUTING NEW SIMULATION LOGIC (No validation)");
    // Vô hiệu hóa kiểm tra để hỗ trợ bản Demo mượt mà
    return true;
  }

  async processPayment(paymentDetails, amount) {
    try {
      this.validatePaymentDetails(paymentDetails);
      
      // Áp dụng giá trị mặc định nếu thiếu
      const details = {
        cardNumber: paymentDetails.cardNumber || '1234567890123456',
        cardholderName: paymentDetails.cardholderName || 'MOCK USER',
        ...paymentDetails
      };

      console.log(`🎫 Processing Credit Card Payment: ${amount} VND from ${details.cardholderName}`);
      const transactionId = this._generateTransactionId();
      await this._simulatePaymentProcessing();

      return {
        success: true,
        transactionId,
        paymentMethod: this.paymentMethod,
        amount,
        timestamp: new Date().toISOString(),
        last4Digits: paymentDetails.cardNumber.slice(-4),
        status: 'completed',
      };
    } catch (error) {
      console.error('❌ Credit Card Payment Failed:', error.message);
      return {
        success: false,
        error: error.message,
        paymentMethod: this.paymentMethod,
      };
    }
  }

  async refund(transactionId, amount) {
    try {
      console.log(`🔄 Refunding Credit Card Payment: ${amount} VND (Transaction: ${transactionId})`);
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
      console.error('❌ Credit Card Refund Failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  _generateTransactionId() {
    return `CC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async _simulatePaymentProcessing() {
    return new Promise((resolve) => { setTimeout(() => resolve(), 1000); });
  }
}

module.exports = CreditCardPayment;
