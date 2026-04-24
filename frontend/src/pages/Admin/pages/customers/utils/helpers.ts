export const getDisplayCode = (val: string | number | undefined | null) => {
  const s = String(val || '');
  if (!s) return '';
  const hex = s.replace(/[^a-fA-F0-9]/g, '') || s;
  const last4 = hex.slice(-4).padStart(4, '0');
  return `#${last4}`;
};

export const parseDisplayDate = (date?: string) => {
  if (!date) return undefined;
  const [mm, dd, yyyy] = date.split('/');
  if (mm?.length !== 2 || dd?.length !== 2 || yyyy?.length !== 4) return undefined;
  const iso = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
  if (Number.isNaN(iso.getTime())) return undefined;
  return iso.toISOString();
};

export const getCustomerCountry = (customer: any, fallback?: string, normalizeCountry?: (value?: string) => string | undefined) => {
  if (!normalizeCountry) {
    // Fallback if normalizeCountry not provided
    const value = customer?.country ||
      customer?.addresses?.[0]?.country ||
      customer?.address?.country ||
      customer?.billingAddress?.country ||
      customer?.shippingAddress?.country ||
      fallback;
    return value || '—';
  }
  
  return normalizeCountry(
    customer?.country ||
      customer?.addresses?.[0]?.country ||
      customer?.address?.country ||
      customer?.billingAddress?.country ||
      customer?.shippingAddress?.country ||
      fallback,
  ) || '—';
};

/**
 * Format date consistently across the app
 * Format: "Jan 28, 2024" (month short, day numeric, year numeric)
 */
export const formatMemberSinceDate = (date?: string | Date | null): string => {
  if (!date) return '—';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(dateObj.getTime())) return '—';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(dateObj);
  } catch {
    return '—';
  }
};

/**
 * Get member since date consistently
 * Priority: customer.createdAt > customer.joinedAt > firstOrder (from stats)
 */
export const getMemberSinceDate = (customer: any, firstOrder?: string | Date | null): string | Date | null => {
  return customer?.createdAt || customer?.joinedAt || firstOrder || null;
};

/**
 * Format status consistently
 * Returns capitalized status: "Active", "Inactive", "Banned"
 */
export const formatCustomerStatus = (status?: string | null): string => {
  const s = (status || 'active').toString().toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/**
 * Normalize provinceCode to string format consistently
 * Converts number to string, handles null/undefined, trims whitespace
 * Returns empty string if invalid, otherwise returns string representation
 */
export const normalizeProvinceCode = (provinceCode?: string | number | null): string => {
  if (provinceCode === null || provinceCode === undefined) return '';
  // Convert to string and trim
  const normalized = String(provinceCode).trim();
  return normalized;
};

