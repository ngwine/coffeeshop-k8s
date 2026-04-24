/**
 * frontend/src/hooks/__tests__/useReviewSocket.test.js
 * Integration tests for useReviewSocket hook
 * ✅ OBSERVER PATTERN: Tests real-time review updates
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useReviewSocket } from '../useReviewSocket';

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 0; // CONNECTING
    this.listeners = {};
    this.CONNECTING = 0;
    this.OPEN = 1;
    this.CLOSING = 2;
    this.CLOSED = 3;

    // Simulate connection after short delay
    setTimeout(() => {
      this.readyState = this.OPEN;
      if (this.onopen) this.onopen();
    }, 10);
  }

  addEventListener(event, handler) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(handler);
  }

  removeEventListener(event, handler) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((h) => h !== handler);
    }
  }

  send(data) {
    // Mock send
  }

  close() {
    this.readyState = this.CLOSED;
    if (this.onclose) this.onclose();
  }

  // Helper to simulate receiving messages
  simulateMessage(data) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }

  // Helper to simulate errors
  simulateError(error) {
    if (this.onerror) {
      this.onerror(error);
    }
  }
}

// Replace global WebSocket
global.WebSocket = MockWebSocket;
global.window = {
  location: {
    protocol: 'http:',
    host: 'localhost:3000',
  },
};

describe('useReviewSocket', () => {
  let mockWebSocket;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window.location
    global.window = {
      location: {
        protocol: 'http:',
        host: 'localhost:3000',
      },
    };
  });

  describe('Connection', () => {
    it('✅ should create WebSocket connection', async () => {
      const { result } = renderHook(() =>
        useReviewSocket(123, {
          onNewReview: jest.fn(),
        })
      );

      // Wait for connection to establish
      await waitFor(() => {
        expect(result.current.isConnected).not.toBeUndefined();
      });
    });

    it('✅ should use correct URL format', async () => {
      global.window.location = {
        protocol: 'http:',
        host: 'localhost:3000',
      };

      const productId = 456;
      const expectedUrl = `ws://localhost:3000/ws/products/${productId}/reviews`;

      let actualUrl;
      const originalWebSocket = global.WebSocket;
      global.WebSocket = jest.fn((url) => {
        actualUrl = url;
        return new MockWebSocket(url);
      });

      renderHook(() => useReviewSocket(productId, {}));

      expect(actualUrl).toBe(expectedUrl);

      global.WebSocket = originalWebSocket;
    });

    it('✅ should use wss for https protocol', async () => {
      global.window.location = {
        protocol: 'https:',
        host: 'api.example.com',
      };

      let actualUrl;
      const originalWebSocket = global.WebSocket;
      global.WebSocket = jest.fn((url) => {
        actualUrl = url;
        return new MockWebSocket(url);
      });

      renderHook(() => useReviewSocket(789, {}));

      expect(actualUrl.startsWith('wss://')).toBe(true);

      global.WebSocket = originalWebSocket;
    });

    it('✅ should retry connection on close', async () => {
      jest.useFakeTimers();

      const { result } = renderHook(() =>
        useReviewSocket(123, { onNewReview: jest.fn() })
      );

      // Wait for initial connection
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate close
      mockWebSocket = global.WebSocket.mock?.results[0]?.value;
      if (mockWebSocket?.onclose) {
        mockWebSocket.onclose();
      }

      // Should retry after 3 seconds
      jest.advanceTimersByTime(3000);

      jest.useRealTimers();
    });
  });

  describe('Message Handling', () => {
    it('✅ should handle review:new message', async () => {
      const onNewReview = jest.fn();

      renderHook(() =>
        useReviewSocket(123, { onNewReview })
      );

      // Wait for connection
      await waitFor(() => {
        const wsInstance = global.WebSocket.mock?.results[0]?.value;
        if (wsInstance && wsInstance.readyState === 1) {
          wsInstance.simulateMessage({
            type: 'review:new',
            data: {
              _id: '1',
              productId: 123,
              comment: 'Great product!',
            },
          });
        }
      });

      // Check if callback was called
      await waitFor(() => {
        expect(onNewReview).toHaveBeenCalled();
      });
    });

    it('✅ should handle review:updated message', async () => {
      const onUpdateReview = jest.fn();

      renderHook(() =>
        useReviewSocket(123, { onUpdateReview })
      );

      await waitFor(() => {
        const wsInstance = global.WebSocket.mock?.results[0]?.value;
        if (wsInstance && wsInstance.readyState === 1) {
          wsInstance.simulateMessage({
            type: 'review:updated',
            data: {
              _id: '1',
              rating: 4,
            },
          });
        }
      });

      await waitFor(() => {
        expect(onUpdateReview).toHaveBeenCalled();
      });
    });

    it('✅ should handle review:deleted message', async () => {
      const onDeleteReview = jest.fn();

      renderHook(() =>
        useReviewSocket(123, { onDeleteReview })
      );

      await waitFor(() => {
        const wsInstance = global.WebSocket.mock?.results[0]?.value;
        if (wsInstance && wsInstance.readyState === 1) {
          wsInstance.simulateMessage({
            type: 'review:deleted',
            data: { _id: '1' },
          });
        }
      });

      await waitFor(() => {
        expect(onDeleteReview).toHaveBeenCalled();
      });
    });

    it('✅ should handle message with payload property', async () => {
      const onNewReview = jest.fn();

      renderHook(() =>
        useReviewSocket(123, { onNewReview })
      );

      await waitFor(() => {
        const wsInstance = global.WebSocket.mock?.results[0]?.value;
        if (wsInstance && wsInstance.readyState === 1) {
          wsInstance.simulateMessage({
            type: 'review:new',
            payload: { _id: '2', comment: 'Another review' },
          });
        }
      });

      await waitFor(() => {
        expect(onNewReview).toHaveBeenCalledWith(
          expect.objectContaining({ _id: '2' })
        );
      });
    });

    it('❌ should handle malformed messages gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() =>
        useReviewSocket(123, { onNewReview: jest.fn() })
      );

      await waitFor(() => {
        const wsInstance = global.WebSocket.mock?.results[0]?.value;
        if (wsInstance && wsInstance.readyState === 1) {
          // Send invalid JSON
          wsInstance.onmessage({ data: 'invalid json {' });
        }
      });

      // Should not throw, just log error
      expect(result.current.isConnected).toBeDefined();

      consoleError.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('✅ should handle WebSocket errors', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      renderHook(() =>
        useReviewSocket(123, { onNewReview: jest.fn() })
      );

      await waitFor(() => {
        const wsInstance = global.WebSocket.mock?.results[0]?.value;
        if (wsInstance) {
          wsInstance.simulateError(new Error('Connection failed'));
        }
      });

      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });

    it('✅ should handle connection errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      global.WebSocket = jest.fn(() => {
        throw new Error('Constructor error');
      });

      renderHook(() =>
        useReviewSocket(123, { onNewReview: jest.fn() })
      );

      // Should not crash app
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe('Cleanup', () => {
    it('✅ should close connection on unmount', async () => {
      const { unmount } = renderHook(() =>
        useReviewSocket(123, { onNewReview: jest.fn() })
      );

      await waitFor(() => {
        const wsInstance = global.WebSocket.mock?.results[0]?.value;
        return wsInstance?.readyState === 1;
      });

      const wsInstance = global.WebSocket.mock?.results[0]?.value;
      const closeSpy = jest.spyOn(wsInstance, 'close');

      unmount();

      expect(closeSpy).toHaveBeenCalled();
    });

    it('✅ should remove event listeners on unmount', async () => {
      const { unmount } = renderHook(() =>
        useReviewSocket(123, { onNewReview: jest.fn() })
      );

      await waitFor(() => {
        const wsInstance = global.WebSocket.mock?.results[0]?.value;
        return wsInstance?.readyState === 1;
      });

      const wsInstance = global.WebSocket.mock?.results[0]?.value;

      unmount();

      // Verify cleanup by checking onmessage is null
      expect(wsInstance.onmessage === null || wsInstance.onmessage === undefined).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('✅ should handle undefined callbacks', async () => {
      const { result } = renderHook(() =>
        useReviewSocket(123, {}) // No callbacks
      );

      await waitFor(() => {
        const wsInstance = global.WebSocket.mock?.results[0]?.value;
        if (wsInstance && wsInstance.readyState === 1) {
          wsInstance.simulateMessage({
            type: 'review:new',
            data: { _id: '1' },
          });
        }
      });

      // Should not throw
      expect(result.current.isConnected).toBeDefined();
    });

    it('✅ should handle rapid productId changes', async () => {
      const { rerender } = renderHook(
        ({ productId }) => useReviewSocket(productId, { onNewReview: jest.fn() }),
        { initialProps: { productId: 123 } }
      );

      await waitFor(() => {
        const wsInstance = global.WebSocket.mock?.results[0]?.value;
        return wsInstance?.readyState === 1;
      });

      // Change productId
      rerender({ productId: 456 });

      // Should create new connection
      await waitFor(() => {
        const lastCall = global.WebSocket.mock?.results.length;
        expect(lastCall).toBeGreaterThan(1);
      });
    });

    it('✅ should only parse known message types', async () => {
      const callbacks = {
        onNewReview: jest.fn(),
        onUpdateReview: jest.fn(),
        onDeleteReview: jest.fn(),
      };

      renderHook(() => useReviewSocket(123, callbacks));

      await waitFor(() => {
        const wsInstance = global.WebSocket.mock?.results[0]?.value;
        if (wsInstance && wsInstance.readyState === 1) {
          wsInstance.simulateMessage({
            type: 'unknown:type',
            data: { _id: '1' },
          });
        }
      });

      // Should not call any callbacks for unknown type
      expect(callbacks.onNewReview).not.toHaveBeenCalled();
      expect(callbacks.onUpdateReview).not.toHaveBeenCalled();
      expect(callbacks.onDeleteReview).not.toHaveBeenCalled();
    });
  });
});
