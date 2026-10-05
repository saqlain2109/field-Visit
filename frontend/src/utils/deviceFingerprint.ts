/**
 * Utility for generating deterministic client-side device fingerprint and browser profile ID
 */

export function getBrowserProfileId(): string {
  let profileId = localStorage.getItem('crm_browser_profile_id');
  if (!profileId) {
    profileId = 'profile-' + Math.random().toString(36).substring(2, 12) + '-' + Date.now().toString(36);
    localStorage.setItem('crm_browser_profile_id', profileId);
  }
  return profileId;
}

export function generateDeviceFingerprint(): string {
  try {
    const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const nav = window.navigator;
    const userAgent = nav.userAgent || 'unknown';
    const language = nav.language || 'en';
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const hardwareConcurrency = nav.hardwareConcurrency || 4;

    // Simple canvas fingerprint
    let canvasData = '';
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 40;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = "14px 'Arial'";
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('CRM_SECURITY_HASH', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('CRM_SECURITY_HASH', 4, 17);
        canvasData = canvas.toDataURL().slice(-50);
      }
    } catch {}

    const raw = `${screenInfo}|${userAgent}|${language}|${timeZone}|${hardwareConcurrency}|${canvasData}`;
    
    // Hash using fnv1a algorithm
    let hash = 2166136261;
    for (let i = 0; i < raw.length; i++) {
      hash ^= raw.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return 'fp_' + (hash >>> 0).toString(16).padStart(8, '0');
  } catch (e) {
    return 'fp_standard_browser';
  }
}
