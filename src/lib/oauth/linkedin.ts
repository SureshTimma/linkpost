// src/lib/oauth/linkedin.ts
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_PROFILE_URL = 'https://api.linkedin.com/v2/userinfo'; // OpenID Connect endpoint

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

export function getLinkedInRedirectUri(originFallback?: string) {
  // Prefer explicit env, else build from provided origin or NEXT_PUBLIC_APP_URL
  if (process.env.LINKEDIN_REDIRECT_URI) return process.env.LINKEDIN_REDIRECT_URI;
  const base = originFallback || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}/api/auth/linkedin/callback`;
}

export function buildLinkedInAuthUrl(state: string, originFallback?: string) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) throw new Error('Missing LINKEDIN_CLIENT_ID env');
  const redirectUri = getLinkedInRedirectUri(originFallback);
  // Debug logging (only in development) to help diagnose redirect mismatches
  if (process.env.NODE_ENV !== 'production') {
    console.log('[linkedin] build auth URL with values =>', {
      clientId: clientId.slice(0, 4) + '***',
      redirectUri,
      originFallback
    });
    // Basic validation: must be absolute and contain /api/auth/linkedin/callback exactly
    const expectedPath = '/api/auth/linkedin/callback';
    try {
      const u = new URL(redirectUri);
      if (u.pathname !== expectedPath) {
        console.warn(`[linkedin] Redirect path mismatch. Got "${u.pathname}" expected "${expectedPath}".`);
      }
      if (!/^https?:$/.test(u.protocol)) {
        console.warn('[linkedin] Redirect protocol is not http/https, this will fail.');
      }
    } catch (e) {
      console.warn('[linkedin] Invalid redirect URI format', redirectUri, e);
    }
  }
  // Use scopes available in your LinkedIn Developer Dashboard
  // openid: OpenID Connect for authentication
  // profile: Basic profile info (name, photo)
  // email: Primary email address
  // w_member_social: Create/modify posts and reactions
  const scope = encodeURIComponent('openid profile email w_member_social');
  return `${LINKEDIN_AUTH_URL}?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}`;
}

export async function exchangeLinkedInCode(code: string): Promise<LinkedInTokenResponse> {
  const redirectUri = getLinkedInRedirectUri();
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
  });
  const res = await fetch(`${LINKEDIN_TOKEN_URL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!res.ok) {
    throw new Error('Failed to exchange LinkedIn code');
  }
  return res.json();
}

export async function fetchLinkedInProfile(accessToken: string) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  
  // Use OpenID Connect userinfo endpoint which includes email when email scope is granted
  const profileRes = await fetch(LINKEDIN_PROFILE_URL, { headers });
  if (!profileRes.ok) throw new Error('Failed to fetch LinkedIn profile');
  
  const profile = await profileRes.json();
  
  // With OpenID Connect, email is included in the profile response if email scope is granted
  const email = profile.email || null;
  
  return { profile, email };
}

export function validateState(state: string) {
  return !!state; // placeholder
}
