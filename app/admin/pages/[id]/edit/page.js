'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { slugify, formatDate } from '@/lib/utils'
import Editor from '@/components/Editor'
import MediaPicker from '@/components/MediaPicker'
import {
  Save, Send, ArrowLeft, ChevronDown, ChevronUp, Image as ImageIcon,
  X, Trash2, Clock, Layers,
} from 'lucide-react'

export default function EditPagePage({ params }) {
  const { id } = use(params)
  const router = useRouter()
  const [pageData, setPageData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [slug, setSlugVal] = useState('')
  const [contentJson, setContentJson] = useState(null)
  const [contentHtml, setContentHtml] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [status, setStatus] = useState('draft')
  const [visibility, setVisibility] = useState('public')
  const [password, setPassword] = useState('')
  const [featuredImage, setFeaturedImage] = useState('')
  const [template, setTemplate] = useState('default')
  const [parentId, setParentId] = useState('')
  const [pageOrder, setPageOrder] = useState(0)
  const [allPages, setAllPages] = useState([])

  const [saving, setSaving] = useState(false)
  const [showMedia, setShowMedia] = useState(false)
  const [expanded, setExpanded] = useState({ status: true, attributes: true, featured: true, excerpt: false })

  useEffect(() => { loadPage(); loadPages() }, [id])

  async function loadPage() {
    setLoading(true)
    const res = await fetch(`/api/posts/${id}`)
    const json = await res.json()
    const p = json.data
    if (!p) { router.push('/admin/pages'); return }

    setPageData(p)
    setTitle(p.title || '')
    setSlugVal(p.slug || '')
    setContentJson(p.content_json)
    setContentHtml(p.content_html || '')
    setExcerpt(p.excerpt || '')
    setStatus(p.status || 'draft')
    setVisibility(p.visibility || 'public')
    setPassword(p.password || '')
    setFeaturedImage(p.featured_image || '')
    setTemplate(p.template || 'default')
    setParentId(p.parent_id ? String(p.parent_id) : '')
    setPageOrder(p.page_order || 0)
    setLoading(false)
  }

  async function loadPages() {
    const res = await fetch('/api/posts?post_type=page&per_page=100')
    const json = await res.json()
    setAllPages((json.data || []).filter(p => String(p.id) !== String(id)))
  }

  function handleEditorChange({ json, html }) { setContentJson(json); setContentHtml(html) }
  function toggleSection(key) { setExpanded(p => ({ ...p, [key]: !p[key] })) }

  async function handleUpdate() {
    if (!title.trim()) return
    setSaving(true)
    await fetch(`/api/posts/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, slug: slug || slugify(title),
        content_json: contentJson, content_html: contentHtml, excerpt,
        status, visibility,
        password: visibility === 'password' ? password : null,
        featured_image: featuredImage || null,
        template, parent_id: parentId ? parseInt(parentId) : null,
        page_order: pageOrder,
      }),
    })
    setSaving(false)
  }

  async function handlePublish() {
    setStatus('published')
    setSaving(true)
    await fetch(`/api/posts/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, slug: slug || slugify(title),
        content_json: contentJson, content_html: contentHtml, excerpt,
        status: 'published', visibility,
        password: visibility === 'password' ? password : null,
        featured_image: featuredImage || null,
        template, parent_id: parentId ? parseInt(parentId) : null,
        page_order: pageOrder,
      }),
    })
    setSaving(false)
  }

  async function handleTrash() {
    if (!confirm('Move this page to trash?')) return
    await fetch(`/api/posts/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'trash' }),
    })
    router.push('/admin/pages')
  }

  const SidebarSection = ({ title: sTitle, icon: Icon, sectionKey, children }) => (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button onClick={() => toggleSection(sectionKey)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.8rem',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {Icon && <Icon size={14} style={{ color: 'var(--text-muted)' }} />}
          {sTitle}
        </span>
        {expanded[sectionKey] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {expanded[sectionKey] && <div style={{ padding: '0 1rem 1rem' }}>{children}</div>}
    </div>
  )

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading page…</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => router.push('/admin/pages')} className="btn btn-ghost btn-sm btn-icon"><ArrowLeft size={16} /></button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Edit Page</h1>
          <span className={`badge ${status === 'published' ? 'badge-success' : 'badge-secondary'}`}>{status}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleTrash} className="btn btn-danger btn-sm"><Trash2 size={14} /> Trash</button>
          <button onClick={handleUpdate} className="btn btn-secondary btn-sm" disabled={saving}>
            <Save size={14} /> {saving ? 'Saving…' : 'Update'}
          </button>
          {status !== 'published' && (
            <button onClick={handlePublish} className="btn btn-primary btn-sm" disabled={saving}><Send size={14} /> Publish</button>
          )}
        </div>
      </div>

      {pageData?.updated_at && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <Clock size={12} /> Last modified: {formatDate(pageData.updated_at, 'MMM d, yyyy h:mm a')}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem', alignItems: 'start' }}>
        <div>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Page title"
            style={{
              width: '100%', padding: '0.875rem 1rem', fontSize: '1.5rem', fontWeight: 700,
              background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none', marginBottom: '1rem',
            }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Permalink:</span>
            <input value={slug} onChange={e => setSlugVal(e.target.value)}
              style={{ flex: 1, padding: '0.375rem 0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontSize: '0.8rem', outline: 'none' }} />
          </div>
          <Editor content={contentJson} onChange={handleEditorChange} placeholder="Start writing…" />
        </div>

        <div className="glass" style={{ overflow: 'hidden', position: 'sticky', top: '80px' }}>
          <SidebarSection title="Publish" icon={Send} sectionKey="status">
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label className="form-label">Status</label>
              <select className="form-select" value={status} onChange={e => setStatus(e.target.value)} style={{ fontSize: '0.8rem' }}>
                <option value="draft">Draft</option>
                <option value="pending">Pending Review</option>
                <option value="published">Published</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Visibility</label>
              <select className="form-select" value={visibility} onChange={e => setVisibility(e.target.value)} style={{ fontSize: '0.8rem' }}>
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="password">Password Protected</option>
              </select>
            </div>
            {visibility === 'password' && (
              <div className="form-group" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                <input className="form-input" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password" type="password" style={{ fontSize: '0.8rem' }} />
              </div>
            )}
          </SidebarSection>

          <SidebarSection title="Page Attributes" icon={Layers} sectionKey="attributes">
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label className="form-label">Parent Page</label>
              <select className="form-select" value={parentId} onChange={e => setParentId(e.target.value)} style={{ fontSize: '0.8rem' }}>
                <option value="">(no parent)</option>
                {allPages.map(p => <option key={p.id} value={p.id}>{p.title || 'Untitled'}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label className="form-label">Template</label>
              <select className="form-select" value={template} onChange={e => setTemplate(e.target.value)} style={{ fontSize: '0.8rem' }}>
                <option value="default">Default Template</option>
                <option value="full-width">Full Width</option>
                <option value="sidebar-left">Sidebar Left</option>
                <option value="sidebar-right">Sidebar Right</option>
                <option value="landing">Landing Page</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Order</label>
              <input type="number" className="form-input" value={pageOrder} onChange={e => setPageOrder(parseInt(e.target.value) || 0)}
                style={{ fontSize: '0.8rem', width: '80px' }} />
            </div>
          </SidebarSection>

          <SidebarSection title="Featured Image" icon={ImageIcon} sectionKey="featured">
            {featuredImage ? (
              <div style={{ position: 'relative' }}>
                <img src={featuredImage} alt="Featured" style={{ width: '100%', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem', border: '1px solid var(--border)' }} />
                <button onClick={() => setFeaturedImage('')} className="btn btn-danger btn-sm" style={{ position: 'absolute', top: 6, right: 6, padding: '4px' }}><X size={12} /></button>
              </div>
            ) : (
              <button onClick={() => setShowMedia(true)} className="btn btn-secondary btn-sm" style={{ width: '100%' }}><ImageIcon size={14} /> Set Featured Image</button>
            )}
          </SidebarSection>

          <SidebarSection title="Excerpt" icon={null} sectionKey="excerpt">
            <textarea className="form-input" value={excerpt} onChange={e => setExcerpt(e.target.value)}
              placeholder="Write a short summary…" rows={3} style={{ resize: 'vertical', fontSize: '0.8rem' }} />
          </SidebarSection>
        </div>
      </div>

      {showMedia && <MediaPicker onSelect={url => { setFeaturedImage(url); setShowMedia(false) }} onClose={() => setShowMedia(false)} />}
    </div>
  )
}
