/**
 * Utility function to get a consistent avatar URL for a user
 * Uses email as primary identifier, falls back to id
 * Always uses the same size (150) to ensure consistency across the app
 *
 * IMPORTANT: Email is ALWAYS used as the primary identifier when available.
 * This ensures the same user (same email) always gets the same avatar,
 * regardless of where it's displayed in the app.
 *
 * @param email - User's email address (preferred identifier - ALWAYS used if available)
 * @param id - User's ID (fallback if email is not available)
 * @param avatarUrl - Custom avatar URL from database (if available, takes priority)
 * @param size - Optional size parameter (default: 150)
 * @returns Avatar URL string
 */
export function getAvatarUrl(
  email?: string | null,
  id?: string | number | null,
  avatarUrl?: string | null,
  size: number = 150
): string {
  // If custom avatar URL is provided, use it
  if (avatarUrl) {
    return avatarUrl;
  }

  // ALWAYS use email as primary identifier for consistent avatar generation
  // This ensures the same email always generates the same avatar
  // Only fall back to id if email is not available
  const identifier = email ? String(email).toLowerCase().trim() : (id ? String(id) : 'default');

  // Use pravatar.cc with consistent size and encoding
  // The same identifier will always generate the same avatar
  return `https://i.pravatar.cc/${size}?u=${encodeURIComponent(identifier)}`;
}

























