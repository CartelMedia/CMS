'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { slugify } from '@/lib/utils'
import Editor from '@/components/Editor'
import MediaPicker from '@/components/MediaPicker'
import {
  Save, Send, Eye, ChevronDown, ChevronUp, Image as ImageIcon,
  X, Calendar, Lock, Globe, Tag, FolderOpen,
} from 'lucide-react'

export default function NewPostPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlugVal] = useState('')
  const [contentJson, setContentJson] = useState(null)
  const [contentHtml, setContentHtml] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [status, setStatus] = useState('draft')
  const [visibility, setVisibility] = useState('public')
  const [password, setPassword] = useState('')
  const [featuredImage, setFeaturedImage] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')

  // Taxonomies
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [selectedCats, setSelectedCats] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [newTagName, setNewTagName] = useState('')

  // UI state
  const [saving, setSaving] = useState(false)
  const [showMedia, setShowMedia] = useState(false)
  const [expanded, setExpanded] = useState({ status: true, categories: true, tags: true, featured: true, excerpt: false })
  const autosaveRef = useRef(null)
  const postIdRef = useRef(null)

  useEffect(() => {
    loadTaxonomies()
  }, [])

  // Autosave every 60s
  useEffect(() => {
    autosaveRef.current = setInterval(() => {
      if (title.trim() && postIdRef.current) {
        handleSave('draft', true)
      }
    }, 60000)
    return () => clearInterval(autosaveRef.current)
  }, [title, contentJson, contentHtml, excerpt])

  async function loadTaxonomies() {
    const [catRes, tagRes] = await Promise.all([
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/tags').then(r => r.json()),
    ])
    setCategories(catRes.data || [])
    setTags(tagRes.data || [])
  }

  function handleTitleChange(val) {
    setTitle(val)
    if (!postIdRef.current) setSlugVal(slugify(val))
  }

  function handleEditorChange({ json, html }) {
    setContentJson(json)
    setContentHtml(html)
  }

  function toggleSection(key) {
    setExpanded(p => ({ ...p, [key]: !p[key] }))
  }

  function toggleCat(id) {
    setSelectedCats(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function toggleTag(id) {
    setSelectedTags(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function addNewTag() {
    if (!newTagName.trim()) return
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTagName }),
    })
    const json = await res.json()
    if (json.data) {
      setTags(prev => [...prev, json.data])
      setSelectedTags(prev => [...prev, json.data.id])
      setNewTagName('')
    }
  }

  async function handleSave(saveStatus, silent = false) {
    if (!title.trim()) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()

    const postData = {
      title,
      slug: slug || slugify(title),
      content_json: contentJson,
      content_html: contentHtml,
      excerpt,
      status: saveStatus,
      post_type: 'post',
      author_id: user?.id,
      featured_image: featuredImage || null,
      visibility,
      password: visibility === 'password' ? password : null,
      scheduled_at: scheduledAt || null,
    }

    let savedPost
    if (postIdRef.current) {
      const res = await fetch(`/api/posts/${postIdRef.current}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...postData, categories: selectedCats, tags: selectedTags }),
      })
      savedPost = (await res.json()).data
    } else {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      })
      savedPost = (await res.json()).data
      if (savedPost?.id) {
        postIdRef.current = savedPost.id
        // Sync taxonomies
        if (selectedCats.length > 0 || selectedTags.length > 0) {
          await fetch(`/api/posts/${savedPost.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categories: selectedCats, tags: selectedTags }),
          })
        }
      }
    }

    setSaving(false)
    if (!silent && savedPost) {
      router.push(`/admin/posts/${savedPost.id}/edit`)
    }
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

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Add New Post</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => handleSave('draft')} className="btn btn-secondary btn-sm" disabled={saving || !title.trim()}>
            <Save size={14} /> {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button onClick={() => handleSave('publish')} className="btn btn-primary btn-sm" disabled={saving || !title.trim()}>
            <Send size={14} /> Publish
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem', alignItems: 'start' }}>
        {/* Editor Column */}
        <div>
          {/* Title */}
          <input
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="Post title"
            style={{
              width: '100%', padding: '0.875rem 1rem', fontSize: '1.5rem', fontWeight: 700,
              background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none',
              marginBottom: '1rem',
            }}
          />

          {/* Slug */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Permalink:</span>
            <input
              value={slug}
              onChange={e => setSlugVal(e.target.value)}
              style={{
                flex: 1, padding: '0.375rem 0.5rem', background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                color: 'var(--accent)', fontSize: '0.8rem', outline: 'none',
              }}
            />
          </div>

          {/* Editor */}
          <Editor content={contentJson} onChange={handleEditorChange} placeholder="Start writing your post…" />
        </div>

        {/* Sidebar */}
        <div className="glass" style={{ overflow: 'hidden', position: 'sticky', top: '80px' }}>
          {/* Status */}
          <SidebarSection title="Publish" icon={Send} sectionKey="status">
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label className="form-label">Status</label>
              <select className="form-select" value={status} onChange={e => setStatus(e.target.value)} style={{ fontSize: '0.8rem' }}>
                <option value="draft">Draft</option>
                <option value="pending">Pending Review</option>
                <option value="publish">Published</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label className="form-label">Visibility</label>
              <select className="form-select" value={visibility} onChange={e => setVisibility(e.target.value)} style={{ fontSize: '0.8rem' }}>
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="password">Password Protected</option>
              </select>
            </div>
            {visibility === 'password' && (
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <input className="form-input" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password" type="password" style={{ fontSize: '0.8rem' }} />
              </div>
            )}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                Schedule
              </label>
              <input type="datetime-local" className="form-input" value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)} style={{ fontSize: '0.8rem' }} />
            </div>
          </SidebarSection>

          {/* Categories */}
          <SidebarSection title="Categories" icon={FolderOpen} sectionKey="categories">
            <div style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '0.5rem' }}>
              {categories.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>No categories yet.</p>
              ) : categories.map(cat => (
                <label key={cat.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.25rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer',
                }}>
                  <input type="checkbox" checked={selectedCats.includes(cat.id)} onChange={() => toggleCat(cat.id)} style={{ accentColor: 'var(--accent)' }} />
                  {cat.name}
                </label>
              ))}
            </div>
          </SidebarSection>

          {/* Tags */}
          <SidebarSection title="Tags" icon={Tag} sectionKey="tags">
            {selectedTags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.5rem' }}>
                {selectedTags.map(tid => {
                  const t = tags.find(x => x.id === tid)
                  return t ? (
                    <span key={tid} className="badge badge-accent" style={{ gap: '4px' }}>
                      {t.name}
                      <X size={10} style={{ cursor: 'pointer' }} onClick={() => toggleTag(tid)} />
                    </span>
                  ) : null
                })}
              </div>
            )}
            <div style={{ maxHeight: '120px', overflowY: 'auto', marginBottom: '0.5rem' }}>
              {tags.filter(t => !selectedTags.includes(t.id)).map(tag => (
                <button key={tag.id} onClick={() => toggleTag(tag.id)} style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '0.25rem 0',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '0.8rem', color: 'var(--text-secondary)',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  + {tag.name}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              <input className="form-input" value={newTagName} onChange={e => setNewTagName(e.target.value)}
                placeholder="New tag" style={{ fontSize: '0.75rem', padding: '4px 8px', flex: 1 }}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addNewTag())} />
              <button onClick={addNewTag} className="btn btn-secondary btn-sm" style={{ fontSize: '0.7rem', padding: '4px 8px' }}>Add</button>
            </div>
          </SidebarSection>

          {/* Featured Image */}
          <SidebarSection title="Featured Image" icon={ImageIcon} sectionKey="featured">
            {featuredImage ? (
              <div style={{ position: 'relative' }}>
                <img src={featuredImage} alt="Featured" style={{
                  width: '100%', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem',
                  border: '1px solid var(--border)',
                }} />
                <button onClick={() => setFeaturedImage('')} className="btn btn-danger btn-sm"
                  style={{ position: 'absolute', top: 6, right: 6, padding: '4px' }}>
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button onClick={() => setShowMedia(true)} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                <ImageIcon size={14} /> Set Featured Image
              </button>
            )}
          </SidebarSection>

          {/* Excerpt */}
          <SidebarSection title="Excerpt" icon={null} sectionKey="excerpt">
            <textarea className="form-input" value={excerpt} onChange={e => setExcerpt(e.target.value)}
              placeholder="Write a short summary…" rows={3} style={{ resize: 'vertical', fontSize: '0.8rem' }} />
          </SidebarSection>
        </div>
      </div>

      {/* Media Picker Modal */}
      {showMedia && (
        <MediaPicker
          onSelect={(url) => { setFeaturedImage(url); setShowMedia(false) }}
          onClose={() => setShowMedia(false)}
        />
      )}
    </div>
  )
}
