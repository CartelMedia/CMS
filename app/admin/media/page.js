'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  LayoutGrid, List, Upload, Search, X, Copy, Check,
  Trash2, Edit2, Image, Film, Music, FileText, File,
  ChevronLeft, ChevronRight, Eye, Download
} from 'lucide-react';

const ITEMS_PER_PAGE = 24;

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getFileIcon(type) {
  if (!type) return <File size={20} />;
  if (type.startsWith('image/')) return <Image size={20} />;
  if (type.startsWith('video/')) return <Film size={20} />;
  if (type.startsWith('audio/')) return <Music size={20} />;
  if (type.includes('pdf') || type.includes('document') || type.includes('text')) return <FileText size={20} />;
  return <File size={20} />;
}

function getFileCategory(type) {
  if (!type) return 'documents';
  if (type.startsWith('image/')) return 'images';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  return 'documents';
}

export default function MediaLibraryPage() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [editingAlt, setEditingAlt] = useState('');
  const [editingCaption, setEditingCaption] = useState('');
  const [editingDesc, setEditingDesc] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('media')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (search) query = query.ilike('filename', `%${search}%`);
      if (filterType !== 'all') {
        if (filterType === 'images') query = query.like('mime_type', 'image/%');
        else if (filterType === 'video') query = query.like('mime_type', 'video/%');
        else if (filterType === 'audio') query = query.like('mime_type', 'audio/%');
        else query = query.not('mime_type', 'like', 'image/%').not('mime_type', 'like', 'video/%').not('mime_type', 'like', 'audio/%');
      }

      const { data, count, error: err } = await query;
      if (err) throw err;
      setMedia(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterType]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop();
        const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
        const path = `media/${filename}`;

        const { error: storageErr } = await supabase.storage.from('media').upload(path, file);
        if (storageErr) throw storageErr;

        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);

        const { error: dbErr } = await supabase.from('media').insert({
          filename: file.name,
          path,
          url: publicUrl,
          mime_type: file.type,
          size: file.size,
          alt_text: '',
          caption: '',
          description: '',
        });
        if (dbErr) throw dbErr;

        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }
      await fetchMedia();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleUpload(e.dataTransfer.files);
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.filename}"?`)) return;
    try {
      await supabase.storage.from('media').remove([item.path]);
      await supabase.from('media').delete().eq('id', item.id);
      setSelectedItem(null);
      await fetchMedia();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedItems.length} items?`)) return;
    try {
      const items = media.filter(m => selectedItems.includes(m.id));
      const paths = items.map(i => i.path);
      await supabase.storage.from('media').remove(paths);
      await supabase.from('media').delete().in('id', selectedItems);
      setSelectedItems([]);
      setBulkMode(false);
      await fetchMedia();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveMeta = async () => {
    if (!selectedItem) return;
    setSavingMeta(true);
    try {
      await supabase.from('media').update({
        alt_text: editingAlt,
        caption: editingCaption,
        description: editingDesc,
      }).eq('id', selectedItem.id);
      setSelectedItem(prev => ({ ...prev, alt_text: editingAlt, caption: editingCaption, description: editingDesc }));
      await fetchMedia();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingMeta(false);
    }
  };

  const openSidebar = (item) => {
    setSelectedItem(item);
    setEditingAlt(item.alt_text || '');
    setEditingCaption(item.caption || '');
    setEditingDesc(item.description || '');
  };

  const toggleSelect = (id) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>Media Library</h1>
            <p style={{ color: '#94a3b8', marginTop: '0.25rem', fontSize: '0.875rem' }}>{totalCount} files uploaded</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button onClick={() => setBulkMode(!bulkMode)} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', background: bulkMode ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.05)', color: '#e2e8f0', cursor: 'pointer', fontSize: '0.875rem' }}>
              {bulkMode ? 'Cancel Select' : 'Select'}
            </button>
            <button onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>
              <Upload size={16} /> Upload Files
            </button>
            <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={e => handleUpload(e.target.files)} />
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              <button onClick={() => setViewMode('grid')} style={{ padding: '0.5rem 0.75rem', border: 'none', background: viewMode === 'grid' ? 'rgba(167,139,250,0.3)' : 'transparent', color: viewMode === 'grid' ? '#a78bfa' : '#94a3b8', cursor: 'pointer' }}>
                <LayoutGrid size={18} />
              </button>
              <button onClick={() => setViewMode('list')} style={{ padding: '0.5rem 0.75rem', border: 'none', background: viewMode === 'list' ? 'rgba(167,139,250,0.3)' : 'transparent', color: viewMode === 'list' ? '#a78bfa' : '#94a3b8', cursor: 'pointer' }}>
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            {error} <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>
              <span>Uploading...</span><span>{uploadProgress}%</span>
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
              <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #a78bfa, #60a5fa)', borderRadius: '2px', transition: 'width 0.3s' }} />
            </div>
          </div>
        )}

        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{ border: `2px dashed ${dragging ? '#a78bfa' : 'rgba(255,255,255,0.15)'}`, borderRadius: '0.75rem', padding: '2rem', textAlign: 'center', marginBottom: '1.5rem', cursor: 'pointer', background: dragging ? 'rgba(167,139,250,0.05)' : 'transparent', transition: 'all 0.2s' }}
        >
          <Upload size={32} style={{ color: dragging ? '#a78bfa' : '#64748b', margin: '0 auto 0.75rem' }} />
          <p style={{ color: dragging ? '#a78bfa' : '#64748b', margin: 0 }}>Drop files here or <span style={{ color: '#a78bfa', textDecoration: 'underline' }}>click to upload</span></p>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search files..." style={{ width: '100%', paddingLeft: '2.25rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['all', 'images', 'video', 'audio', 'documents'].map(t => (
              <button key={t} onClick={() => { setFilterType(t); setPage(1); }} style={{ padding: '0.4rem 0.875rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', background: filterType === t ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.05)', color: filterType === t ? '#a78bfa' : '#94a3b8', cursor: 'pointer', fontSize: '0.8rem', textTransform: 'capitalize' }}>
                {t}
              </button>
            ))}
          </div>
          {bulkMode && selectedItems.length > 0 && (
            <button onClick={handleBulkDelete} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.875rem', borderRadius: '0.5rem', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', cursor: 'pointer', fontSize: '0.8rem' }}>
              <Trash2 size={14} /> Delete ({selectedItems.length})
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {/* Main Content */}
          <div style={{ flex: 1 }}>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} style={{ aspectRatio: '1', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)', animation: 'pulse 2s infinite' }} />
                ))}
              </div>
            ) : media.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                <Image size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <p>No media files found</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
                {media.map(item => (
                  <div key={item.id} onClick={() => bulkMode ? toggleSelect(item.id) : openSidebar(item)} style={{ position: 'relative', aspectRatio: '1', borderRadius: '0.75rem', overflow: 'hidden', border: `2px solid ${selectedItems.includes(item.id) ? '#a78bfa' : selectedItem?.id === item.id ? '#60a5fa' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', transition: 'all 0.2s' }}>
                    {item.mime_type?.startsWith('image/') ? (
                      <img src={item.url} alt={item.alt_text || item.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', gap: '0.5rem' }}>
                        {getFileIcon(item.mime_type)}
                        <span style={{ fontSize: '0.65rem', textAlign: 'center', padding: '0 0.5rem', color: '#94a3b8' }}>{item.filename}</span>
                      </div>
                    )}
                    {bulkMode && (
                      <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #fff', background: selectedItems.includes(item.id) ? '#a78bfa' : 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedItems.includes(item.id) && <Check size={12} color="#fff" />}
                      </div>
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)', opacity: 0, transition: 'opacity 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.75rem 0.5rem 0.5rem' }}>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.filename}</p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <button onClick={(e) => { e.stopPropagation(); openSidebar(item); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '0.25rem', padding: '0.2rem', cursor: 'pointer', color: '#fff' }}><Edit2 size={12} /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(item); }} style={{ background: 'rgba(239,68,68,0.4)', border: 'none', borderRadius: '0.25rem', padding: '0.2rem', cursor: 'pointer', color: '#fff' }}><Trash2 size={12} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                      {bulkMode && <th style={{ padding: '0.75rem 1rem', textAlign: 'left', width: '40px' }}></th>}
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>File</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Size</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {media.map((item, idx) => (
                      <tr key={item.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                        {bulkMode && (
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => toggleSelect(item.id)} style={{ cursor: 'pointer' }} />
                          </td>
                        )}
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '0.375rem', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {item.mime_type?.startsWith('image/') ? <img src={item.url} alt={item.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getFileIcon(item.mime_type)}
                            </div>
                            <span style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>{item.filename}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>{getFileCategory(item.mime_type)}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#94a3b8' }}>{formatBytes(item.size)}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#94a3b8' }}>{formatDate(item.created_at)}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => openSidebar(item)} style={{ padding: '0.35rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer' }}><Eye size={14} /></button>
                            <button onClick={() => handleDelete(item)} style={{ padding: '0.35rem', borderRadius: '0.375rem', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', cursor: 'pointer' }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: page === 1 ? '#4a5568' : '#e2e8f0', cursor: page === 1 ? 'not-allowed' : 'pointer' }}><ChevronLeft size={16} /></button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  return (
                    <button key={p} onClick={() => setPage(p)} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.1)', background: page === p ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.05)', color: page === p ? '#a78bfa' : '#e2e8f0', cursor: 'pointer', minWidth: '36px' }}>{p}</button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: page === totalPages ? '#4a5568' : '#e2e8f0', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}><ChevronRight size={16} /></button>
              </div>
            )}
          </div>

          {/* Sidebar Panel */}
          {selectedItem && (
            <div style={{ width: '300px', flexShrink: 0, borderRadius: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', padding: '1.25rem', alignSelf: 'flex-start', position: 'sticky', top: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', color: '#e2e8f0' }}>File Details</h3>
                <button onClick={() => setSelectedItem(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={16} /></button>
              </div>

              <div style={{ width: '100%', aspectRatio: '1', borderRadius: '0.5rem', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {selectedItem.mime_type?.startsWith('image/') ? (
                  <img src={selectedItem.url} alt={selectedItem.alt_text || selectedItem.filename} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ textAlign: 'center', color: '#64748b' }}>{getFileIcon(selectedItem.mime_type)}<p style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>{selectedItem.mime_type}</p></div>
                )}
              </div>

              <p style={{ margin: '0 0 0.25rem', fontSize: '0.875rem', fontWeight: '600', color: '#e2e8f0', wordBreak: 'break-all' }}>{selectedItem.filename}</p>
              <p style={{ margin: '0 0 1rem', fontSize: '0.75rem', color: '#64748b' }}>{formatBytes(selectedItem.size)} · {formatDate(selectedItem.created_at)}</p>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>File URL</label>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <input readOnly value={selectedItem.url || ''} style={{ flex: 1, padding: '0.4rem 0.5rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '0.7rem', outline: 'none', overflow: 'hidden', textOverflow: 'ellipsis' }} />
                  <button onClick={() => handleCopyUrl(selectedItem.url)} style={{ padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.1)', background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)', color: copied ? '#4ade80' : '#94a3b8', cursor: 'pointer' }}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {[['Alt Text', editingAlt, setEditingAlt], ['Caption', editingCaption, setEditingCaption]].map(([label, val, setter]) => (
                <div key={label} style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>{label}</label>
                  <input value={val} onChange={e => setter(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Description</label>
                <textarea value={editingDesc} onChange={e => setEditingDesc(e.target.value)} rows={3} style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.8rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={handleSaveMeta} disabled={savingMeta} style={{ flex: 1, padding: '0.5rem', borderRadius: '0.375rem', border: 'none', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', opacity: savingMeta ? 0.7 : 1 }}>
                  {savingMeta ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => handleDelete(selectedItem)} style={{ padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', cursor: 'pointer' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
