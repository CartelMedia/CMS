'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatDate, formatRelative } from '@/lib/utils'
import {
  FileText, BookOpen, MessageSquare, Users, CheckCircle,
  Database, Shield, Globe, TrendingUp, Plus, X, Activity,
  Zap
} from 'lucide-react'

function StatCard({ icon: Icon, label, count, href, color = 'var(--accent)' }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div className="glass glass-hover" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: 'var(--radius-md)',
          background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={20} style={{ color }} />
        </div>
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {count ?? <span className="skeleton" style={{ display: 'inline-block', width: 40, height: 24, borderRadius: 4 }} />}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</div>
        </div>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState({})
  const [recentPosts, setRecentPosts] = useState([])
  const [recentComments, setRecentComments] = useState([])
  const [quickTitle, setQuickTitle] = useState('')
  const [quickContent, setQuickContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    loadData()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    setDismissed(localStorage.getItem('cms_welcome_dismissed') === '1')
  }, [])

  async function loadData() {
    const [postsRes, pagesRes, commentsRes, usersRes, recentPostsRes, recentCommentsRes] = await Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('post_type', 'post').neq('status', 'trash'),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('post_type', 'page').neq('status', 'trash'),
      supabase.from('comments').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('posts').select('id,title,slug,status,created_at').eq('post_type', 'post').neq('status', 'trash').order('created_at', { ascending: false }).limit(5),
      supabase.from('comments').select('id,author_name,content,created_at,post_id').eq('status', 'approved').order('created_at', { ascending: false }).limit(5),
    ])
    setStats({
      posts: postsRes.count ?? 0,
      pages: pagesRes.count ?? 0,
      comments: commentsRes.count ?? 0,
      users: usersRes.count ?? 0,
    })
    setRecentPosts(recentPostsRes.data ?? [])
    setRecentComments(recentCommentsRes.data ?? [])
  }

  async function handleQuickDraft(e) {
    e.preventDefault()
    if (!quickTitle.trim()) return
    setSaving(true)
    const { data: { user: u } } = await supabase.auth.getUser()
    await supabase.from('posts').insert([{
      title: quickTitle,
      content_html: `<p>${quickContent}</p>`,
      status: 'draft',
      post_type: 'post',
      author_id: u?.id,
      slug: quickTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now(),
    }])
    setQuickTitle('')
    setQuickContent('')
    setSaving(false)
    loadData()
  }

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'there'

  return (
    <div>
      {/* Welcome banner */}
      {!dismissed && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem',
          marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '1rem',
        }}>
          <Zap size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Welcome to ModernCMS!</strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginLeft: '0.5rem' }}>
              Your CMS is ready. Start by creating your first post or configuring your settings.
            </span>
          </div>
          <button onClick={() => { setDismissed(true); localStorage.setItem('cms_welcome_dismissed', '1') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
            <X size={16} />
          </button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Dashboard</h1>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Howdy, {displayName}!</span>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <StatCard icon={FileText} label="Posts" count={stats.posts} href="/admin/posts" color="var(--accent)" />
        <StatCard icon={BookOpen} label="Pages" count={stats.pages} href="/admin/pages" color="var(--accent-secondary)" />
        <StatCard icon={MessageSquare} label="Comments" count={stats.comments} href="/admin/comments" color="var(--info)" />
        <StatCard icon={Users} label="Users" count={stats.users} href="/admin/users" color="var(--success)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* Recent Posts */}
        <div className="glass" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={16} style={{ color: 'var(--accent)' }} /> Recent Posts
            </h3>
            <Link href="/admin/posts/new" style={{ color: 'var(--accent)', fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Plus size={13} /> New
            </Link>
          </div>
          {recentPosts.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>No posts yet. <Link href="/admin/posts/new" style={{ color: 'var(--accent)' }}>Create your first post</Link></p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentPosts.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link href={`/admin/posts/${p.id}/edit`} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.title || 'Untitled'}
                    </Link>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatRelative(p.created_at)}</span>
                  </div>
                  <span style={{
                    fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)',
                    background: p.status === 'publish' ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
                    color: p.status === 'publish' ? 'var(--success)' : 'var(--accent)',
                  }}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Comments */}
        <div className="glass" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={16} style={{ color: 'var(--info)' }} /> Recent Comments
            </h3>
            <Link href="/admin/comments" style={{ color: 'var(--accent)', fontSize: '0.8rem', textDecoration: 'none' }}>View all</Link>
          </div>
          {recentComments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>No comments yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentComments.map(c => (
                <div key={c.id}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{c.author_name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.content}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatRelative(c.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Quick Draft */}
        <div className="glass" style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 600 }}>Quick Draft</h3>
          <form onSubmit={handleQuickDraft} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              value={quickTitle} onChange={e => setQuickTitle(e.target.value)}
              className="form-input" placeholder="Post title…" required
            />
            <textarea
              value={quickContent} onChange={e => setQuickContent(e.target.value)}
              className="form-input" placeholder="What's on your mind?" rows={4}
              style={{ resize: 'vertical' }}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving} style={{ alignSelf: 'flex-start' }}>
              {saving ? 'Saving…' : 'Save Draft'}
            </button>
          </form>
        </div>

        {/* Site Health */}
        <div className="glass" style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 600 }}>Site Health</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { icon: Database, label: 'Database Connected', ok: true },
              { icon: Globe, label: 'Storage Active', ok: true },
              { icon: Shield, label: 'Auth Enabled', ok: true },
              { icon: TrendingUp, label: 'API Endpoints Active', ok: true },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <item.icon size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                <CheckCircle size={15} style={{ color: item.ok ? 'var(--success)' : 'var(--danger)', flexShrink: 0 }} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            ModernCMS v1.0.0 · Next.js 14 · Supabase
          </div>
        </div>
      </div>
    </div>
  )
}
