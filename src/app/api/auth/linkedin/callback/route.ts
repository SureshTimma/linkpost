import { NextRequest } from 'next/server';
import { exchangeLinkedInCode, fetchLinkedInProfile } from '@/lib/oauth/linkedin';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    console.log('[linkedin] callback called with:', { code: !!code, state, error, errorDescription });

    if (error) {
      console.error('[linkedin] OAuth error:', error, errorDescription);
      return new Response(`
        <html>
          <body>
            <script>
              window.postMessage({ error: "${error}", description: "${errorDescription}" }, "*");
            </script>
            <div id="result">{"error":"${error}","description":"${errorDescription}"}</div>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
        status: 400
      });
    }

    if (!code || !state) {
      console.error('[linkedin] Missing code or state');
      return new Response(`
        <html>
          <body>
            <script>
              window.postMessage({ error: "missing_params" }, "*");
            </script>
            <div id="result">{"error":"missing_params"}</div>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
        status: 400
      });
    }

    // Basic CSRF: compare state cookie
    const cookieStore = await cookies();
    const expected = cookieStore.get('lp_li_state')?.value;
    if (!expected || expected !== state) {
      console.error('[linkedin] Invalid state parameter:', { expected, received: state });
      return new Response(`
        <html>
          <body>
            <script>
              window.postMessage({ error: "invalid_state" }, "*");
            </script>
            <div id="result">{"error":"invalid_state"}</div>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
        status: 400
      });
    }

    console.log('[linkedin] exchanging code for token...');
    const token = await exchangeLinkedInCode(code);
    console.log('[linkedin] token exchange successful, fetching profile...');
    const { profile, email } = await fetchLinkedInProfile(token.access_token);
    console.log('[linkedin] profile fetch successful');
    
    const responseData: Record<string, unknown> = {
      success: true,
      accessToken: token.access_token,
      expiresIn: token.expires_in,
      scope: 'openid profile email w_member_social', // Add the scope for Firestore storage
      profile,
      email
    };

    // Only include refreshToken if it exists
    if (token.refresh_token) {
      responseData.refreshToken = token.refresh_token;
    }
    
    return new Response(`
      <html>
        <body>
          <script>
            window.postMessage(${JSON.stringify(responseData)}, "*");
          </script>
          <div id="result">${JSON.stringify(responseData)}</div>
          <p>LinkedIn connected successfully! You can close this window.</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
      status: 200
    });

  } catch (e: unknown) {
    console.error('[linkedin] OAuth error:', e);
    const msg = typeof e === 'object' && e && 'message' in e ? (e as { message?: string }).message : 'OAuth failure';
    return new Response(`
      <html>
        <body>
          <script>
            window.postMessage({ error: "oauth_failed", message: "${msg}" }, "*");
          </script>
          <div id="result">{"error":"oauth_failed","message":"${msg}"}</div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
      status: 500
    });
  }
}
