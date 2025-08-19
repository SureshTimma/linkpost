import { NextRequest, NextResponse } from 'next/server';
import { exchangeLinkedInCode, fetchLinkedInProfile } from '@/lib/oauth/linkedin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
  if (!code || !state) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
  }

  try {
    const token = await exchangeLinkedInCode(code);
    const { profile, email } = await fetchLinkedInProfile(token.access_token);
    return NextResponse.json({
      accessToken: token.access_token,
      expiresIn: token.expires_in,
      profile,
      email
    });
  } catch (e: unknown) {
    const msg = typeof e === 'object' && e && 'message' in e ? (e as { message?: string }).message : 'OAuth failure';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
