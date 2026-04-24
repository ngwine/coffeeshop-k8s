/**
 * backend/patterns/observer/CartObserver.js
 * 🛒 CONCRETE OBSERVER - Thông báo thay đổi giỏ hàng
 * 
 * Tách biệt logic observer từ CartService để đảm bảo nguyên lý mỗi file 1 class.
 */

const Observer = require('./Observer');

class CartObserver extends Observer {
  constructor() {
    super();
    console.log('✅ [CartObserver] Concrete observer initialized');
  }

  /**
   * Override notify to add cart-specific logging if needed
   */
  notify(event) {
    if (event.type === 'cart:changed') {
      console.log(`🔔 [CartObserver] Cart changed notification: ${event.data.length} items`);
    }
    super.notify(event);
  }
}

module.exports = CartObserver;
