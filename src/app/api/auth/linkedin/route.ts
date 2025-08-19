import { NextRequest, NextResponse } from 'next/server';
import { buildLinkedInAuthUrl } from '@/lib/oauth/linkedin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  if (action === 'start') {
    const state = Math.random().toString(36).slice(2);
    const url = buildLinkedInAuthUrl(state);
    return NextResponse.json({ url, state });
  }
  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}
