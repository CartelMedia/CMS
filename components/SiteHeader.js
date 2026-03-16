'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Search, Menu, X, Shield, Rss } from 'lucide-react'

export default function SiteHeader() {
  const [menuItems, setMenuItems] = useState([])
  const [siteName, setSiteName] = useState('ModernCMS')
  const [tagline, setTagline] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const [menuRes, settingsRes] = await Promise.all([
        supabase.from('menus').select('*, items:menu_items(*)').eq('location', 'primary').maybeSingle(),
        supabase.from('options').select('option_key, option_value').in('option_key', ['site_title', 'tagline']),
      ])

      if (menuRes.data?.items) {
        setMenuItems(menuRes.data.items.sort((a, b) => a.position - b.position))
      }
      if (settingsRes.data) {
        settingsRes.data.forEach(row => {
          if (row.option_key === 'site_title') setSiteName(row.option_value)
          if (row.option_key === 'tagline') setTagline(row.option_value)
        })
      }
    }
    load()
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  function handleSearch(e) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const navItems = menuItems.length > 0 ? menuItems : [
    { id: 1, label: 'Home', url: '/' },
    { id: 2, label: 'Blog', url: '/blog' },
    { id: 3, label: 'About', url: '/about' },
    { id: 4, label: 'Contact', url: '/contact' },
  ]

  return (
    <>
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(8,8,16,0.85)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          padding: '0 24px', height: '64px',
          display: 'flex', alignItems: 'center', gap: '24px',
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}>
            <div style={{
              width: '34px', height: '34px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
            }}>
              <Shield size={18} color="white" />
            </div>
            <div>
              <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '16px', lineHeight: 1.1 }}>{siteName}</div>
              {tagline && <div style={{ color: '#475569', fontSize: '11px', lineHeight: 1.1 }}>{tagline}</div>}
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
            {navItems.map(item => {
              const active = pathname === item.url || (item.url !== '/' && pathname.startsWith(item.url))
              return (
                <Link
                  key={item.id}
                  href={item.url || '#'}
                  target={item.target === '_blank' ? '_blank' : undefined}
                  rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
                  style={{
                    padding: '6px 14px', borderRadius: '8px',
                    color: active ? '#a5b4fc' : '#94a3b8',
                    textDecoration: 'none', fontSize: '14px', fontWeight: active ? 600 : 400,
                    background: active ? 'rgba(99,102,241,0.12)' : 'none',
                    transition: 'all 0.15s', whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none' } }}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* Search */}
            <button
              onClick={() => setSearchOpen(v => !v)}
              style={{
                background: searchOpen ? 'rgba(99,102,241,0.12)' : 'none',
                border: 'none', cursor: 'pointer',
                color: searchOpen ? '#a5b4fc' : '#64748b',
                padding: '8px', borderRadius: '8px',
                display: 'flex', alignItems: 'center',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.color = searchOpen ? '#a5b4fc' : '#64748b'; e.currentTarget.style.background = searchOpen ? 'rgba(99,102,241,0.12)' : 'none' }}
            >
              <Search size={18} />
            </button>

            {/* RSS */}
            <Link href="/feed" style={{
              display: 'flex', alignItems: 'center',
              color: '#64748b', padding: '8px', borderRadius: '8px',
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f59e0b'; e.currentTarget.style.background = 'rgba(245,158,11,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'none' }}
            >
              <Rss size={16} />
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="mobile-menu-btn"
              style={{
                display: 'none', background: 'none', border: 'none',
                cursor: 'pointer', color: '#94a3b8', padding: '8px', borderRadius: '8px',
              }}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '12px 24px',
            background: 'rgba(8,8,16,0.95)',
          }}>
            <form onSubmit={handleSearch} style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
              <Search size={16} style={{
                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                color: '#475569', pointerEvents: 'none',
              }} />
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search posts, pages..."
                autoFocus
                style={{
                  width: '100%', padding: '10px 40px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', color: '#e2e8f0', fontSize: '14px', outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <button type="submit" style={{
                position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none', borderRadius: '6px', padding: '4px 12px',
                color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              }}>
                Search
              </button>
            </form>
          </div>
        )}

        {/* Mobile Nav */}
        {mobileOpen && (
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '12px 16px', background: 'rgba(8,8,16,0.98)',
          }}>
            {navItems.map(item => (
              <Link key={item.id} href={item.url || '#'} style={{
                display: 'block', padding: '10px 12px', borderRadius: '8px',
                color: pathname === item.url ? '#a5b4fc' : '#94a3b8',
                textDecoration: 'none', fontSize: '15px', marginBottom: '4px',
                background: pathname === item.url ? 'rgba(99,102,241,0.12)' : 'none',
              }}>
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
          nav { display: none !important; }
        }
        input[type="search"]::-webkit-search-cancel-button { display: none; }
        input::placeholder { color: #475569; }
      `}</style>
    </>
  )
}
