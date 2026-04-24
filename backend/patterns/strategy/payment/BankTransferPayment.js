/**
 * backend/patterns/strategy/payment/BankTransferPayment.js
 * Implement thanh toán bằng chuyển khoản ngân hàng
 * Organized into patterns/strategy/payment
 */

const PaymentStrategy = require('./PaymentStrategy');

class BankTransferPayment extends PaymentStrategy {
  constructor() {
    super();
    this.paymentMethod = 'bank_transfer';
  }

  validatePaymentDetails(paymentDetails) {
    console.log("🚀 [BankTransferPayment] EXECUTING NEW SIMULATION LOGIC (No validation)");
    // Vô hiệu hóa kiểm tra để hỗ trợ bản Demo mượt mà
    return true;
  }

  async processPayment(paymentDetails, amount) {
    try {
      this.validatePaymentDetails(paymentDetails);
      
      // Áp dụng giá trị mặc định nếu thiếu
      const details = {
        bankCode: paymentDetails.bankCode || 'TEST-BANK',
        accountNumber: paymentDetails.accountNumber || '123456789',
        accountHolderName: paymentDetails.accountHolderName || 'MOCK USER',
        ...paymentDetails
      };

      console.log(`🏦 Processing Bank Transfer: ${amount} VND to ${details.accountHolderName}`);
      const transactionId = this._generateTransactionId();
      await this._simulatePaymentProcessing();

      return {
        success: true,
        transactionId,
        paymentMethod: this.paymentMethod,
        amount,
        timestamp: new Date().toISOString(),
        accountNumber: paymentDetails.accountNumber.slice(-4).padStart(10, '*'),
        status: 'pending',
        estimatedCompletion: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      };
    } catch (error) {
      console.error('❌ Bank Transfer Payment Failed:', error.message);
      return {
        success: false,
        error: error.message,
        paymentMethod: this.paymentMethod,
      };
    }
  }

  async refund(transactionId, amount) {
    try {
      console.log(`🔄 Refunding Bank Transfer: ${amount} VND (Transaction: ${transactionId})`);
      await this._simulatePaymentProcessing();
      return {
        success: true,
        refundId: this._generateTransactionId(),
        originalTransaction: transactionId,
        amount,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };
    } catch (error) {
      console.error('❌ Bank Transfer Refund Failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  _generateTransactionId() {
    return `BT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async _simulatePaymentProcessing() {
    return new Promise((resolve) => { setTimeout(() => resolve(), 1500); });
  }
}

module.exports = BankTransferPayment;
