/**
 * Get display code for an order
 * Returns a 4-character alphanumeric code (e.g., "#A3f2", "#75a0")
 * 
 * IMPORTANT: 
 * - displayCode is used to hide the real order ID from admin UI
 * - Always use displayCode from backend (4-character alphanumeric: 0-9, a-z, A-Z)
 * - If displayCode is missing, show placeholder (should not happen after migration)
 * 
 * @param orderOrId - Order object with displayCode/id/_id, or just an ID string
 * @returns Display code string like "#A3f2" or "#----" if invalid
 */
export const getOrderDisplayCode = (orderOrId: any): string => {
  // Check if displayCode exists and is a valid non-empty string
  const backendDisplayCode = orderOrId?.displayCode;
  if (backendDisplayCode && typeof backendDisplayCode === 'string' && backendDisplayCode.trim().length > 0) {
    // Use backend displayCode (4-character alphanumeric: 0-9, a-z, A-Z)
    const code = backendDisplayCode.trim();
    // Ensure it's alphanumeric (1-4 characters, but typically 4)
    if (/^[0-9a-zA-Z]{1,4}$/.test(code)) {
      // If code is less than 4 characters, pad with '0' (though this shouldn't happen)
      // If code is 4 characters, use it as is
      const paddedCode = code.length < 4 ? code.padStart(4, '0') : code.slice(0, 4);
      return `#${paddedCode}`;
    }
  }
  
  // If displayCode is missing, show placeholder
  // This should not happen after running the migration script
  return '#----';
};

/**
 * Get display code without the "#" prefix
 * Useful for searching or comparison
 */
export const getOrderDisplayCodeRaw = (orderOrId: any): string => {
  const code = getOrderDisplayCode(orderOrId);
  return code.replace(/^#+/, '');
};

