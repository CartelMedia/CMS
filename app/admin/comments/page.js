'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, MessageSquare, Trash2, Edit2, AlertTriangle, ChevronDown, Reply, ExternalLink, User } from 'lucide-react';



const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'spam', label: 'Spam' },
  { id: 'trash', label: 'Trash' },
];

function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }) {
  const styles = {
    approved: { background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' },
    pending: { background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' },
    spam: { background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' },
    trash: { background: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.3)' },
  };
  return (
    <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontWeight: '500', ...(styles[status] || styles.pending) }}>
      {status}
    </span>
  );
}

export default function CommentsPage() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [counts, setCounts] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [error, setError] = useState(null);
  const [savingReply, setSavingReply] = useState(false);

  const fetchCounts = async () => {
    const statuses = ['pending', 'approved', 'spam', 'trash'];
    const newCounts = {};
    for (const s of statuses) {
      const { count } = await supabase.from('comments').select('*', { count: 'exact', head: true }).eq('status', s);
      newCounts[s] = count || 0;
    }
    setCounts(newCounts);
  };

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('comments')
        .select(`*, posts(title, slug)`)
        .order('created_at', { ascending: false });

      if (activeTab !== 'all') query = query.eq('status', activeTab);

      const { data, error: err } = await query;
      if (err) throw err;
      setComments(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchComments();
    fetchCounts();
  }, [fetchComments]);

  const updateStatus = async (id, status) => {
    try {
      await supabase.from('comments').update({ status }).eq('id', id);
      await fetchComments();
      await fetchCounts();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteComment = async (id) => {
    if (!confirm('Permanently delete this comment?')) return;
    try {
      await supabase.from('comments').delete().eq('id', id);
      await fetchComments();
      await fetchCounts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedItems.length === 0) return;
    try {
      if (bulkAction === 'delete') {
        if (!confirm(`Delete ${selectedItems.length} comments?`)) return;
        await supabase.from('comments').delete().in('id', selectedItems);
      } else {
        await supabase.from('comments').update({ status: bulkAction }).in('id', selectedItems);
      }
      setSelectedItems([]);
      setBulkAction('');
      await fetchComments();
      await fetchCounts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReply = async (comment) => {
    if (!replyText.trim()) return;
    setSavingReply(true);
    try {
      await supabase.from('comments').insert({
        post_id: comment.post_id,
        parent_id: comment.id,
        author_name: 'Admin',
        author_email: '',
        content: replyText,
        status: 'approved',
      });
      setReplyingTo(null);
      setReplyText('');
      await fetchComments();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingReply(false);
    }
  };

  const handleSaveEdit = async (id) => {
    try {
      await supabase.from('comments').update({ content: editText }).eq('id', id);
      setEditingComment(null);
      await fetchComments();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleSelect = (id) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const allSelected = comments.length > 0 && selectedItems.length === comments.length;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.25rem' }}>Comments</h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.875rem' }}>{counts.pending || 0} awaiting moderation</p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            {error} <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {STATUS_TABS.map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedItems([]); }} style={{ padding: '0.625rem 1rem', border: 'none', borderBottom: `2px solid ${activeTab === tab.id ? '#a78bfa' : 'transparent'}`, background: 'transparent', color: activeTab === tab.id ? '#a78bfa' : '#64748b', cursor: 'pointer', fontSize: '0.875rem', fontWeight: activeTab === tab.id ? '600' : '400', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '-1px' }}>
              {tab.label}
              {tab.id !== 'all' && counts[tab.id] > 0 && (
                <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '9999px', background: tab.id === 'pending' ? '#a78bfa' : 'rgba(255,255,255,0.1)', color: tab.id === 'pending' ? '#fff' : '#94a3b8', fontWeight: '600' }}>
                  {counts[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Bulk Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
          <input type="checkbox" checked={allSelected} onChange={() => setSelectedItems(allSelected ? [] : comments.map(c => c.id))} style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
          <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}>
            <option value="">Bulk Actions</option>
            <option value="approved">Approve</option>
            <option value="pending">Mark as Pending</option>
            <option value="spam">Mark as Spam</option>
            <option value="trash">Move to Trash</option>
            <option value="delete">Delete Permanently</option>
          </select>
          <button onClick={handleBulkAction} disabled={!bulkAction || selectedItems.length === 0} style={{ padding: '0.4rem 0.875rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', cursor: 'pointer', fontSize: '0.8rem', opacity: (!bulkAction || selectedItems.length === 0) ? 0.5 : 1 }}>
            Apply
          </button>
          {selectedItems.length > 0 && <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedItems.length} selected</span>}
        </div>

        {/* Comments List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ padding: '1.25rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.04)', height: '100px' }} />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
            <MessageSquare size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p>No comments found</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {comments.map(comment => (
              <div key={comment.id} style={{ borderRadius: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', overflow: 'hidden', borderLeft: comment.status === 'pending' ? '3px solid #fbbf24' : comment.status === 'spam' ? '3px solid #ef4444' : '3px solid transparent' }}>
                <div style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <input type="checkbox" checked={selectedItems.includes(comment.id)} onChange={() => toggleSelect(comment.id)} style={{ marginTop: '0.25rem', cursor: 'pointer', flexShrink: 0 }} />

                    {/* Avatar */}
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
                      {getInitials(comment.author_name)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Author row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: '600', fontSize: '0.875rem', color: '#e2e8f0' }}>{comment.author_name || 'Anonymous'}</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{comment.author_email}</span>
                        <StatusBadge status={comment.status} />
                        <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: 'auto' }}>{formatDate(comment.created_at)}</span>
                      </div>

                      {/* Post reference */}
                      {comment.posts && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          In: <span style={{ color: '#a78bfa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>{comment.posts.title} <ExternalLink size={11} /></span>
                        </div>
                      )}

                      {/* Comment content */}
                      {editingComment === comment.id ? (
                        <div style={{ marginBottom: '0.75rem' }}>
                          <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={4} style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button onClick={() => handleSaveEdit(comment.id)} style={{ padding: '0.35rem 0.875rem', borderRadius: '0.375rem', border: 'none', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>Save</button>
                            <button onClick={() => setEditingComment(null)} style={{ padding: '0.35rem 0.875rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', color: '#cbd5e1', lineHeight: '1.6' }}>{comment.content}</p>
                      )}

                      {/* Inline Reply */}
                      {replyingTo === comment.id && (
                        <div style={{ marginBottom: '0.75rem', padding: '0.875rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#64748b' }}>Reply to {comment.author_name}:</p>
                          <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write your reply..." rows={3} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.8rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '0.5rem' }} />
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => handleReply(comment)} disabled={savingReply} style={{ padding: '0.35rem 0.875rem', borderRadius: '0.375rem', border: 'none', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', opacity: savingReply ? 0.7 : 1 }}>
                              {savingReply ? 'Sending...' : 'Post Reply'}
                            </button>
                            <button onClick={() => { setReplyingTo(null); setReplyText(''); }} style={{ padding: '0.35rem 0.875rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button>
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {comment.status !== 'approved' && (
                          <button onClick={() => updateStatus(comment.id, 'approved')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.625rem', borderRadius: '0.375rem', border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.1)', color: '#4ade80', cursor: 'pointer', fontSize: '0.75rem' }}>
                            <Check size={12} /> Approve
                          </button>
                        )}
                        {comment.status === 'approved' && (
                          <button onClick={() => updateStatus(comment.id, 'pending')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.625rem', borderRadius: '0.375rem', border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.1)', color: '#fbbf24', cursor: 'pointer', fontSize: '0.75rem' }}>
                            <X size={12} /> Unapprove
                          </button>
                        )}
                        <button onClick={() => { setReplyingTo(comment.id); setReplyText(''); }} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.625rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem' }}>
                          <Reply size={12} /> Reply
                        </button>
                        <button onClick={() => { setEditingComment(comment.id); setEditText(comment.content); }} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.625rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem' }}>
                          <Edit2 size={12} /> Edit
                        </button>
                        {comment.status !== 'spam' && (
                          <button onClick={() => updateStatus(comment.id, 'spam')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.625rem', borderRadius: '0.375rem', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.08)', color: '#fca5a5', cursor: 'pointer', fontSize: '0.75rem' }}>
                            <AlertTriangle size={12} /> Spam
                          </button>
                        )}
                        {comment.status !== 'trash' ? (
                          <button onClick={() => updateStatus(comment.id, 'trash')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.625rem', borderRadius: '0.375rem', border: '1px solid rgba(100,116,139,0.3)', background: 'rgba(100,116,139,0.1)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem' }}>
                            <Trash2 size={12} /> Trash
                          </button>
                        ) : (
                          <button onClick={() => deleteComment(comment.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.625rem', borderRadius: '0.375rem', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.15)', color: '#f87171', cursor: 'pointer', fontSize: '0.75rem' }}>
                            <Trash2 size={12} /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
