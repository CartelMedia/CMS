'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Clock, User, ChevronLeft, ChevronRight, RotateCcw, Loader2 } from 'lucide-react'

function diffWords(oldText, newText) {
  const oldWords = (oldText || '').split(/(\s+)/)
  const newWords = (newText || '').split(/(\s+)/)
  const result = []

  let i = 0, j = 0
  while (i < oldWords.length || j < newWords.length) {
    if (i >= oldWords.length) {
      result.push({ type: 'add', text: newWords[j++] })
    } else if (j >= newWords.length) {
      result.push({ type: 'remove', text: oldWords[i++] })
    } else if (oldWords[i] === newWords[j]) {
      result.push({ type: 'same', text: oldWords[i] })
      i++; j++
    } else {
      result.push({ type: 'remove', text: oldWords[i++] })
      result.push({ type: 'add', text: newWords[j++] })
    }
  }
  return result
}

function stripHtml(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export default function RevisionsPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id

  const [post, setPost] = useState(null)
  const [revisions, setRevisions] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const [postRes, revisionsRes] = await Promise.all([
        supabase.from('posts').select('id, title, content_html, updated_at, author:users(name)').eq('id', postId).single(),
        supabase.from('revisions').select('*, revised_by_user:users(name)').eq('post_id', postId).order('revised_at', { ascending: false }),
      ])

      if (postRes.error) { setError('Post not found'); setLoading(false); return }

      setPost(postRes.data)
      const allRevisions = [
        { id: 'current', title: postRes.data.title, content_html: postRes.data.content_html, revised_at: postRes.data.updated_at, revised_by_user: postRes.data.author, isCurrent: true },
        ...(revisionsRes.data || []),
      ]
      setRevisions(allRevisions)
      setLoading(false)
    }
    if (postId) load()
  }, [postId])

  async function restoreRevision(revision) {
    if (!confirm(`Restore this revision from ${new Date(revision.revised_at).toLocaleString()}?`)) return
    setRestoring(true)
    try {
      await supabase.from('revisions').insert({
        post_id: postId,
        title: post.title,
        content_html: post.content_html,
        content_json: post.content_json,
        revised_at: new Date().toISOString(),
      })

      await supabase.from('posts').update({
        title: revision.title,
        content_html: revision.content_html,
        content_json: revision.content_json,
        updated_at: new Date().toISOString(),
      }).eq('id', postId)

      router.push(`/admin/posts/${postId}/edit`)
    } catch {
      setError('Failed to restore revision')
    } finally {
      setRestoring(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#64748b' }}>
      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (error) return (
    <div style={{ color: '#fca5a5', padding: '20px', background: 'rgba(239,68,68,0.1)', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.3)' }}>
      {error}
    </div>
  )

  const current = revisions[currentIdx]
  const previous = revisions[currentIdx + 1]
  const currentText = stripHtml(current?.content_html)
  const previousText = stripHtml(previous?.content_html)
  const diff = previous ? diffWords(previousText, currentText) : null

  const cardStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '14px', padding: '22px',
  }

  return (
    <div style={{ color: '#e2e8f0', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Link href={`/admin/posts/${postId}/edit`} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          color: '#64748b', textDecoration: 'none', fontSize: '13px',
          padding: '6px 10px', borderRadius: '8px', transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'none' }}
        >
          <ArrowLeft size={16} /> Back to Editor
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Revisions</h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>{post?.title}</p>
        </div>
        <span style={{ color: '#64748b', fontSize: '13px' }}>{revisions.length} revision{revisions.length !== 1 ? 's' : ''}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
        {/* Revision List */}
        <div style={{ ...cardStyle, height: 'fit-content' }}>
          <h3 style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px', margin: '0 0 14px' }}>
            History
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {revisions.map((rev, idx) => (
              <button
                key={rev.id}
                onClick={() => setCurrentIdx(idx)}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 12px',
                  borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: currentIdx === idx ? 'rgba(99,102,241,0.15)' : 'none',
                  borderLeft: currentIdx === idx ? '2px solid #6366f1' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (currentIdx !== idx) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={e => { if (currentIdx !== idx) e.currentTarget.style.background = 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                  {rev.isCurrent && (
                    <span style={{ fontSize: '10px', background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                      Current
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '11px', marginBottom: '2px' }}>
                  <Clock size={11} />
                  {new Date(rev.revised_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569', fontSize: '11px' }}>
                  <User size={11} />
                  {rev.revised_by_user?.name || 'Unknown'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Diff Viewer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Navigation */}
          <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px' }}>
            <button
              onClick={() => setCurrentIdx(v => Math.min(v + 1, revisions.length - 2))}
              disabled={currentIdx >= revisions.length - 2}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)',
                background: 'none', cursor: currentIdx >= revisions.length - 2 ? 'not-allowed' : 'pointer',
                color: currentIdx >= revisions.length - 2 ? '#334155' : '#94a3b8', fontSize: '13px',
                transition: 'all 0.15s',
              }}
            >
              <ChevronLeft size={14} /> Older
            </button>
            <div style={{ flex: 1, textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              Comparing revision {currentIdx + 1} of {revisions.length}
            </div>
            <button
              onClick={() => setCurrentIdx(v => Math.max(v - 1, 0))}
              disabled={currentIdx === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)',
                background: 'none', cursor: currentIdx === 0 ? 'not-allowed' : 'pointer',
                color: currentIdx === 0 ? '#334155' : '#94a3b8', fontSize: '13px',
                transition: 'all 0.15s',
              }}
            >
              Newer <ChevronRight size={14} />
            </button>
            {!current?.isCurrent && (
              <button
                onClick={() => restoreRevision(current)}
                disabled={restoring}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 14px', borderRadius: '7px', border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white', fontSize: '13px', fontWeight: 600, cursor: restoring ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 12px rgba(99,102,241,0.3)', transition: 'all 0.15s',
                }}
              >
                {restoring ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <RotateCcw size={14} />}
                Restore This Revision
              </button>
            )}
          </div>

          {/* Comparison Panel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Previous */}
            <div style={{ ...cardStyle }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                <div>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>
                    {previous ? `Revision from ${new Date(previous.revised_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Original (No Previous)'}
                  </p>
                  {previous?.revised_by_user?.name && (
                    <p style={{ margin: 0, color: '#475569', fontSize: '11px' }}>by {previous.revised_by_user.name}</p>
                  )}
                </div>
              </div>
              <div style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 1.7, minHeight: '200px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {previous ? (
                  diff?.map((part, i) => (
                    part.type === 'remove' ? (
                      <mark key={i} style={{ background: 'rgba(239,68,68,0.25)', color: '#fca5a5', borderRadius: '2px' }}>{part.text}</mark>
                    ) : part.type === 'same' ? (
                      <span key={i}>{part.text}</span>
                    ) : null
                  ))
                ) : (
                  <span style={{ color: '#334155', fontStyle: 'italic' }}>This is the initial revision.</span>
                )}
              </div>
            </div>

            {/* Current */}
            <div style={{ ...cardStyle }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                <div>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>
                    {current?.isCurrent ? 'Current Version' : `Revision from ${new Date(current?.revised_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                  </p>
                  {current?.revised_by_user?.name && (
                    <p style={{ margin: 0, color: '#475569', fontSize: '11px' }}>by {current.revised_by_user.name}</p>
                  )}
                </div>
              </div>
              <div style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 1.7, minHeight: '200px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {diff?.map((part, i) => (
                  part.type === 'add' ? (
                    <mark key={i} style={{ background: 'rgba(16,185,129,0.2)', color: '#6ee7b7', borderRadius: '2px' }}>{part.text}</mark>
                  ) : part.type === 'same' ? (
                    <span key={i}>{part.text}</span>
                  ) : null
                )) || <span style={{ color: '#94a3b8' }}>{currentText}</span>}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '20px', padding: '12px 16px', ...cardStyle }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
              <mark style={{ background: 'rgba(239,68,68,0.25)', color: '#fca5a5', padding: '1px 6px', borderRadius: '3px' }}>removed text</mark>
              <span>Removed words</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
              <mark style={{ background: 'rgba(16,185,129,0.2)', color: '#6ee7b7', padding: '1px 6px', borderRadius: '3px' }}>added text</mark>
              <span>Added words</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
