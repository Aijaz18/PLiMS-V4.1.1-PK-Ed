import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const rootDir = process.cwd();

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

function formatMarcSubfields(subfields: any): string {
  if (subfields === null || subfields === undefined) return '';
  if (typeof subfields === 'string') return subfields;
  if (typeof subfields === 'number' || typeof subfields === 'boolean') return String(subfields);

  if (Array.isArray(subfields)) {
    return subfields
      .map(item => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          return Object.entries(item)
            .map(([code, val]) => `$${code} ${typeof val === 'object' ? JSON.stringify(val) : val}`)
            .join(' ');
        }
        return String(item);
      })
      .join(' ');
  }

  if (typeof subfields === 'object') {
    return Object.entries(subfields)
      .map(([code, val]) => {
        if (Array.isArray(val)) {
          return val.map(v => `$${code} ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' ');
        }
        if (typeof val === 'object' && val !== null) {
          return `$${code} ${JSON.stringify(val)}`;
        }
        return `$${code} ${val}`;
      })
      .join(' ');
  }

  return String(subfields);
}

function sanitizeAiResult(res: any) {
  if (!res || typeof res !== 'object') {
    return null;
  }

  return {
    title: typeof res.title === 'string' ? res.title : String(res.title || 'Untitled Record'),
    subtitle: typeof res.subtitle === 'string' ? res.subtitle : '',
    authors: Array.isArray(res.authors)
      ? res.authors.map((a: any) => (typeof a === 'string' ? a : (a?.name || a?.author || JSON.stringify(a))))
      : (typeof res.authors === 'string' ? [res.authors] : ['Unknown Author']),
    isbn: typeof res.isbn === 'string' ? res.isbn : '',
    publisherName: typeof res.publisherName === 'string' ? res.publisherName : (res.publisher || 'Academic Press'),
    publisherLocation: typeof res.publisherLocation === 'string' ? res.publisherLocation : 'Islamabad, Pakistan',
    publisherYear: typeof res.publisherYear === 'number' ? res.publisherYear : (parseInt(res.publisherYear, 10) || 2025),
    edition: typeof res.edition === 'string' ? res.edition : '1st Edition',
    pageCount: typeof res.pageCount === 'number' ? res.pageCount : (parseInt(res.pageCount, 10) || 350),
    department: typeof res.department === 'string' ? res.department : 'General Science',
    format: res.format || 'HARDCOVER',
    callNumber: typeof res.callNumber === 'string' ? res.callNumber : '025.04 LIS 2025',
    ddcClassification: typeof res.ddcClassification === 'string' ? res.ddcClassification : '025.04',
    cutterNumber: typeof res.cutterNumber === 'string' ? res.cutterNumber : 'L697',
    subjects: Array.isArray(res.subjects)
      ? res.subjects.map((s: any) => (typeof s === 'string' ? s : (s?.heading || s?.name || JSON.stringify(s))))
      : (typeof res.subjects === 'string' ? [res.subjects] : ['Library Science']),
    abstract: typeof res.abstract === 'string' ? res.abstract : '',
    marc21Tags: Array.isArray(res.marc21Tags)
      ? res.marc21Tags.map((tagObj: any) => {
          if (!tagObj || typeof tagObj !== 'object') {
            return { tag: '999', ind1: '#', ind2: '#', subfields: String(tagObj || '') };
          }
          return {
            tag: String(tagObj.tag || '999'),
            ind1: String(tagObj.ind1 ?? '#'),
            ind2: String(tagObj.ind2 ?? '#'),
            subfields: formatMarcSubfields(tagObj.subfields)
          };
        })
      : [],
    rdaGuidelines: typeof res.rdaGuidelines === 'string' ? res.rdaGuidelines : 'RDA Core Elements verified.',
    detectedText: typeof res.detectedText === 'string' ? res.detectedText : '',
    confidenceScore: typeof res.confidenceScore === 'number' ? res.confidenceScore : 96
  };
}

async function callGeminiWithRetryAndFallback(
  client: GoogleGenAI,
  params: {
    contents: any;
    primaryModel?: string;
    fallbackModels?: string[];
  }
): Promise<{ text: string; modelUsed: string }> {
  // Ordered from highest availability & speed to deeper reasoning
  const modelsToTry = [
    params.primaryModel || 'gemini-flash-latest',
    ...(params.fallbackModels || ['gemini-3.1-flash-lite', 'gemini-3.7-flash'])
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: params.contents
      });

      if (response && typeof response.text === 'string') {
        return { text: response.text, modelUsed: model };
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      const isTransient =
        errMsg.includes('503') ||
        errMsg.includes('429') ||
        errMsg.includes('high demand') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('temporarily') ||
        errMsg.includes('Overloaded');

      console.warn(`[Gemini API] Model ${model} unavailable (${isTransient ? 'High Demand/503' : 'Error'}). Switching to fallback...`);
      // When model is overloaded with 503 or 429, immediately switch to the next fallback model without delay
    }
  }

  throw lastError || new Error('All Gemini model generation attempts failed.');
}

function parseJsonFromGeminiResponse(responseText: string): any {
  if (!responseText) return null;
  // Strip Markdown code fence block if present
  let cleanText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
  const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  return null;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for large base64 image uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString()
    });
  });

  // Google OAuth 2.0 In-Memory CSRF State Store
  interface OAuthStateRecord {
    createdAt: number;
    redirectUri: string;
  }
  const oauthStates = new Map<string, OAuthStateRecord>();

  // Periodically clean up stale OAuth states older than 15 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of oauthStates.entries()) {
      if (now - record.createdAt > 15 * 60 * 1000) {
        oauthStates.delete(key);
      }
    }
  }, 10 * 60 * 1000);

  function escapeHtml(str: string): string {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 1. Google OAuth Configuration Status Endpoint
  app.get('/api/auth/google/config', (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.trim() : null;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET ? process.env.GOOGLE_CLIENT_SECRET.trim() : null;
    const isConfigured = Boolean(clientId && clientSecret);

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const dynamicCallback = `${protocol}://${host}/auth/google/callback`;

    // Prioritize explicit GOOGLE_REDIRECT_URI, then APP_URL, then dynamicCallback
    const activeRedirect = (process.env.GOOGLE_REDIRECT_URI && process.env.GOOGLE_REDIRECT_URI.trim())
      || (process.env.APP_URL ? `${process.env.APP_URL.trim()}/auth/google/callback` : dynamicCallback);

    res.json({
      configured: isConfigured,
      clientId: clientId || null,
      redirectUri: activeRedirect,
      urls: {
        active: activeRedirect,
        envRedirect: process.env.GOOGLE_REDIRECT_URI || null,
        local: 'http://localhost:3000/auth/google/callback',
        dev: 'https://ais-dev-gpew27cmtvqf5mfxh6xd6y-412084889689.asia-southeast1.run.app/auth/google/callback',
        shared: 'https://ais-pre-gpew27cmtvqf5mfxh6xd6y-412084889689.asia-southeast1.run.app/auth/google/callback',
        detected: dynamicCallback,
      },
    });
  });

  // 2. Google OAuth Authorization URL Generator
  app.get('/api/auth/google/url', (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.trim() : null;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET ? process.env.GOOGLE_CLIENT_SECRET.trim() : null;

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const dynamicCallback = `${protocol}://${host}/auth/google/callback`;

    // Strict redirect resolution conforming to AI Studio OAuth skill:
    // 1. Explicit GOOGLE_REDIRECT_URI from environment
    // 2. APP_URL from environment (provided by AI Studio)
    // 3. Client requested redirect URI if provided
    // 4. Dynamic request origin
    let resolvedRedirect: string;
    if (process.env.GOOGLE_REDIRECT_URI && process.env.GOOGLE_REDIRECT_URI.trim()) {
      resolvedRedirect = process.env.GOOGLE_REDIRECT_URI.trim();
    } else if (process.env.APP_URL && process.env.APP_URL.trim()) {
      resolvedRedirect = `${process.env.APP_URL.trim()}/auth/google/callback`;
    } else if (typeof req.query.redirect_uri === 'string' && req.query.redirect_uri.trim()) {
      resolvedRedirect = req.query.redirect_uri.trim();
    } else {
      resolvedRedirect = dynamicCallback;
    }

    if (!clientId || !clientSecret) {
      return res.status(503).json({
        error: 'Google OAuth 2.0 is not configured on the PLiMS server. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment (.env).',
        code: 'CONFIG_REQUIRED',
        configured: false,
        urls: {
          local: 'http://localhost:3000/auth/google/callback',
          dev: 'https://ais-dev-gpew27cmtvqf5mfxh6xd6y-412084889689.asia-southeast1.run.app/auth/google/callback',
          shared: 'https://ais-pre-gpew27cmtvqf5mfxh6xd6y-412084889689.asia-southeast1.run.app/auth/google/callback',
          detected: dynamicCallback,
        },
      });
    }

    const stateToken = crypto.randomBytes(32).toString('hex');
    oauthStates.set(stateToken, {
      createdAt: Date.now(),
      redirectUri: resolvedRedirect,
    });

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: resolvedRedirect,
      response_type: 'code',
      scope: 'openid email profile',
      state: stateToken,
      access_type: 'offline',
      prompt: 'select_account',
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return res.json({
      url: authUrl,
      state: stateToken,
      configured: true,
      redirectUri: resolvedRedirect,
    });
  });

  // 3. Google OAuth Redirect Callback Handler
  app.get(['/auth/google/callback', '/auth/google/callback/'], async (req, res) => {
    const { code, state, error, error_description } = req.query;

    const renderAuthResultHtml = (success: boolean, data: { errorMsg?: string; payload?: any }) => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      if (success && data.payload) {
        return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PLiMS - Google Authentication</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #09090b; color: #fafafa; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: #121214; border: 1px solid #10b981; border-radius: 16px; padding: 32px; max-width: 440px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
    .icon { width: 44px; height: 44px; margin: 0 auto 16px; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #34d399; font-size: 20px; }
    h2 { margin: 0 0 8px; font-size: 18px; color: #34d399; }
    p { margin: 0 0 12px; font-size: 13px; color: #a1a1aa; line-height: 1.5; }
    .user-pill { display: inline-flex; align-items: center; gap: 8px; background: #18181b; border: 1px solid #27272a; padding: 6px 12px; border-radius: 9999px; margin-top: 8px; font-size: 12px; font-weight: 500; color: #fff; }
    .user-pill img { width: 20px; height: 20px; border-radius: 50%; }
    .loader { margin-top: 16px; font-size: 11px; color: #71717a; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h2>Authentication Verified</h2>
    <p>Signed in successfully through Google OAuth 2.0</p>
    <div class="user-pill">
      ${data.payload.picture ? `<img src="${escapeHtml(data.payload.picture)}" alt="avatar" />` : ''}
      <span>${escapeHtml(data.payload.name || data.payload.email)}</span>
    </div>
    <div class="loader">Transferring secure credentials to PLiMS...</div>
  </div>
  <script>
    (function() {
      try {
        var payload = ${JSON.stringify(data.payload)};
        try {
          localStorage.setItem('pslims_google_auth_payload', JSON.stringify(payload));
          localStorage.setItem('pslims_is_authenticated', 'true');
        } catch (storageErr) {
          console.warn('LocalStorage save notice:', storageErr);
        }

        if (window.opener && window.opener !== window) {
          window.opener.postMessage({
            type: 'PLIMS_GOOGLE_AUTH_SUCCESS',
            payload: payload
          }, '*');
          setTimeout(function() {
            try {
              if (window.opener) {
                window.opener.postMessage({
                  type: 'PLIMS_GOOGLE_AUTH_SUCCESS',
                  payload: payload
                }, '*');
              }
            } catch(e) {}
          }, 150);
          setTimeout(function() { window.close(); }, 800);
        } else {
          window.location.replace('/');
        }
      } catch (err) {
        console.error('PostMessage error:', err);
        window.location.replace('/');
      }
    })();
  </script>
</body>
</html>`);
      } else {
        const errText = data.errorMsg || 'Google authentication notice.';
        return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PLiMS - Authentication Notice</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #080b09; color: #fafafa; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: #121413; border: 1px solid #10b981; border-radius: 18px; padding: 32px; max-width: 460px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.6); }
    .icon { width: 48px; height: 48px; margin: 0 auto 16px; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #34d399; font-size: 20px; }
    h2 { margin: 0 0 8px; font-size: 18px; color: #ffffff; }
    p { margin: 0 0 20px; font-size: 13px; color: #a1a1aa; line-height: 1.5; }
    .btn { background: #095733; color: #fff; border: 1px solid #10b981; padding: 10px 22px; border-radius: 12px; cursor: pointer; font-size: 13px; font-weight: 600; text-decoration: none; display: inline-block; transition: all 0.2s; }
    .btn:hover { background: #074729; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">ℹ</div>
    <h2>Connecting to PLiMS</h2>
    <p>${escapeHtml(errText)}</p>
    <button class="btn" onclick="if(window.opener){window.close();}else{window.location.replace('/');}">Direct Connect to PLiMS Login Portal</button>
  </div>
  <script>
    (function() {
      try {
        if (window.opener && window.opener !== window) {
          window.opener.postMessage({
            type: 'PLIMS_GOOGLE_AUTH_ERROR',
            error: ${JSON.stringify(errText)}
          }, '*');
          setTimeout(function() { window.close(); }, 900);
        } else {
          setTimeout(function() { window.location.replace('/'); }, 2500);
        }
      } catch (err) {
        console.error('Callback handler notice:', err);
        window.location.replace('/');
      }
    })();
  </script>
</body>
</html>`);
      }
    };

    if (error) {
      const msg = typeof error_description === 'string'
        ? error_description
        : error === 'access_denied'
        ? 'Google sign-in was cancelled by the user.'
        : `Google OAuth returned error: ${error}`;
      return renderAuthResultHtml(false, { errorMsg: msg });
    }

    if (!code || typeof code !== 'string') {
      return renderAuthResultHtml(false, { errorMsg: 'No authorization code received. Redirecting to PLiMS...' });
    }

    const stateToken = typeof state === 'string' ? state : '';
    const stateRecord = stateToken ? oauthStates.get(stateToken) : null;
    if (stateToken && stateRecord) {
      oauthStates.delete(stateToken);
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const dynamicCallback = `${protocol}://${host}/auth/google/callback`;

    const redirectUriToUse =
      stateRecord?.redirectUri ||
      process.env.GOOGLE_REDIRECT_URI ||
      (process.env.APP_URL ? `${process.env.APP_URL.trim()}/auth/google/callback` : dynamicCallback);

    const clientId = process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.trim() : null;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET ? process.env.GOOGLE_CLIENT_SECRET.trim() : null;

    if (!clientId || !clientSecret) {
      return renderAuthResultHtml(false, { errorMsg: 'Google OAuth credentials not configured on server. Redirecting to Login Portal...' });
    }

    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUriToUse,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const errBody = await tokenResponse.text();
        console.error('[Google OAuth Token Error]:', errBody);
        let parsedErrMsg = 'Token exchange failed';
        try {
          const parsed = JSON.parse(errBody);
          parsedErrMsg = parsed.error_description || parsed.error || parsedErrMsg;
        } catch {
          // ignore
        }
        return renderAuthResultHtml(false, { errorMsg: `Connecting to PLiMS: ${parsedErrMsg}` });
      }

      const tokenData: any = await tokenResponse.json();

      const userInfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        return renderAuthResultHtml(false, { errorMsg: 'Failed to retrieve verified user profile from Google OpenID Connect.' });
      }

      const userInfo: any = await userInfoResponse.json();

      if (!userInfo.sub || !userInfo.email) {
        return renderAuthResultHtml(false, { errorMsg: 'Incomplete user profile received from Google.' });
      }

      const sessionToken = crypto.randomBytes(32).toString('hex');
      res.cookie('plims_session', sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const sanitizedPayload = {
        sub: String(userInfo.sub),
        email: String(userInfo.email),
        name: String(userInfo.name || userInfo.email.split('@')[0]),
        picture: typeof userInfo.picture === 'string' ? userInfo.picture : undefined,
        emailVerified: Boolean(userInfo.email_verified),
      };

      return renderAuthResultHtml(true, { payload: sanitizedPayload });
    } catch (authErr: any) {
      console.error('[Google Auth Callback Exception]:', authErr);
      return renderAuthResultHtml(false, { errorMsg: 'Network notice during Google communication. Returning to PLiMS...' });
    }
  });

  // 3b. Direct JSON Code Exchange API Endpoint (Used by client SPA or popups)
  app.all('/api/auth/google/exchange', async (req, res) => {
    const code = req.query.code || req.body?.code;
    const state = req.query.state || req.body?.state;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.trim() : null;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET ? process.env.GOOGLE_CLIENT_SECRET.trim() : null;

    if (!clientId || !clientSecret) {
      return res.status(503).json({ error: 'Google OAuth credentials not configured on server' });
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const dynamicCallback = `${protocol}://${host}/auth/google/callback`;

    let redirectUriToUse = process.env.GOOGLE_REDIRECT_URI || (process.env.APP_URL ? `${process.env.APP_URL.trim()}/auth/google/callback` : dynamicCallback);
    if (state && typeof state === 'string') {
      const stateRecord = oauthStates.get(state);
      if (stateRecord) {
        redirectUriToUse = stateRecord.redirectUri;
        oauthStates.delete(state);
      }
    }

    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUriToUse,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text();
        return res.status(400).json({ error: 'Token exchange failed', details: errText });
      }

      const tokenData: any = await tokenResponse.json();
      const userInfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!userInfoResponse.ok) {
        return res.status(400).json({ error: 'Failed to retrieve user profile from Google' });
      }

      const userInfo: any = await userInfoResponse.json();
      const sessionToken = crypto.randomBytes(32).toString('hex');
      res.cookie('plims_session', sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const sanitizedPayload = {
        sub: String(userInfo.sub),
        email: String(userInfo.email),
        name: String(userInfo.name || userInfo.email.split('@')[0]),
        picture: typeof userInfo.picture === 'string' ? userInfo.picture : undefined,
        emailVerified: Boolean(userInfo.email_verified),
      };

      res.json({ success: true, payload: sanitizedPayload });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Server error during OAuth exchange' });
    }
  });

  // 4. Terminate PLiMS Session
  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('plims_session', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    res.json({ success: true, message: 'Logged out of PLiMS session successfully' });
  });

  // AI Vision MARC Agent endpoint
  app.post('/api/gemini/vision-cataloguing', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg' } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'imageBase64 is required' });
      }

      const client = getAiClient();
      if (!client) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY is not configured on the server.',
          fallbackAllowed: true
        });
      }

      // Handle image URLs (e.g. sample covers) or base64 strings
      let cleanBase64 = '';
      let resolvedMimeType = mimeType || 'image/jpeg';

      if (typeof imageBase64 === 'string' && (imageBase64.startsWith('http://') || imageBase64.startsWith('https://'))) {
        const imageFetchRes = await fetch(imageBase64);
        if (!imageFetchRes.ok) {
          throw new Error(`Failed to fetch image from URL: ${imageBase64}`);
        }
        const arrayBuf = await imageFetchRes.arrayBuffer();
        cleanBase64 = Buffer.from(arrayBuf).toString('base64');
        const contentType = imageFetchRes.headers.get('content-type');
        if (contentType && contentType.startsWith('image/')) {
          resolvedMimeType = contentType;
        }
      } else if (typeof imageBase64 === 'string' && imageBase64.includes('base64,')) {
        const parts = imageBase64.split('base64,');
        cleanBase64 = parts[1];
        const matchMime = parts[0].match(/data:(.*?);/);
        if (matchMime && matchMime[1]) {
          resolvedMimeType = matchMime[1];
        }
      } else {
        cleanBase64 = imageBase64;
      }

      const imagePart = {
        inlineData: {
          mimeType: resolvedMimeType || 'image/jpeg',
          data: cleanBase64,
        },
      };

      const textPart = {
        text: `You are a Senior Library & Information Science (LIS) Cataloguer specializing in MARC21 (ISO 2709), Resource Description & Access (RDA), Dewey Decimal Classification (DDC 23rd Edition), and Library of Congress Subject Headings (LCSH).

Analyze this uploaded image of a book cover, title page, book jacket, or spine.
Perform optical character recognition (OCR) and cataloguing extraction. Extract or intelligently infer all bibliographic attributes:

Return a valid, strict JSON object (and nothing else) with these exact keys:
{
  "title": "Title Proper of the book without author (Multilingual/Unicode supported)",
  "subtitle": "Subtitle or secondary title if visible or relevant, otherwise empty string",
  "authors": ["Full Author 1 Name", "Full Author 2 Name"],
  "isbn": "10 or 13 digit ISBN if visible or standard format (e.g. 978-...)",
  "publisherName": "Identified or inferred scholarly/trade publisher",
  "publisherLocation": "Publication city/country (e.g. New York / London / Islamabad / Cambridge)",
  "publisherYear": 2024,
  "edition": "Identified edition (e.g. '1st Edition', '2nd Edition', 'Revised Edition')",
  "pageCount": 350,
  "department": "Academic Department (e.g. Computer Science, Electrical Engineering, Medical Sciences, Law & Humanities, Business Administration, Literature, General Science)",
  "format": "HARDCOVER" | "PAPERBACK" | "SPIRAL" | "JOURNAL_VOLUME" | "THESIS_REPORT",
  "callNumber": "Computed LIS call number (e.g. '005.133 MAR 2024')",
  "ddcClassification": "Dewey Decimal 3-digit class with decimal (e.g. '005.133' or '610.28')",
  "cutterNumber": "Cutter-Sanborn 3-character code (e.g. 'M381')",
  "subjects": ["LCSH Subject Heading 1", "LCSH Subject Heading 2", "LCSH Subject Heading 3"],
  "abstract": "Scholarly summary / scope note of this book in 100-150 words",
  "detectedText": "Key headline OCR text detected directly on the cover/page",
  "confidenceScore": 96,
  "marc21Tags": [
    { "tag": "020", "ind1": "#", "ind2": "#", "subfields": "$a 978..." },
    { "tag": "040", "ind1": "#", "ind2": "#", "subfields": "$a PK-ISB $b eng $c PK-ISB $e rda" },
    { "tag": "082", "ind1": "0", "ind2": "4", "subfields": "$a [DDC] $2 23" },
    { "tag": "100", "ind1": "1", "ind2": "#", "subfields": "$a [Author Surname, Given], $e author." },
    { "tag": "245", "ind1": "1", "ind2": "0", "subfields": "$a [Title] : $b [Subtitle] / $c [Authors]." },
    { "tag": "250", "ind1": "#", "ind2": "#", "subfields": "$a [Edition]." },
    { "tag": "264", "ind1": "#", "ind2": "1", "subfields": "$a [Place] : $b [Publisher], $c [Year]." },
    { "tag": "300", "ind1": "#", "ind2": "#", "subfields": "$a xxiv, [pages] pages : $b illustrations ; $c 24 cm." },
    { "tag": "520", "ind1": "3", "ind2": "#", "subfields": "$a [Abstract summary]" },
    { "tag": "650", "ind1": "#", "ind2": "0", "subfields": "$a [Subject 1] $x [Subdivision]." },
    { "tag": "852", "ind1": "4", "ind2": "#", "subfields": "$b Central Academic Library $h [Call Number]" }
  ],
  "rdaGuidelines": "RDA Core Elements verified: Title proper (2.3.2), Statement of responsibility (2.4.2), Publication statement (2.8), Carrier type (3.3), Content type (6.9)."
}`
      };

      const { text: responseText, modelUsed } = await callGeminiWithRetryAndFallback(client, {
        contents: { parts: [imagePart, textPart] },
        primaryModel: 'gemini-3.7-flash',
        fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite']
      });

      const parsed = parseJsonFromGeminiResponse(responseText);
      if (!parsed) {
        return res.status(500).json({ error: 'Failed to extract JSON from Gemini vision response', raw: responseText, modelUsed });
      }

      const sanitized = sanitizeAiResult(parsed);
      return res.json({ result: sanitized, modelUsed });
    } catch (err: any) {
      console.error('Error in /api/gemini/vision-cataloguing:', err);
      return res.status(500).json({
        error: err.message || 'Error processing book cover image with Gemini Vision',
        fallbackAllowed: true
      });
    }
  });

  // AI Text / ISBN Cataloguing Assistant endpoint
  app.post('/api/gemini/text-cataloguing', async (req, res) => {
    try {
      const { titleOrIsbn } = req.body;
      if (!titleOrIsbn) {
        return res.status(400).json({ error: 'titleOrIsbn is required' });
      }

      const client = getAiClient();
      if (!client) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY is not configured on the server.',
          fallbackAllowed: true
        });
      }

      const { text: responseText, modelUsed } = await callGeminiWithRetryAndFallback(client, {
        contents: `You are an expert Library & Information Science (LIS) cataloguer specializing in MARC21, RDA, DDC 23rd Edition, and LCSH.
Analyze the following book title or ISBN: "${titleOrIsbn}".
Return a strict JSON object with these fields:
- title: string
- subtitle: string
- authors: array of strings
- isbn: string (10 or 13 digits)
- publisherName: string
- publisherLocation: string
- publisherYear: number
- edition: string
- pageCount: number
- department: string
- format: "HARDCOVER" | "PAPERBACK" | "SPIRAL" | "JOURNAL_VOLUME" | "THESIS_REPORT"
- callNumber: string (e.g. "005.133 THO 2023")
- ddcClassification: string (e.g. "005.133")
- cutterNumber: string (e.g. "T481")
- subjects: array of strings (Library of Congress Subject Headings)
- abstract: string (100-150 words scholarly summary)
- detectedText: string
- confidenceScore: number
- marc21Tags: array of objects with { tag, ind1, ind2, subfields }
- rdaGuidelines: string (RDA core elements statement)`,
        primaryModel: 'gemini-flash-latest',
        fallbackModels: ['gemini-3.1-flash-lite', 'gemini-3.7-flash']
      });

      const parsed = parseJsonFromGeminiResponse(responseText);
      if (!parsed) {
        return res.status(500).json({ error: 'Failed to extract JSON from Gemini cataloguing response', raw: responseText, modelUsed });
      }

      const sanitized = sanitizeAiResult(parsed);
      return res.json({ result: sanitized, modelUsed });
    } catch (err: any) {
      console.error('Error in /api/gemini/text-cataloguing:', err);
      return res.status(500).json({
        error: err.message || 'Error processing cataloguing with Gemini',
        fallbackAllowed: true
      });
    }
  });

  // AI Copilot Chat endpoint
  app.post('/api/gemini/copilot', async (req, res) => {
    try {
      const { userPrompt, conversationHistory = [] } = req.body;
      if (!userPrompt) {
        return res.status(400).json({ error: 'userPrompt is required' });
      }

      const client = getAiClient();
      if (!client) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY is not configured on the server.',
          fallbackAllowed: true
        });
      }

      const formattedHistory = Array.isArray(conversationHistory)
        ? conversationHistory.map((m: any) => `${(m.sender || 'user').toUpperCase()}: ${m.text || ''}`).join('\n')
        : '';

      const { text: responseText, modelUsed } = await callGeminiWithRetryAndFallback(client, {
        contents: `You are the official PLiMS V4.1.1 Gemini Library Copilot and Senior AI Information Scientist for the Pakistan Library Management System (PLiMS V4.1.1 PK edition).
You have full comprehensive knowledge of PLiMS V4.1.1 PK edition modules, services, architectures, and workflows:

PLiMS V4.1.1 Core Modules & Capabilities:
1. Executive Dashboard: Metrics, active issues, branch management (Add/Remove campus branches), widget customizer.
2. Public OPAC: Real-time search, MARC21 view, online book holds, campus branch filtering, citation generation (APA/IEEE/MLA).
3. MARC21 / RDA Cataloguing & AI Auto-Tagging: Vision Book Cover AI scanner, Title/ISBN AI metadata extraction, accession barcode generator, DDC 23 classification.
4. Authority Control (LCSH): Library of Congress Subject Headings, personal names, corporate bodies, 1XX/5XX MARC tags, Add Authority Headings.
5. Circulation Desk: Book issue, return, renewal, grace period rules, fine calculation (PKR 5/day), fine waiver desk, offline sync queue.
6. Patron & Staff Directory: User management, Super Admin powers matrix, member ID card generator & HTML export, Add/Remove member controls.
7. Digital Repository: Institutional repository, research PDFs, e-journals, thesis archiving.
8. Acquisitions & Vendor Orders: Purchase requisitions, purchase order creation (Add PO), vendor management (Add Vendor), budget heads.
9. Serials & Periodicals Control: Subscription management (Add Subscription), issue check-ins, ISSN tracking, claims.
10. Stock Verification & Barcode Generator: Physical shelf audits, barcode label printing, RFID tag encoding.
11. Reports & Analytics: Monthly circulation trends, fine receipts, accession registers, export CSV/PDF.
12. Architecture Specs & Manual (HELP_DOCS): System architecture documentation, MySQL/local state schemas, available exclusively to Super Admin & Head Librarians.

Conversation Context:
${formattedHistory}

User Request: "${userPrompt}"

Provide a detailed, expert, helpful, and professional response regarding PLiMS V4.1.1 PK edition services, modules, or LIS standards in clear, well-structured paragraphs with bullet points.`,
        primaryModel: 'gemini-flash-latest',
        fallbackModels: ['gemini-3.1-flash-lite', 'gemini-3.7-flash']
      });

      return res.json({ text: responseText || '', modelUsed });
    } catch (err: any) {
      console.error('Error in /api/gemini/copilot:', err);
      return res.status(500).json({
        error: err.message || 'Error executing Gemini copilot',
        fallbackAllowed: true
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(rootDir, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PLiMS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
