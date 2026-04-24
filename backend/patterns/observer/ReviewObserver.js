/**
 * backend/patterns/observer/ReviewObserver.js
 * 🟢 PURE - WebSocket review observer (framework-agnostic)
 * Organized into patterns/observer
 */

const Observer = require('./Observer');

class ReviewObserver extends Observer {
  static #instance = null;
  #productSubscriptions = new Map();

  constructor() {
    super();
    if (ReviewObserver.#instance !== null) {
      throw new Error('❌ ReviewObserver is Singleton');
    }
    console.log('✅ [ReviewObserver] Singleton instance created');
  }

  static getInstance() {
    if (ReviewObserver.#instance === null) {
      ReviewObserver.#instance = new ReviewObserver();
    }
    return ReviewObserver.#instance;
  }

  subscribeToProduct(productId, callback) {
    const observer = this.#getOrCreateObserver(productId);
    return observer.subscribe(callback);
  }

  broadcastNewReview(productId, review) {
    const observer = this.#getOrCreateObserver(productId);
    const event = {
      type: 'review:new',
      productId,
      data: review,
      timestamp: new Date().toISOString(),
    };
    
    console.log(`🔔 [ReviewObserver] Broadcasting NEW review for Product: ${productId}`);
    observer.notify(event);
    this.notify(event);
  }

  broadcastUpdateReview(productId, review) {
    const observer = this.#getOrCreateObserver(productId);
    const event = {
      type: 'review:updated',
      productId,
      data: review,
      timestamp: new Date().toISOString(),
    };
    
    console.log(`🔔 [ReviewObserver] Broadcasting UPDATED review for Product: ${productId}`);
    observer.notify(event);
    this.notify(event);
  }

  broadcastDeleteReview(productId, reviewId) {
    const observer = this.#getOrCreateObserver(productId);
    const event = {
      type: 'review:deleted',
      productId,
      data: { id: reviewId },
      timestamp: new Date().toISOString(),
    };
    
    console.log(`🔔 [ReviewObserver] Broadcasting DELETED review for Product: ${productId}`);
    observer.notify(event);
    this.notify(event);
  }

  #getOrCreateObserver(productId) {
    const key = String(productId);

    if (!this.#productSubscriptions.has(key)) {
      this.#productSubscriptions.set(key, new Observer());
      console.log(`✅ [ReviewObserver] Created observer for product: ${productId}`);
    }

    return this.#productSubscriptions.get(key);
  }

  unsubscribeFromProduct(productId) {
    const key = String(productId);
    this.#productSubscriptions.delete(key);
    console.log(`❌ [ReviewObserver] Unsubscribed from product: ${productId}`);
  }

  getSubscriptionCount(productId) {
    const key = String(productId);
    const observer = this.#productSubscriptions.get(key);
    return observer ? observer.getListenerCount() : 0;
  }

  getSubscribedProducts() {
    return Array.from(this.#productSubscriptions.keys());
  }

  clearAll() {
    this.#productSubscriptions.clear();
    console.log('🧹 [ReviewObserver] All subscriptions cleared');
  }
}

module.exports = ReviewObserver;
