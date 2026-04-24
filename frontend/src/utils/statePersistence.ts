/**
 * Utility for persisting component state to sessionStorage
 * This allows state to be restored after page refresh or rebuild within the same session
 * SessionStorage automatically clears when the tab/browser is closed
 */

import React from 'react';

const STORAGE_PREFIX = 'app_state_';

/**
 * Save state to sessionStorage
 * @param key - Unique key for this state (e.g., 'order_detail_123', 'add_product')
 * @param data - Data to save (will be JSON stringified)
 * @param ttl - Optional time-to-live in milliseconds (default: session duration)
 */
export function saveState<T>(key: string, data: T, ttl?: number): void {
  try {
    const storageKey = `${STORAGE_PREFIX}${key}`;
    const now = Date.now();
    const ttlMs = ttl || 8 * 60 * 60 * 1000; // Default 8 hours (session duration)
    
    const payload = {
      data,
      timestamp: now,
      expiresAt: now + ttlMs,
    };
    
    sessionStorage.setItem(storageKey, JSON.stringify(payload));
  } catch (error) {
    // sessionStorage might be full or unavailable
  }
}

/**
 * Load state from sessionStorage
 * @param key - Unique key for this state
 * @returns The saved data or null if not found/expired
 */
export function loadState<T>(key: string): T | null {
  try {
    const storageKey = `${STORAGE_PREFIX}${key}`;
    const item = sessionStorage.getItem(storageKey);
    
    if (!item) {
      return null;
    }
    
    const payload = JSON.parse(item);
    const now = Date.now();
    
    // Check if expired
    if (payload.expiresAt && now > payload.expiresAt) {
      sessionStorage.removeItem(storageKey);
      return null;
    }
    
    return payload.data as T;
  } catch (error) {
    return null;
  }
}

/**
 * Remove state from sessionStorage
 * @param key - Unique key for this state
 */
export function clearState(key: string): void {
  try {
    const storageKey = `${STORAGE_PREFIX}${key}`;
    sessionStorage.removeItem(storageKey);
  } catch (error) {
  }
}

/**
 * Clear all persisted states (useful for logout or cleanup)
 */
export function clearAllStates(): void {
  try {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (error) {
  }
}

/**
 * Get all persisted state keys (for debugging)
 */
export function getAllStateKeys(): string[] {
  try {
    const keys = Object.keys(sessionStorage);
    return keys
      .filter(key => key.startsWith(STORAGE_PREFIX))
      .map(key => key.replace(STORAGE_PREFIX, ''));
  } catch (error) {
    return [];
  }
}

/**
 * React hook for persisting state
 * @param key - Unique key for this state
 * @param initialState - Initial state value
 * @param options - Options for persistence
 */
export function usePersistedState<T>(
  key: string,
  initialState: T,
  options?: { ttl?: number; enabled?: boolean }
): [T, (value: T | ((prev: T) => T)) => void] {
  const enabled = options?.enabled !== false;
  
  // Load initial state from sessionStorage
  const [state, setState] = React.useState<T>(() => {
    if (!enabled) return initialState;
    const saved = loadState<T>(key);
    return saved !== null ? saved : initialState;
  });
  
  // Save state whenever it changes
  React.useEffect(() => {
    if (enabled) {
      saveState(key, state, options?.ttl);
    }
  }, [key, state, enabled, options?.ttl]);
  
  return [state, setState];
}

