'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import ThemeToggle from './ThemeToggle'

export default function FlavorsPage() {
  const [flavors, setFlavors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newDesc, setNewDesc] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  const load = async () => {
    const { data: userData } = await supabase.auth.getUser()
    setUser(userData?.user)
    const { data } = await supabase
      .from('humor_flavors')
      .select('*, humor_flavor_steps(count)')
      .order('created_datetime_utc', { ascending: false })
    setFlavors(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    if (!newSlug.trim()) return
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id
    const { data, error } = await supabase.from('humor_flavors').insert({
      slug: newSlug.trim(),
      description: newDesc.trim() || null,
      created_by_user_id: userId,
      modified_by_user_id: userId,
    }).select().single()
    if (!error && data) {
      setNewDesc(''); setNewSlug(''); setCreating(false)
      load()
    }
  }

  const deleteFlavor = async (id: number) => {
    if (!confirm('Delete this flavor and all its steps?')) return
    await supabase.from('humor_flavor_steps').delete().eq('humor_flavor_id', id)
    await supabase.from('humor_flavors').delete().eq('id', id)
    load()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Nav */}
      <header style={{
        borderBottom: '1px solid var(--border)', background: 'var(--surface)',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🧪</span>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>Humor Flavor Studio</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ThemeToggle />
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {user.user_metadata?.avatar_url && (
                <img src={user.user_metadata.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
              )}
              <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>{user.user_metadata?.full_name || user.email?.split('@')[0]}</span>
              <a href="/api/signout" style={{
                padding: '5px 12px', border: '1px solid var(--border)',
                borderRadius: 7, fontSize: 12, color: 'var(--text-muted)',
                background: 'transparent',
              }}>Sign out</a>
            </div>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>Humor Flavors</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{flavors.length} flavors total</p>
          </div>
          <button onClick={() => setCreating(true)} style={{
            padding: '9px 18px', background: 'var(--accent)', color: '#000',
            border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            + New Flavor
          </button>
        </div>

        {/* Create form */}
        {creating && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--accent)',
            borderRadius: 12, padding: '20px', marginBottom: 20,
            animation: 'fadeUp 0.2s ease both',
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>New Humor Flavor</h3>
            <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Slug *</label>
                <input
                  value={newSlug} onChange={e => setNewSlug(e.target.value)}
                  placeholder="my-humor-flavor"
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontSize: 13, fontFamily: 'DM Mono, monospace' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</label>
                <textarea
                  value={newDesc} onChange={e => setNewDesc(e.target.value)}
                  placeholder="What does this flavor do?"
                  rows={2}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontSize: 13, resize: 'vertical' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={create} style={{ padding: '8px 18px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 7, fontWeight: 700, fontSize: 13 }}>
                Create Flavor
              </button>
              <button onClick={() => setCreating(false)} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text-muted)', fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div style={{ display: 'grid', gap: 8 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: 72, background: 'var(--surface)', borderRadius: 12, animation: 'pulse 1.5s ease infinite', opacity: 0.5 }} />
            ))}
          </div>
        ) : flavors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🧬</div>
            <p>No flavors yet. Create one above.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {flavors.map(f => (
              <div key={f.id} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: 16,
                transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                    <code style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{f.slug}</code>
                    {f.is_pinned && <span style={{ fontSize: 10, background: 'var(--accent-dim)', color: 'var(--accent)', padding: '1px 7px', borderRadius: 4, fontWeight: 600 }}>PINNED</span>}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>#{f.id}</span>
                  </div>
                  {f.description && <p style={{ fontSize: 12, color: 'var(--text-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.description}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {f.humor_flavor_steps?.[0]?.count ?? 0} steps
                  </span>
                  <Link href={`/flavors/${f.id}`} style={{
                    padding: '6px 14px', background: 'var(--surface2)',
                    border: '1px solid var(--border)', borderRadius: 7,
                    fontSize: 12, fontWeight: 600, color: 'var(--text)',
                  }}>
                    Edit →
                  </Link>
                  <button onClick={() => deleteFlavor(f.id)} style={{
                    padding: '6px 12px', background: 'transparent',
                    border: '1px solid rgba(224,92,92,0.3)', borderRadius: 7,
                    fontSize: 12, color: 'var(--danger)', cursor: 'pointer',
                  }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:.25} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  )
}
