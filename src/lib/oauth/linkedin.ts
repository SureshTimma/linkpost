// src/lib/oauth/linkedin.ts
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_PROFILE_URL = 'https://api.linkedin.com/v2/me';
const LINKEDIN_EMAIL_URL = 'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))';

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

export function buildLinkedInAuthUrl(state: string) {
  const clientId = process.env.LINKEDIN_CLIENT_ID!;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI!;
  const scope = encodeURIComponent('r_liteprofile r_emailaddress w_member_social');
  return `${LINKEDIN_AUTH_URL}?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}`;
}

export async function exchangeLinkedInCode(code: string): Promise<LinkedInTokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
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
  const [profileRes, emailRes] = await Promise.all([
    fetch(LINKEDIN_PROFILE_URL, { headers }),
    fetch(LINKEDIN_EMAIL_URL, { headers })
  ]);
  if (!profileRes.ok) throw new Error('Failed to fetch LinkedIn profile');
  if (!emailRes.ok) throw new Error('Failed to fetch LinkedIn email');
  const profile = await profileRes.json();
  const emailJson = await emailRes.json();
  const email = emailJson?.elements?.[0]?.['handle~']?.emailAddress as string | undefined;
  return { profile, email };
}

export function validateState(state: string) {
  return !!state; // placeholder
}
