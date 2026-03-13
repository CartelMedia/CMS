'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, FileText, Image, BookOpen, MessageSquare,
  Palette, Puzzle, Users, Settings, Wrench, ChevronDown,
  Menu, X, Bell, ExternalLink, LogOut, User, Shield,
  Tag, FolderOpen, Plus, Search, Monitor, Sliders,
} from 'lucide-react'

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  {
    label: 'Posts', icon: FileText, children: [
      { label: 'All Posts', href: '/admin/posts' },
      { label: 'Add New', href: '/admin/posts/new', icon: Plus },
      { label: 'Categories', href: '/admin/categories', icon: FolderOpen },
      { label: 'Tags', href: '/admin/tags', icon: Tag },
    ]
  },
  { label: 'Media', icon: Image, href: '/admin/media' },
  {
    label: 'Pages', icon: BookOpen, children: [
      { label: 'All Pages', href: '/admin/pages' },
      { label: 'Add New', href: '/admin/pages/new', icon: Plus },
    ]
  },
  { label: 'Comments', icon: MessageSquare, href: '/admin/comments' },
  {
    label: 'Appearance', icon: Palette, children: [
      { label: 'Themes', href: '/admin/appearance/themes' },
      { label: 'Menus', href: '/admin/appearance/menus' },
      { label: 'Widgets', href: '/admin/appearance/widgets' },
      { label: 'Customizer', href: '/admin/appearance/customizer', icon: Sliders },
    ]
  },
  { label: 'Plugins', icon: Puzzle, href: '/admin/plugins' },
  {
    label: 'Users', icon: Users, children: [
      { label: 'All Users', href: '/admin/users' },
      { label: 'Add New', href: '/admin/users/new', icon: Plus },
      { label: 'Your Profile', href: '/admin/profile' },
    ]
  },
  { label: 'Settings', icon: Settings, href: '/admin/settings' },
  { label: 'Tools', icon: Wrench, href: '/admin/tools' },
]

