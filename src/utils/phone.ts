/**
 * Phone number formatting utilities
 * Default country code: Indonesia (+62)
 */

const DEFAULT_COUNTRY_CODE = '62';

/**
 * Format phone number to international format with country code
 * - Removes all non-digit characters
 * - Adds default country code (62) if not present
 * - Handles common Indonesian formats: 08xxx, +628xxx, 628xxx
 * 
 * @param phone - Raw phone number input
 * @param countryCode - Country code without + (default: 62)
 * @returns Formatted phone number (e.g., "628123456789")
 */
export function formatPhoneNumber(phone: string, countryCode: string = DEFAULT_COUNTRY_CODE): string {
  if (!phone) return '';
  
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Remove leading + if present
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  
  // Handle Indonesian format starting with 0 (e.g., 081234567890)
  if (cleaned.startsWith('0')) {
    cleaned = countryCode + cleaned.substring(1);
  }
  
  // If doesn't start with country code, add it
  if (!cleaned.startsWith(countryCode)) {
    cleaned = countryCode + cleaned;
  }
  
  return cleaned;
}

/**
 * Format phone number for display with + prefix
 * @param phone - Phone number
 * @returns Formatted display string (e.g., "+62 812-3456-7890")
 */
export function formatPhoneForDisplay(phone: string): string {
  const formatted = formatPhoneNumber(phone);
  if (!formatted) return '';
  
  // Add + prefix and format with spaces/dashes for readability
  if (formatted.startsWith('62') && formatted.length >= 10) {
    // Indonesian format: +62 8XX-XXXX-XXXX
    const after62 = formatted.substring(2);
    if (after62.length >= 9) {
      return `+62 ${after62.substring(0, 3)}-${after62.substring(3, 7)}-${after62.substring(7)}`;
    }
  }
  
  return `+${formatted}`;
}

/**
 * Validate phone number format
 * @param phone - Phone number to validate
 * @returns true if valid Indonesian phone number
 */
export function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // Indonesian phone numbers: 62 + 9-12 digits (after country code)
  // Total: 11-14 digits
  return /^62\d{9,12}$/.test(formatted);
}

/**
 * Get placeholder text for phone input
 */
export function getPhonePlaceholder(): string {
  return '628123456789';
}
