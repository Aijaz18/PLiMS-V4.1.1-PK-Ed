import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Only handle callback directly in main.tsx IF this is a popup child window opened with window.opener
const isPopupChildWindow =
  typeof window !== 'undefined' &&
  Boolean(window.opener && window.opener !== window) &&
  (window.location.pathname.startsWith('/auth/google/callback') ||
    (window.location.search.includes('code=') && window.location.search.includes('state=')));

if (isPopupChildWindow) {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const error = urlParams.get('error');
  const errorDesc = urlParams.get('error_description');

  if (error) {
    try {
      window.opener?.postMessage(
        {
          type: 'PLIMS_GOOGLE_AUTH_ERROR',
          error: errorDesc || error,
        },
        '*'
      );
    } catch {
      // ignore
    }
    setTimeout(() => {
      try {
        window.close();
      } catch {}
    }, 600);
  } else if (code) {
    // Exchange the authorization code via the backend JSON API endpoint
    fetch(`/api/auth/google/exchange?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || '')}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.payload) {
          window.opener?.postMessage(
            {
              type: 'PLIMS_GOOGLE_AUTH_SUCCESS',
              payload: data.payload,
            },
            '*'
          );
        } else {
          window.opener?.postMessage(
            {
              type: 'PLIMS_GOOGLE_AUTH_ERROR',
              error: data.error || 'Authentication exchange failed',
            },
            '*'
          );
        }
        setTimeout(() => {
          try {
            window.close();
          } catch {}
        }, 600);
      })
      .catch((err) => {
        try {
          window.opener?.postMessage(
            {
              type: 'PLIMS_GOOGLE_AUTH_ERROR',
              error: err.message || 'Network error during Google authentication',
            },
            '*'
          );
        } catch {}
        setTimeout(() => {
          try {
            window.close();
          } catch {}
        }, 600);
      });
  }

  // Display clean lightweight loading state in popup
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="font-family: system-ui, -apple-system, sans-serif; background: #09090b; color: #fafafa; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 20px; box-sizing: border-box;">
        <div style="width: 36px; height: 36px; border: 3px solid #27272a; border-top-color: #10b981; border-radius: 50%; animation: plims-spin 0.8s linear infinite; margin-bottom: 16px;"></div>
        <div style="font-weight: 600; font-size: 15px; margin-bottom: 6px;">Transferring credentials to PLiMS...</div>
        <div style="font-size: 12px; color: #a1a1aa;">This window will close automatically.</div>
        <style>@keyframes plims-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
      </div>
    `;
  }
} else {
  // Main application window (renders PLiMS App)
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
