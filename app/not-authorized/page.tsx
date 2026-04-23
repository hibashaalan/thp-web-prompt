'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function NotAuthorized() {
  const supabase = createClient()
  useEffect(() => { supabase.auth.signOut() }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ animation: 'fadeUp 0.4s ease both' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Access Denied</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
          You need superadmin or matrix_admin privileges.
        </p>
        <a href="/api/signout" style={{
          display: 'inline-block', padding: '10px 20px',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 8, color: 'var(--text)', fontSize: 13, fontWeight: 600,
        }}>← Try a different account</a>
      </div>
    </div>
  )
}
