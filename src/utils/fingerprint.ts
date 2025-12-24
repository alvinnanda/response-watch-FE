// Device fingerprint utility using FingerprintJS
import FingerprintJS from '@fingerprintjs/fingerprintjs';

let cachedFingerprint: string | null = null;

/**
 * Get device fingerprint for rate limiting
 * Results are cached to avoid repeated computation
 */
export async function getDeviceFingerprint(): Promise<string> {
  if (cachedFingerprint) {
    return cachedFingerprint;
  }

  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    cachedFingerprint = result.visitorId;
    return cachedFingerprint;
  } catch (error) {
    console.error('Failed to get device fingerprint:', error);
    // Fallback to a random ID stored in localStorage
    let fallbackId = localStorage.getItem('device_fallback_id');
    if (!fallbackId) {
      fallbackId = 'fallback_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('device_fallback_id', fallbackId);
    }
    return fallbackId;
  }
}
