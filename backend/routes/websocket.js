/**
 * backend/routes/websocket.js
 * WebSocket routes for real-time features
 * ✅ OBSERVER PATTERN: Centralized WebSocket endpoint registration
 */

const WebSocket = require('ws');

/**
 * Configure WebSocket routes
 * @param {http.Server} httpServer - HTTP server instance
 * @returns {Object} WebSocket utilities
 */
function configureWebSocket(httpServer) {
  // Create WebSocket server
  const wss = new WebSocket.Server({ server: httpServer });

  // Track clients by product (for review broadcasts)
  const clientsByProduct = new Map(); // productId -> Set<WebSocket>

  /**
   * Reviews WebSocket endpoint - /ws/products/:id/reviews
   * Purpose: Real-time review updates (new, updated, deleted)
   */
  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://localhost:${process.env.PORT || 3001}`);
    const parts = url.pathname.split('/').filter(Boolean);

    let route = null;
    let routeParams = {};

    // Parse Review WebSocket route: /ws/products/:id/reviews
    if (parts[0] === 'ws' && parts[1] === 'products' && parts[3] === 'reviews') {
      route = 'reviews';
      routeParams.productId = parts[2];
    }
    // Future: Add other WebSocket routes here
    // } else if (parts[0] === 'ws' && parts[1] === 'orders' && parts[2]) {
    //   route = 'orders';
    //   routeParams.orderId = parts[2];
    // }

    console.log(`✅ [WebSocket] Connected to route: ${route}`, routeParams);

    // Handle review route
    if (route === 'reviews') {
      const { productId } = routeParams;

      // Track this client
      if (!clientsByProduct.has(productId)) {
        clientsByProduct.set(productId, new Set());
      }
      clientsByProduct.get(productId).add(ws);

      // Welcome message
      ws.send(
        JSON.stringify({
          type: 'connected',
          route: 'reviews',
          message: 'Connected to reviews WebSocket',
          productId,
          timestamp: new Date().toISOString(),
        })
      );

      // Handle incoming messages
      ws.on('message', (msg) => {
        console.log(`📨 [WebSocket:reviews:${productId}] Message:`, msg.toString());
      });

      // Handle disconnect
      ws.on('close', () => {
        console.log(`❌ [WebSocket] Disconnected from reviews:${productId}`);
        if (clientsByProduct.has(productId)) {
          const set = clientsByProduct.get(productId);
          set.delete(ws);
          if (!set.size) clientsByProduct.delete(productId);
        }
      });

      ws.on('error', (err) => {
        console.error(`⚠️  [WebSocket:reviews:${productId}] Error:`, err.message);
      });
    }
  });

  /**
   * Broadcast a new review to all clients watching product
   * ✅ Used by ReviewController.create()
   */
  function broadcastReview(productId, review, type = 'review:new') {
    const set = clientsByProduct.get(String(productId));
    if (!set || set.size === 0) {
      console.log(`📡 [WebSocket] No clients listening for product ${productId}`);
      return;
    }

    const payload = JSON.stringify({
      type,
      data: review,
      timestamp: new Date().toISOString(),
    });

    let broadcastCount = 0;
    for (const client of set) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
        broadcastCount++;
      }
    }
    console.log(`📡 [WebSocket] Broadcasted ${type} to ${broadcastCount} clients for product ${productId}`);
  }

  /**
   * Broadcast updated review
   */
  function broadcastUpdateReview(productId, review) {
    broadcastReview(productId, review, 'review:updated');
  }

  /**
   * Broadcast deleted review
   */
  function broadcastDeleteReview(productId, review) {
    broadcastReview(productId, review, 'review:deleted');
  }

  /**
   * Get connection stats (for debugging/monitoring)
   */
  function getStats() {
    let totalClients = 0;
    const productStats = {};
    for (const [productId, set] of clientsByProduct.entries()) {
      const count = set.size;
      productStats[productId] = count;
      totalClients += count;
    }
    return {
      totalConnections: totalClients,
      activeProducts: clientsByProduct.size,
      byProduct: productStats,
    };
  }

  return {
    wss,
    broadcastReview,
    broadcastUpdateReview,
    broadcastDeleteReview,
    getStats,
  };
}

module.exports = { configureWebSocket };
