/**
 * backend/patterns/observer/Observer.js
 * 🟢 PURE - Generic Observer pattern base class
 * 
 * Implements Subject-Observer pattern for decoupled event handling.
 */

/**
 * Lớp chủ thể trung tâm phân phối sự kiện (Observer Pattern)
 * @class Observer
 */
class Observer {
  constructor() {
    this.listeners = new Set();
  }

  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    this.listeners.add(callback);
    console.log(`✅ [Observer] Listener subscribed. Total: ${this.listeners.size}`);
    return () => this.unsubscribe(callback);
  }

  unsubscribe(callback) {
    this.listeners.delete(callback);
    console.log(`❌ [Observer] Listener unsubscribed. Total: ${this.listeners.size}`);
  }

  notify(data) {
    console.log(`📢 [Observer] Notifying ${this.listeners.size} listeners`);
    for (const listener of this.listeners) {
      try {
        listener(data);
      } catch (error) {
        console.error('❌ [Observer] Error in listener:', error.message);
      }
    }
  }

  clear() {
    this.listeners.clear();
    console.log('🧹 [Observer] All listeners cleared');
  }

  getListenerCount() {
    return this.listeners.size;
  }
}

module.exports = Observer;
