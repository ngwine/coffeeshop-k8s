/**
 * backend/patterns/adapter/WebSocketAdapter.js
 * 🔌 ADAPTER - WebSocket notification implementation
 * Adapts internal Observer notificiations to WebSocket broadcasts
 */

class WebSocketAdapter {
  constructor(reviewObserver, wsServer) {
    this.observer = reviewObserver;
    this.wsServer = wsServer;
    this.setupListeners();
  }

  setupListeners() {
    // Adapter logic: Khi bserver thông báo, adapter sẽ broadcast qua WebSocket
    this.observer.subscribe((event) => {
      const { type, productId, data } = event;
      if (type.startsWith('review:')) {
        this.wsServer.broadcastReview(productId, data, type);
      }
    });
    console.log('✅ [WebSocketAdapter] Listening for Review events');
  }
}

module.exports = WebSocketAdapter;
