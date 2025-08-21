// src/lib/oauth/linkedin.ts
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_PROFILE_URL = 'https://api.linkedin.com/v2/userinfo'; // OpenID Connect endpoint

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

export function getLinkedInRedirectUri() {
  // Always use explicit env if set, otherwise use NEXT_PUBLIC_APP_URL
  if (process.env.LINKEDIN_REDIRECT_URI) return process.env.LINKEDIN_REDIRECT_URI;
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}/api/auth/linkedin/callback`;
}

export function buildLinkedInAuthUrl(state: string) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) throw new Error('Missing LINKEDIN_CLIENT_ID env');
  const redirectUri = getLinkedInRedirectUri();
  
  // Basic validation in development
  if (process.env.NODE_ENV !== 'production') {
    const expectedPath = '/api/auth/linkedin/callback';
    try {
      const u = new URL(redirectUri);
      if (u.pathname !== expectedPath) {
        console.warn(`LinkedIn redirect path mismatch. Expected "${expectedPath}" but got "${u.pathname}"`);
      }
    } catch {
      console.warn('Invalid LinkedIn redirect URI format:', redirectUri);
    }
  }
  
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
  
  const responseText = await res.text();
  
  if (!res.ok) {
    console.error('LinkedIn token exchange failed:', { status: res.status, error: responseText });
    throw new Error(`Failed to exchange LinkedIn code: ${res.status} ${responseText}`);
  }
  
  return JSON.parse(responseText);
}

export async function fetchLinkedInProfile(accessToken: string) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  
  // Use OpenID Connect userinfo endpoint which includes email when email scope is granted
  const profileRes = await fetch(LINKEDIN_PROFILE_URL, { headers });
  if (!profileRes.ok) throw new Error('Failed to fetch LinkedIn profile');
  
  const profile = await profileRes.json();
  
  // The 'sub' field in OpenID Connect contains the LinkedIn user ID
  // It's in the format "xxxxxxxx" which we can use directly
  const profileId = profile.sub || '';
  
  // With OpenID Connect, email is included in the profile response if email scope is granted
  const email = profile.email || null;
  
  return { 
    profile: {
      ...profile,
      id: profileId // Add the LinkedIn ID to the profile
    }, 
    email 
  };
}

export function validateState(state: string) {
  return !!state; // placeholder
}
