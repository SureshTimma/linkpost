import { NextRequest, NextResponse } from 'next/server';
import { buildLinkedInAuthUrl } from '@/lib/oauth/linkedin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  if (action === 'start') {
    const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
    let origin: string | undefined;
    try { origin = req.headers.get('origin') || undefined; } catch {}
    const url = buildLinkedInAuthUrl(state, origin);
    const res = NextResponse.json({ url });
    res.cookies.set('lp_li_state', state, { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 600 });
    return res;
  }
  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}
