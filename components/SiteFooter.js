'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Shield, Rss, Github, Twitter } from 'lucide-react'

export default function SiteFooter() {
  const [siteName, setSiteName] = useState('ModernCMS')
  const [tagline, setTagline] = useState('')
  const [footerMenuItems, setFooterMenuItems] = useState([])
  const [recentPosts, setRecentPosts] = useState([])
  const [categories, setCategories] = useState([])

  useEffect(() => {
    async function load() {
      const [settingsRes, menuRes, postsRes, catsRes] = await Promise.all([
        supabase.from('options').select('option_key, option_value').in('option_key', ['site_title', 'tagline']),
        supabase.from('menus').select('*, items:menu_items(*)').eq('location', 'footer').maybeSingle(),
        supabase.from('posts').select('id, title, slug, published_at').eq('status', 'published').eq('type', 'post').order('published_at', { ascending: false }).limit(5),
        supabase.from('categories').select('id, name, slug').limit(8),
      ])

      settingsRes.data?.forEach(row => {
        if (row.option_key === 'site_title') setSiteName(row.option_value)
        if (row.option_key === 'tagline') setTagline(row.option_value)
      })
      if (menuRes.data?.items) setFooterMenuItems(menuRes.data.items.sort((a, b) => a.position - b.position))
      if (postsRes.data) setRecentPosts(postsRes.data)
      if (catsRes.data) setCategories(catsRes.data)
    }
    load()
  }, [])

  const year = new Date().getFullYear()

  const linkStyle = {
    color: '#64748b', textDecoration: 'none', fontSize: '13px',
    lineHeight: 1.8, display: 'block', transition: 'color 0.15s',
  }

  return (
    <footer style={{
      background: 'rgba(5,5,12,0.98)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      marginTop: '60px',
    }}>
      {/* Main Footer */}
      <div style={{
        maxWidth: '1200px', margin: '0 auto',
        padding: '48px 24px 32px',
        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '40px',
      }}>
        {/* Brand */}
        <div>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '14px' }}>
            <div style={{
              width: '32px', height: '32px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={16} color="white" />
            </div>
            <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '16px' }}>{siteName}</span>
          </Link>
          <p style={{ color: '#475569', fontSize: '13px', lineHeight: 1.7, margin: '0 0 20px', maxWidth: '280px' }}>
            {tagline || 'A modern, feature-complete content management system built with Next.js and Supabase.'}
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { icon: Rss, href: '/feed', label: 'RSS Feed' },
              { icon: Github, href: '#', label: 'GitHub' },
              { icon: Twitter, href: '#', label: 'Twitter' },
            ].map(({ icon: Icon, href, label }) => (
              <a key={label} href={href} title={label} style={{
                width: '34px', height: '34px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#64748b', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.color = '#a5b4fc'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
              >
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div>
          <h4 style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
            Navigation
          </h4>
          {(footerMenuItems.length > 0 ? footerMenuItems : [
            { id: 1, label: 'Home', url: '/' },
            { id: 2, label: 'Blog', url: '/blog' },
            { id: 3, label: 'About', url: '/about' },
            { id: 4, label: 'Contact', url: '/contact' },
            { id: 5, label: 'Privacy Policy', url: '/privacy-policy' },
          ]).map(item => (
            <a key={item.id} href={item.url} style={linkStyle}
              onMouseEnter={e => e.currentTarget.style.color = '#a5b4fc'}
              onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Recent Posts */}
        <div>
          <h4 style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
            Recent Posts
          </h4>
          {recentPosts.length === 0 ? (
            <p style={{ color: '#334155', fontSize: '13px' }}>No posts yet.</p>
          ) : recentPosts.map(post => (
            <Link key={post.id} href={`/${post.slug}`} style={{ ...linkStyle, marginBottom: '6px' }}
              onMouseEnter={e => e.currentTarget.style.color = '#a5b4fc'}
              onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
            >
              {post.title}
            </Link>
          ))}
        </div>

        {/* Categories */}
        <div>
          <h4 style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
            Categories
          </h4>
          {categories.length === 0 ? (
            <p style={{ color: '#334155', fontSize: '13px' }}>No categories yet.</p>
          ) : categories.map(cat => (
            <Link key={cat.id} href={`/category/${cat.slug}`} style={linkStyle}
              onMouseEnter={e => e.currentTarget.style.color = '#a5b4fc'}
              onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '16px 24px',
        maxWidth: '1200px', margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '8px',
      }}>
        <p style={{ color: '#334155', fontSize: '12px', margin: 0 }}>
          © {year} <span style={{ color: '#475569' }}>{siteName}</span>. Built with Next.js & Supabase.
        </p>
        <div style={{ display: 'flex', gap: '16px' }}>
          {['Privacy Policy', 'Terms of Service', 'Sitemap'].map(label => (
            <Link key={label} href={`/${label.toLowerCase().replace(/ /g, '-')}`} style={{
              color: '#334155', textDecoration: 'none', fontSize: '12px', transition: 'color 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = '#64748b'}
              onMouseLeave={e => e.currentTarget.style.color = '#334155'}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          footer > div:first-child { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          footer > div:first-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  )
}
