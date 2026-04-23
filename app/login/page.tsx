'use client'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const signIn = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    })
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{ width: '100%', maxWidth: 400, animation: 'fadeUp 0.4s ease both' }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', width: 52, height: 52, borderRadius: 14,
            background: 'var(--accent)', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, marginBottom: 16,
          }}>🧪</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 6 }}>
            Humor Flavor Studio
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Build and test AI caption prompt chains
          </p>
        </div>

        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '2rem',
        }}>
          <div style={{
            background: 'var(--accent-dim)', border: '1px solid rgba(196,137,42,0.2)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 20,
            display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <span>🔐</span>
            <p style={{ fontSize: 12, color: 'var(--text-mid)' }}>
              Requires <code style={{ fontFamily: 'DM Mono, monospace', fontSize: 11 }}>is_superadmin</code> or <code style={{ fontFamily: 'DM Mono, monospace', fontSize: 11 }}>is_matrix_admin</code>
            </p>
          </div>

          <button onClick={signIn} disabled={loading} style={{
            width: '100%', padding: '12px 16px',
            background: loading ? 'var(--surface2)' : 'var(--text)',
            color: loading ? 'var(--text-muted)' : 'var(--bg)',
            border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            cursor: loading ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s',
          }}>
            {loading ? 'Redirecting…' : (
              <>
                <svg width="16" height="16" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
