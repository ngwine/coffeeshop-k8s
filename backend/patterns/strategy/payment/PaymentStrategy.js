/**
 * backend/patterns/strategy/payment/PaymentStrategy.js
 * Base abstract class cho tất cả payment strategies
 */

class PaymentStrategy {
  async processPayment(paymentDetails, amount) {
    throw new Error('Method processPayment() must be implemented');
  }

  validatePaymentDetails(paymentDetails) {
    throw new Error('Method validatePaymentDetails() must be implemented');
  }
  
  async refund(transactionId, amount) {
    throw new Error('Method refund() must be implemented');
  }
}

module.exports = PaymentStrategy;