function NavItem({ item, collapsed, pathname }) {
  const isActive = item.href ? pathname === item.href || pathname.startsWith(item.href + '/') : false
  const hasChildren = item.children?.length > 0
  const childActive = hasChildren && item.children.some(c => pathname === c.href || pathname.startsWith(c.href + '/'))
  const [open, setOpen] = useState(childActive)
  const Icon = item.icon

  useEffect(() => { if (childActive) setOpen(true) }, [childActive])

  if (!hasChildren) {
    return (
      <Link href={item.href} className={`nav-link ${isActive ? 'active' : ''}`} title={collapsed ? item.label : ''}>
        {Icon && <Icon size={18} />}
        {!collapsed && <span>{item.label}</span>}
      </Link>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`nav-link ${childActive ? 'active' : ''}`}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}
        title={collapsed ? item.label : ''}
      >
        {Icon && <Icon size={18} />}
        {!collapsed && (
          <>
            <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
            <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', opacity: 0.6 }} />
          </>
        )}
      </button>
      {!collapsed && open && (
        <div className="nav-sub">
          {item.children.map(child => {
            const SubIcon = child.icon
            const subActive = pathname === child.href || pathname.startsWith(child.href + '/')
            return (
              <Link key={child.href} href={child.href} className={`nav-link ${subActive ? 'active' : ''}`} style={{ paddingLeft: '2.5rem', fontSize: '0.8rem' }}>
                {SubIcon && <SubIcon size={14} />}
                <span>{child.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const pathname = usePathname()
  const router = useRouter()
  const userMenuRef = useRef(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else setUser(data.user)
    })
  }, [router])

  useEffect(() => {
    function handleClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Admin'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: 'var(--bg-primary)', color: 'var(--text-primary)',
    }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? '64px' : '240px',
        minHeight: '100vh',
        background: 'rgba(255,255,255,0.02)',
        borderRight: '1px solid var(--border)',
        transition: 'width 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden',
      }}>
        {/* Brand */}
        <div style={{
          height: '56px', display: 'flex', alignItems: 'center',
          padding: collapsed ? '0 1rem' : '0 1.25rem',
          borderBottom: '1px solid var(--border)',
          gap: '0.75rem', flexShrink: 0,
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Shield size={16} color="#fff" />
          </div>
          {!collapsed && (
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              ModernCMS
            </span>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0.75rem 0.5rem' }}>
          {NAV.map(item => (
            <NavItem key={item.label} item={item} collapsed={collapsed} pathname={pathname} />
          ))}
        </nav>

        {/* Collapse toggle */}
        <div style={{ padding: '0.75rem 0.5rem', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="nav-link"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', justifyContent: collapsed ? 'center' : 'flex-start' }}
          >
            {collapsed ? <Menu size={18} /> : <><X size={18} /><span>Collapse</span></>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{
          height: '56px', display: 'flex', alignItems: 'center',
          padding: '0 1.5rem', gap: '1rem',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(255,255,255,0.01)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            ModernCMS
          </span>
          <div style={{ flex: 1 }} />

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: '240px', width: '100%' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              placeholder="Search…"
              style={{
                width: '100%', height: '32px', paddingLeft: '2rem', paddingRight: '0.75rem',
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.8rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Visit site */}
          <Link href="/" target="_blank" style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            fontSize: '0.8rem', color: 'var(--text-secondary)', textDecoration: 'none',
            padding: '0.375rem 0.75rem', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
          }}>
            <ExternalLink size={13} /> Visit Site
          </Link>

          {/* Notifications */}
          <button style={{
            position: 'relative', background: 'none', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', width: '32px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-secondary)',
          }}>
            <Bell size={15} />
            <span style={{
              position: 'absolute', top: '5px', right: '5px', width: '7px', height: '7px',
              background: 'var(--danger)', borderRadius: '50%',
            }} />
          </button>

          {/* User menu */}
          <div style={{ position: 'relative' }} ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'none', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '0.25rem 0.625rem',
                cursor: 'pointer', color: 'var(--text-primary)',
              }}
            >
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 700, color: '#fff',
              }}>
                {initials}
              </div>
              <span style={{ fontSize: '0.8rem', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </span>
              <ChevronDown size={12} style={{ opacity: 0.6 }} />
            </button>

            {userMenuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 0.5rem)',
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '0.375rem',
                minWidth: '180px', zIndex: 100,
                boxShadow: 'var(--shadow-lg)',
              }}>
                <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '0.25rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{displayName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                </div>
                {[
                  { icon: User, label: 'Your Profile', href: '/admin/profile' },
                  { icon: Settings, label: 'Account Settings', href: '/admin/settings' },
                  { icon: Monitor, label: 'Visit Site', href: '/', external: true },
                ].map(item => (
                  <Link key={item.href} href={item.href} target={item.external ? '_blank' : undefined}
                    onClick={() => setUserMenuOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.625rem',
                      padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.8rem',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <item.icon size={14} /> {item.label}
                  </Link>
                ))}
                <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.25rem', paddingTop: '0.25rem' }}>
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.625rem',
                      padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)',
                      color: 'var(--danger)', background: 'none', border: 'none',
                      cursor: 'pointer', fontSize: '0.8rem', width: '100%', textAlign: 'left',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflow: 'auto', padding: '1.75rem 2rem' }}>
          {children}
        </main>
      </div>

      <style>{`
        .nav-link {
          display: flex; align-items: center; gap: 0.625rem;
          padding: 0.5rem 0.625rem; border-radius: var(--radius-sm);
          color: var(--text-secondary); text-decoration: none;
          font-size: 0.825rem; font-weight: 500; width: 100%;
          transition: var(--transition);
        }
        .nav-link:hover { background: var(--bg-elevated); color: var(--text-primary); }
        .nav-link.active { background: rgba(99,102,241,0.15); color: var(--accent); }
        .nav-sub { margin-left: 0.5rem; border-left: 1px solid var(--border); }
      `}</style>
    </div>
  )
}
