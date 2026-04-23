'use client'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    const html = document.documentElement
    if (theme === 'system') {
      html.removeAttribute('data-theme')
    } else {
      html.setAttribute('data-theme', theme)
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const icons = { light: '☀️', dark: '🌙', system: '💻' }
  const next = { light: 'dark', dark: 'system', system: 'light' } as const

  return (
    <button
      onClick={() => setTheme(next[theme])}
      title={`Theme: ${theme}`}
      style={{
        width: 34, height: 34, borderRadius: 8,
        background: 'var(--surface2)', border: '1px solid var(--border)',
        fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {icons[theme]}
    </button>
  )
}
