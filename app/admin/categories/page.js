'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { slugify } from '@/lib/utils'
import { FolderOpen, Trash2, Edit3, Plus, X } from 'lucide-react'

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [parentId, setParentId] = useState('')
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadCategories() }, [])

  async function loadCategories() {
    setLoading(true)
    const res = await fetch('/api/categories')
    const json = await res.json()
    setCategories(json.data || [])
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
      await fetch(`/api/categories/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, description, parent_id: parentId ? parseInt(parentId) : null }),
      })
    } else {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, parent_id: parentId ? parseInt(parentId) : null }),
      })
    }

    resetForm()
    setSaving(false)
    loadCategories()
  }

  function startEdit(cat) {
    setEditId(cat.id)
    setName(cat.name)
    setSlug(cat.slug)
    setDescription(cat.description || '')
    setParentId(cat.parent_id ? String(cat.parent_id) : '')
  }

  function resetForm() {
    setEditId(null)
    setName('')
    setSlug('')
    setDescription('')
    setParentId('')
  }

  async function handleDelete(id) {
    if (!confirm('Delete this category? Posts will be unlinked.')) return
    await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    loadCategories()
  }

  function getParentName(pid) {
    const p = categories.find(c => c.id === pid)
    return p ? p.name : '—'
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <FolderOpen size={22} style={{ color: 'var(--accent)' }} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Categories</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Add / Edit Form */}
        <div className="glass" style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {editId ? 'Edit Category' : 'Add New Category'}
            {editId && (
              <button onClick={resetForm} className="btn btn-ghost btn-sm" title="Cancel edit">
                <X size={14} />
              </button>
            )}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label required">Name</label>
              <input className="form-input" value={name} onChange={e => handleNameChange(e.target.value)} placeholder="Category name" required />
            </div>
            <div className="form-group">
              <label className="form-label">Slug</label>
              <input className="form-input" value={slug} onChange={e => setSlug(e.target.value)} placeholder="category-slug" />
              <span className="form-hint">URL-friendly name. Auto-generated from name.</span>
            </div>
            <div className="form-group">
              <label className="form-label">Parent Category</label>
              <select className="form-select" value={parentId} onChange={e => setParentId(e.target.value)}>
                <option value="">None (top level)</option>
                {categories.filter(c => c.id !== editId).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Optional description" rows={3} style={{ resize: 'vertical' }} />
            </div>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              <Plus size={14} />
              {saving ? 'Saving…' : editId ? 'Update Category' : 'Add Category'}
            </button>
          </form>
        </div>

        {/* Category List */}
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Parent</th>
                <th>Count</th>
                <th style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading…</td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No categories yet.</td></tr>
              ) : categories.map(cat => (
                <tr key={cat.id}>
                  <td className="primary">{cat.name}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cat.slug}</td>
                  <td style={{ fontSize: '0.8rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cat.description || '—'}
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>{cat.parent_id ? getParentName(cat.parent_id) : '—'}</td>
                  <td>{cat.post_count ?? 0}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button onClick={() => startEdit(cat)} className="btn btn-ghost btn-sm" title="Edit">
                        <Edit3 size={13} />
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="btn btn-ghost btn-sm" title="Delete"
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
