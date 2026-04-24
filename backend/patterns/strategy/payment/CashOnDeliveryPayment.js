/**
 * backend/patterns/strategy/payment/CashOnDeliveryPayment.js
 * 📦 CONCRETE STRATEGY - Thanh toán khi nhận hàng (COD)
 */

const PaymentStrategy = require('./PaymentStrategy');

class CashOnDeliveryPayment extends PaymentStrategy {
  constructor() {
    super();
    this.paymentMethod = 'cod';
  }

  /**
   * COD không yêu cầu validate thông tin thanh toán phức tạp
   */
  validatePaymentDetails(paymentDetails) {
    return true;
  }

  /**
   * Xử lý thanh toán COD: Chỉ đơn giản là xác nhận đơn hàng
   * Trạng thái thanh toán ban đầu sẽ là 'unpaid'
   */
  async processPayment(paymentDetails, amount) {
    try {
      console.log(`💵 Order created with COD: ${amount} VND. Payment expected on delivery.`);
      
      return {
        success: true,
        transactionId: `COD_${Date.now()}`,
        paymentMethod: this.paymentMethod,
        amount,
        status: 'pending', // Đợi giao hàng mới thu tiền
        message: 'Payment will be collected upon delivery',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        paymentMethod: this.paymentMethod,
      };
    }
  }

  async refund(transactionId, amount) {
    console.log(`🔄 COD Refund (Manual process): ${amount} VND for ${transactionId}`);
    return {
      success: true,
      message: 'COD refund must be handled manually via cash or transfer',
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = CashOnDeliveryPayment;
