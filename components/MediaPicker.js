'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Search, Upload, Check, Image, Film, Music, FileText, File, LayoutGrid } from 'lucide-react';



function getFileIcon(type) {
  if (!type) return <File size={20} />;
  if (type.startsWith('image/')) return <Image size={20} />;
  if (type.startsWith('video/')) return <Film size={20} />;
  if (type.startsWith('audio/')) return <Music size={20} />;
  return <FileText size={20} />;
}

export default function MediaPicker({ isOpen, onClose, onSelect, multiple = false }) {
  const [tab, setTab] = useState('library');
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selected, setSelected] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const fetchMedia = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      let query = supabase.from('media').select('*').order('created_at', { ascending: false }).limit(100);
      if (search) query = query.ilike('filename', `%${search}%`);
      if (filterType === 'images') query = query.like('mime_type', 'image/%');
      else if (filterType === 'video') query = query.like('mime_type', 'video/%');
      else if (filterType === 'audio') query = query.like('mime_type', 'audio/%');
      const { data, error: err } = await query;
      if (err) throw err;
      setMedia(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isOpen, search, filterType]);

  useEffect(() => {
    if (isOpen) { setSelected([]); fetchMedia(); }
  }, [isOpen, fetchMedia]);

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
        const { error: dbErr } = await supabase.from('media').insert({ filename: file.name, path, url: publicUrl, mime_type: file.type, size: file.size, alt_text: '', caption: '', description: '' });
        if (dbErr) throw dbErr;
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }
      setTab('library');
      await fetchMedia();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const toggleSelect = (item) => {
    if (multiple) {
      setSelected(prev => prev.find(s => s.id === item.id) ? prev.filter(s => s.id !== item.id) : [...prev, item]);
    } else {
      setSelected([item]);
    }
  };

  const handleConfirm = () => {
    if (selected.length === 0) return;
    onSelect(multiple ? selected : selected[0]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '100%', maxWidth: '900px', maxHeight: '85vh', borderRadius: '1rem', background: 'linear-gradient(135deg, rgba(15,15,26,0.98), rgba(26,26,46,0.98))', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#e2e8f0' }}>Select Media</h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '0.375rem', padding: '0.375rem', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 1.5rem' }}>
          {[['library', 'Library'], ['upload', 'Upload New']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ padding: '0.75rem 1rem', border: 'none', borderBottom: `2px solid ${tab === id ? '#a78bfa' : 'transparent'}`, background: 'transparent', color: tab === id ? '#a78bfa' : '#64748b', cursor: 'pointer', fontSize: '0.875rem', fontWeight: tab === id ? '600' : '400', marginBottom: '-1px' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1.25rem 1.5rem' }}>
          {error && (
            <div style={{ padding: '0.6rem 0.875rem', borderRadius: '0.375rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between' }}>
              {error} <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}><X size={14} /></button>
            </div>
          )}

          {tab === 'library' ? (
            <>
              {/* Search & Filter */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files..." style={{ width: '100%', paddingLeft: '2rem', paddingRight: '0.75rem', paddingTop: '0.45rem', paddingBottom: '0.45rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  {['all', 'images', 'video', 'audio'].map(t => (
                    <button key={t} onClick={() => setFilterType(t)} style={{ padding: '0.35rem 0.625rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.1)', background: filterType === t ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.05)', color: filterType === t ? '#a78bfa' : '#94a3b8', cursor: 'pointer', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  {Array.from({ length: 12 }).map((_, i) => <div key={i} style={{ aspectRatio: '1', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)' }} />)}
                </div>
              ) : media.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  <LayoutGrid size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                  <p>No media files found</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  {media.map(item => {
                    const isSelected = selected.find(s => s.id === item.id);
                    return (
                      <div key={item.id} onClick={() => toggleSelect(item)} style={{ position: 'relative', aspectRatio: '1', borderRadius: '0.5rem', overflow: 'hidden', border: `2px solid ${isSelected ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', transition: 'border-color 0.15s', flexShrink: 0 }}>
                        {item.mime_type?.startsWith('image/') ? (
                          <img src={item.url} alt={item.alt_text || item.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', gap: '0.375rem', padding: '0.5rem', boxSizing: 'border-box' }}>
                            {getFileIcon(item.mime_type)}
                            <span style={{ fontSize: '0.6rem', textAlign: 'center', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{item.filename}</span>
                          </div>
                        )}
                        {isSelected && (
                          <div style={{ position: 'absolute', top: '0.375rem', right: '0.375rem', width: '22px', height: '22px', borderRadius: '50%', background: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px rgba(0,0,0,0.5)' }}>
                            <Check size={12} color="#fff" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* Upload Tab */
            <div>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); handleUpload(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                style={{ border: `2px dashed ${dragging ? '#a78bfa' : 'rgba(255,255,255,0.15)'}`, borderRadius: '0.75rem', padding: '3rem', textAlign: 'center', cursor: 'pointer', background: dragging ? 'rgba(167,139,250,0.05)' : 'rgba(255,255,255,0.02)', transition: 'all 0.2s' }}
              >
                <Upload size={40} style={{ color: dragging ? '#a78bfa' : '#64748b', margin: '0 auto 1rem' }} />
                <p style={{ color: '#94a3b8', margin: '0 0 0.5rem', fontWeight: '500' }}>Drop files here</p>
                <p style={{ color: '#64748b', margin: 0, fontSize: '0.8rem' }}>or <span style={{ color: '#a78bfa', textDecoration: 'underline' }}>click to browse</span></p>
                <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={e => handleUpload(e.target.files)} />
              </div>

              {uploading && (
                <div style={{ marginTop: '1.25rem', padding: '1rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                    <span>Uploading...</span><span>{uploadProgress}%</span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                    <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #a78bfa, #60a5fa)', borderRadius: '2px', transition: 'width 0.3s' }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {tab === 'library' && (
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
              {selected.length > 0 ? `${selected.length} item${selected.length > 1 ? 's' : ''} selected` : 'Select files to insert'}
            </span>
            <div style={{ display: 'flex', gap: '0.625rem' }}>
              <button onClick={onClose} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.875rem' }}>
                Cancel
              </button>
              <button onClick={handleConfirm} disabled={selected.length === 0} style={{ padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none', background: selected.length > 0 ? 'linear-gradient(135deg, #a78bfa, #60a5fa)' : 'rgba(255,255,255,0.08)', color: selected.length > 0 ? '#fff' : '#64748b', cursor: selected.length > 0 ? 'pointer' : 'not-allowed', fontSize: '0.875rem', fontWeight: '600' }}>
                Insert {selected.length > 0 ? `(${selected.length})` : ''}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
