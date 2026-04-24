/**
 * frontend/hooks/useReviewSocket.js
 * ✅ OBSERVER PATTERN: Listen for real-time review updates
 */

import { useEffect, useRef, useCallback } from 'react';

export const useReviewSocket = (productId, callbacks = {}) => {
  const wsRef = useRef(null);
  const { onNewReview, onUpdateReview, onDeleteReview } = callbacks;

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/products/${productId}/reviews`;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log(`✅ WebSocket connected for product ${productId}`);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 WebSocket message:', message);

          if (message.type === 'review:new' && onNewReview) {
            onNewReview(message.data || message.payload);
          } else if (message.type === 'review:updated' && onUpdateReview) {
            onUpdateReview(message.data || message.payload);
          } else if (message.type === 'review:deleted' && onDeleteReview) {
            onDeleteReview(message.data || message.payload);
          }
        } catch (error) {
          console.error('❌ Error parsing message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('❌ WebSocket disconnected');
        setTimeout(connect, 3000);
      };
    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
    }
  }, [productId, onNewReview, onUpdateReview, onDeleteReview]);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  return wsRef;
};