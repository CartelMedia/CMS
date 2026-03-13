'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import {
  BookOpen, Plus, Search, ChevronLeft, ChevronRight, MoreHorizontal,
} from 'lucide-react'

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'publish', label: 'Published' },
  { key: 'draft', label: 'Draft' },
  { key: 'trash', label: 'Trash' },
]

export default function PagesListPage() {
  const [pages, setPages] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState([])
  const [bulkAction, setBulkAction] = useState('')
  const perPage = 20

  useEffect(() => { loadPages() }, [activeTab, page])

  async function loadPages() {
    setLoading(true)
    const params = new URLSearchParams({ post_type: 'page', page: String(page), per_page: String(perPage) })
    if (activeTab !== 'all') params.set('status', activeTab)
    if (search) params.set('search', search)

    const res = await fetch(`/api/posts?${params}`)
    const json = await res.json()
    setPages(json.data || [])
    setTotal(json.total || 0)
    setSelected([])
    setLoading(false)
  }

  function handleSearch(e) { e.preventDefault(); setPage(1); loadPages() }
  function toggleSelect(id) { setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]) }
  function toggleAll() { selected.length === pages.length ? setSelected([]) : setSelected(pages.map(p => p.id)) }

  async function handleBulkAction() {
    if (!bulkAction || selected.length === 0) return
    if (!confirm(`Apply "${bulkAction}" to ${selected.length} page(s)?`)) return
    for (const id of selected) {
      if (bulkAction === 'delete') {
        await fetch(`/api/posts/${id}`, { method: 'DELETE' })
      } else {
        await fetch(`/api/posts/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: bulkAction }) })
      }
    }
    setBulkAction('')
    loadPages()
  }

  async function trashPage(id) {
    await fetch(`/api/posts/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'trash' }) })
    loadPages()
  }
  async function restorePage(id) {
    await fetch(`/api/posts/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'draft' }) })
    loadPages()
  }
  async function deletePage(id) {
    if (!confirm('Permanently delete this page?')) return
    await fetch(`/api/posts/${id}`, { method: 'DELETE' })
    loadPages()
  }

  const totalPages = Math.ceil(total / perPage)
  const statusColor = s => {
    switch (s) {
      case 'publish': return 'badge-success'
      case 'draft': return 'badge-secondary'
      case 'pending': return 'badge-warning'
      case 'trash': return 'badge-danger'
      default: return 'badge-secondary'
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <BookOpen size={22} style={{ color: 'var(--accent-secondary)' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Pages</h1>
          <span className="badge badge-secondary">{total}</span>
        </div>
        <Link href="/admin/pages/new" className="btn btn-primary btn-sm">
          <Plus size={14} /> Add New Page
        </Link>
      </div>

      {/* Status Tabs */}
      <div style={{ display: 'flex', gap: '0.125rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
        {STATUS_TABS.map(tab => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setPage(1) }}
            style={{
              padding: '0.5rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.825rem', fontWeight: 500, color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: '-1px',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <select className="form-select" value={bulkAction} onChange={e => setBulkAction(e.target.value)}
            style={{ width: '160px', height: '34px', fontSize: '0.8rem' }}>
            <option value="">Bulk Actions</option>
            {activeTab === 'trash' ? (
              <><option value="draft">Restore</option><option value="delete">Delete Permanently</option></>
            ) : (
              <><option value="publish">Publish</option><option value="draft">Set Draft</option><option value="trash">Move to Trash</option></>
            )}
          </select>
          <button onClick={handleBulkAction} className="btn btn-secondary btn-sm" disabled={!bulkAction || selected.length === 0}>Apply</button>
        </div>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-input" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search pages…" style={{ paddingLeft: '2rem', height: '34px', width: '220px', fontSize: '0.8rem' }} />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm">Search</button>
        </form>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th className="checkbox-col"><input type="checkbox" checked={pages.length > 0 && selected.length === pages.length} onChange={toggleAll} /></th>
              <th>Title</th>
              <th>Author</th>
              <th>Status</th>
              <th>Date</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading…</td></tr>
            ) : pages.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                {search ? 'No pages match your search.' : 'No pages found.'}
              </td></tr>
            ) : pages.map(pg => (
              <tr key={pg.id} className={selected.includes(pg.id) ? 'selected' : ''}>
                <td className="checkbox-col"><input type="checkbox" checked={selected.includes(pg.id)} onChange={() => toggleSelect(pg.id)} /></td>
                <td>
                  <div>
                    <Link href={`/admin/pages/${pg.id}/edit`}
                      style={{ color: 'var(--text-primary)', fontWeight: 500, textDecoration: 'none', fontSize: '0.875rem' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}>
                      {pg.title || <em style={{ color: 'var(--text-muted)' }}>Untitled</em>}
                    </Link>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                      <Link href={`/admin/pages/${pg.id}/edit`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>Edit</Link>
                      {activeTab === 'trash' ? (
                        <>
                          <button onClick={() => restorePage(pg.id)} style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}>Restore</button>
                          <button onClick={() => deletePage(pg.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}>Delete Permanently</button>
                        </>
                      ) : (
                        <button onClick={() => trashPage(pg.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}>Trash</button>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: '0.8rem' }}>{pg.author?.display_name || pg.author?.email || '—'}</td>
                <td><span className={`badge ${statusColor(pg.status)}`}>{pg.status}</span></td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(pg.published_at || pg.created_at)}</td>
                <td>
                  <Link href={`/admin/pages/${pg.id}/edit`} className="btn btn-ghost btn-sm btn-icon" title="Edit">
                    <MoreHorizontal size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="table-footer">
            <span>{total} item{total !== 1 ? 's' : ''}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-ghost btn-sm btn-icon"><ChevronLeft size={14} /></button>
              <span style={{ fontSize: '0.8rem' }}>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-ghost btn-sm btn-icon"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
