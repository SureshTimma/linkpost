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

    if (error) {
      console.error('LinkedIn OAuth error:', error, errorDescription);
      return new Response(`
        <html>
          <body>
            <script>
              (function(){
                const payload = { error: "${error}", description: "${errorDescription}" };
                try {
                  if (window.opener && !window.opener.closed) {
                    window.opener.postMessage(payload, window.location.origin);
                  } else {
                    console.warn('LinkedIn error payload has no opener');
                  }
                } catch(e){ console.error(e); }
                setTimeout(() => { try { window.close(); } catch(e){} }, 500);
              })();
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
      return new Response(`
        <html>
          <body>
            <script>
              (function(){
                const payload = { error: "missing_params" };
                try {
                  if (window.opener && !window.opener.closed) {
                    window.opener.postMessage(payload, window.location.origin);
                  }
                } catch(e){}
                setTimeout(() => { try { window.close(); } catch(e){} }, 500);
              })();
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
              (function(){
                const payload = { error: "invalid_state" };
                try {
                  if (window.opener && !window.opener.closed) {
                    window.opener.postMessage(payload, window.location.origin);
                  }
                } catch(e){}
                setTimeout(() => { try { window.close(); } catch(e){} }, 500);
              })();
            </script>
            <div id="result">{"error":"invalid_state"}</div>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
        status: 400
      });
    }

    const token = await exchangeLinkedInCode(code);
    const { profile, email } = await fetchLinkedInProfile(token.access_token);
    
    const responseData: Record<string, unknown> = {
      success: true,
      accessToken: token.access_token,
      expiresIn: token.expires_in,
      scope: 'openid profile email w_member_social',
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
            (function(){
              const payload = ${JSON.stringify(responseData)};
              try {
                if (window.opener && !window.opener.closed) {
                  window.opener.postMessage(payload, window.location.origin);
                } else {
                  console.warn('No opener to receive LinkedIn success payload');
                }
              } catch(e){ console.error('PostMessage error', e); }
              // give parent time to process message
              setTimeout(() => { try { window.close(); } catch(e){} }, 500);
            })();
          </script>
          <div id="result">${JSON.stringify(responseData)}</div>
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
            (function(){
              const payload = { error: "oauth_failed", message: "${msg}" };
              try {
                if (window.opener && !window.opener.closed) {
                  window.opener.postMessage(payload, window.location.origin);
                }
              } catch(e){}
              setTimeout(() => { try { window.close(); } catch(e){} }, 800);
            })();
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
