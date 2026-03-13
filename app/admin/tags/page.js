'use client'
import { useState, useEffect } from 'react'
import { slugify } from '@/lib/utils'
import { Tag, Trash2, Edit3, Plus, X } from 'lucide-react'

export default function TagsPage() {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadTags() }, [])

  async function loadTags() {
    setLoading(true)
    const res = await fetch('/api/tags')
    const json = await res.json()
    setTags(json.data || [])
    setLoading(false)
  }

  function handleNameChange(val) {
    setName(val)
    if (!editId) setSlug(slugify(val))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)

    if (editId) {
      await fetch(`/api/tags/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, description }),
      })
    } else {
      await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
    }

    resetForm()
    setSaving(false)
    loadTags()
  }

  function startEdit(tag) {
    setEditId(tag.id)
    setName(tag.name)
    setSlug(tag.slug)
    setDescription(tag.description || '')
  }

  function resetForm() {
    setEditId(null)
    setName('')
    setSlug('')
    setDescription('')
  }

  async function handleDelete(id) {
    if (!confirm('Delete this tag? It will be removed from all posts.')) return
    await fetch(`/api/tags/${id}`, { method: 'DELETE' })
    loadTags()
  }

  const maxCount = Math.max(...tags.map(t => t.post_count ?? 0), 1)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Tag size={22} style={{ color: 'var(--accent)' }} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Tags</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Add / Edit Form */}
        <div>
          <div className="glass" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {editId ? 'Edit Tag' : 'Add New Tag'}
              {editId && (
                <button onClick={resetForm} className="btn btn-ghost btn-sm" title="Cancel edit">
                  <X size={14} />
                </button>
              )}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label required">Name</label>
                <input className="form-input" value={name} onChange={e => handleNameChange(e.target.value)} placeholder="Tag name" required />
              </div>
              <div className="form-group">
                <label className="form-label">Slug</label>
                <input className="form-input" value={slug} onChange={e => setSlug(e.target.value)} placeholder="tag-slug" />
                <span className="form-hint">URL-friendly name.</span>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Optional description" rows={3} style={{ resize: 'vertical' }} />
              </div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                <Plus size={14} />
                {saving ? 'Saving…' : editId ? 'Update Tag' : 'Add Tag'}
              </button>
            </form>
          </div>

          {/* Tag Cloud Preview */}
          {tags.length > 0 && (
            <div className="glass" style={{ padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 600 }}>Tag Cloud</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {tags.map(tag => {
                  const scale = 0.75 + ((tag.post_count ?? 0) / maxCount) * 0.5
                  return (
                    <span key={tag.id} className="badge badge-accent" style={{ fontSize: `${scale}rem`, cursor: 'default' }}>
                      {tag.name}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Tag List */}
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Count</th>
                <th style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading…</td></tr>
              ) : tags.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No tags yet.</td></tr>
              ) : tags.map(tag => (
                <tr key={tag.id}>
                  <td className="primary">{tag.name}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tag.slug}</td>
                  <td style={{ fontSize: '0.8rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tag.description || '—'}
                  </td>
                  <td>{tag.post_count ?? 0}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button onClick={() => startEdit(tag)} className="btn btn-ghost btn-sm" title="Edit">
                        <Edit3 size={13} />
                      </button>
                      <button onClick={() => handleDelete(tag.id)} className="btn btn-ghost btn-sm" title="Delete"
                        style={{ color: 'var(--danger)' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
