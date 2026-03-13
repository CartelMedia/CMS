'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus, Trash2, Edit2, ChevronDown, ChevronUp, GripVertical,
  Link, FileText, Tag, Folder, ExternalLink, Save, X, Check
} from 'lucide-react';



const SAMPLE_PAGES = [
  { id: 'p1', title: 'Home', url: '/' },
  { id: 'p2', title: 'About', url: '/about' },
  { id: 'p3', title: 'Contact', url: '/contact' },
  { id: 'p4', title: 'Services', url: '/services' },
  { id: 'p5', title: 'Portfolio', url: '/portfolio' },
];

const SAMPLE_POSTS = [
  { id: 'post1', title: 'Getting Started', url: '/blog/getting-started' },
  { id: 'post2', title: 'Advanced Tips', url: '/blog/advanced-tips' },
  { id: 'post3', title: 'News Update', url: '/blog/news-update' },
];

const SAMPLE_CATEGORIES = [
  { id: 'cat1', title: 'Technology', url: '/category/technology' },
  { id: 'cat2', title: 'Design', url: '/category/design' },
  { id: 'cat3', title: 'Business', url: '/category/business' },
];

const MENU_LOCATIONS = [
  { id: 'primary', label: 'Primary Navigation' },
  { id: 'footer', label: 'Footer Menu' },
  { id: 'sidebar', label: 'Sidebar Menu' },
];

function generateId() {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}

function MenuItem({ item, depth = 0, onEdit, onRemove, onMoveUp, onMoveDown, onToggleExpand, expanded }) {
  return (
    <div style={{ marginLeft: depth * 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '0.375rem' }}>
        <GripVertical size={14} style={{ color: '#475569', cursor: 'grab', flexShrink: 0 }} />
        {depth > 0 && <div style={{ width: '12px', height: '1px', background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#e2e8f0', fontWeight: '500' }}>{item.label}</span>
            <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', background: 'rgba(167,139,250,0.15)', color: '#a78bfa', flexShrink: 0 }}>{item.type}</span>
          </div>
          {!expanded && <p style={{ margin: 0, fontSize: '0.7rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.url}</p>}
        </div>
        <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
          <button onClick={() => onMoveUp(item.id)} style={{ padding: '0.25rem', borderRadius: '0.25rem', border: 'none', background: 'rgba(255,255,255,0.06)', color: '#94a3b8', cursor: 'pointer' }}><ChevronUp size={12} /></button>
          <button onClick={() => onMoveDown(item.id)} style={{ padding: '0.25rem', borderRadius: '0.25rem', border: 'none', background: 'rgba(255,255,255,0.06)', color: '#94a3b8', cursor: 'pointer' }}><ChevronDown size={12} /></button>
          <button onClick={() => onToggleExpand(item.id)} style={{ padding: '0.25rem', borderRadius: '0.25rem', border: 'none', background: 'rgba(255,255,255,0.06)', color: '#94a3b8', cursor: 'pointer' }}><Edit2 size={12} /></button>
          <button onClick={() => onRemove(item.id)} style={{ padding: '0.25rem', borderRadius: '0.25rem', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', cursor: 'pointer' }}><X size={12} /></button>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0.875rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.375rem', marginLeft: depth > 0 ? '0' : '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Navigation Label</label>
              <input defaultValue={item.label} onChange={e => onEdit(item.id, 'label', e.target.value)} style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>URL</label>
              <input defaultValue={item.url} onChange={e => onEdit(item.id, 'url', e.target.value)} style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: '#94a3b8', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked={item.target === '_blank'} onChange={e => onEdit(item.id, 'target', e.target.checked ? '_blank' : '_self')} />
              Open in new tab
            </label>
          </div>
        </div>
      )}

      {item.children?.map(child => (
        <MenuItem key={child.id} item={child} depth={depth + 1} onEdit={onEdit} onRemove={onRemove} onMoveUp={onMoveUp} onMoveDown={onMoveDown} onToggleExpand={onToggleExpand} expanded={expanded} />
      ))}
    </div>
  );
}

export default function MenusPage() {
  const [menus, setMenus] = useState([{ id: 'main', name: 'Main Menu', items: [], location: 'primary' }]);
  const [activeMenu, setActiveMenu] = useState('main');
  const [activeItemTab, setActiveItemTab] = useState('pages');
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedItems, setExpandedItems] = useState([]);
  const [customLink, setCustomLink] = useState({ url: '', label: '' });
  const [newMenuName, setNewMenuName] = useState('');
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMenus = async () => {
      try {
        const { data } = await supabase.from('options').select('value').eq('name', 'menus').single();
        if (data?.value) {
          const parsed = JSON.parse(data.value);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMenus(parsed);
            setActiveMenu(parsed[0].id);
          }
        }
      } catch {
        // use default
      } finally {
        setLoading(false);
      }
    };
    loadMenus();
  }, []);

  const currentMenu = menus.find(m => m.id === activeMenu) || menus[0];

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await supabase.from('options').upsert({ name: 'menus', value: JSON.stringify(menus) }, { onConflict: 'name' });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateMenuItems = (items) => {
    setMenus(prev => prev.map(m => m.id === activeMenu ? { ...m, items } : m));
  };

  const addItems = () => {
    const newItems = selectedItems.map(si => ({ ...si, id: generateId(), target: '_self', children: [] }));
    updateMenuItems([...currentMenu.items, ...newItems]);
    setSelectedItems([]);
  };

  const addCustomLink = () => {
    if (!customLink.url || !customLink.label) return;
    updateMenuItems([...currentMenu.items, { id: generateId(), label: customLink.label, url: customLink.url, type: 'custom', target: '_self', children: [] }]);
    setCustomLink({ url: '', label: '' });
  };

  const removeItem = (id) => {
    updateMenuItems(currentMenu.items.filter(i => i.id !== id));
  };

  const editItem = (id, key, value) => {
    updateMenuItems(currentMenu.items.map(i => i.id === id ? { ...i, [key]: value } : i));
  };

  const moveUp = (id) => {
    const items = [...currentMenu.items];
    const idx = items.findIndex(i => i.id === id);
    if (idx > 0) { [items[idx - 1], items[idx]] = [items[idx], items[idx - 1]]; updateMenuItems(items); }
  };

  const moveDown = (id) => {
    const items = [...currentMenu.items];
    const idx = items.findIndex(i => i.id === id);
    if (idx < items.length - 1) { [items[idx], items[idx + 1]] = [items[idx + 1], items[idx]]; updateMenuItems(items); }
  };

  const toggleExpand = (id) => {
    setExpandedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const createMenu = () => {
    if (!newMenuName.trim()) return;
    const id = `menu-${Date.now()}`;
    setMenus(prev => [...prev, { id, name: newMenuName, items: [], location: '' }]);
    setActiveMenu(id);
    setNewMenuName('');
    setShowNewMenu(false);
  };

  const deleteMenu = (id) => {
    if (!confirm('Delete this menu?')) return;
    const remaining = menus.filter(m => m.id !== id);
    setMenus(remaining);
    if (activeMenu === id) setActiveMenu(remaining[0]?.id || '');
  };

  const ITEM_SOURCES = {
    pages: SAMPLE_PAGES.map(p => ({ ...p, type: 'page' })),
    posts: SAMPLE_POSTS.map(p => ({ ...p, type: 'post' })),
    categories: SAMPLE_CATEGORIES.map(p => ({ ...p, type: 'category' })),
  };

  const toggleItemSelection = (item) => {
    setSelectedItems(prev => prev.find(s => s.id === item.id) ? prev.filter(s => s.id !== item.id) : [...prev, { ...item, label: item.title }]);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.25rem' }}>Menus</h1>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.875rem' }}>Build and manage navigation menus</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button onClick={() => setShowNewMenu(!showNewMenu)} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.875rem' }}>
              <Plus size={16} /> New Menu
            </button>
            <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none', background: saved ? 'rgba(34,197,94,0.8)' : 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem', opacity: saving ? 0.7 : 1 }}>
              {saved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> {saving ? 'Saving...' : 'Save Menu'}</>}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            {error} <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {/* New Menu Input */}
        {showNewMenu && (
          <div style={{ padding: '1rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input value={newMenuName} onChange={e => setNewMenuName(e.target.value)} placeholder="Menu name..." style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none' }} onKeyDown={e => e.key === 'Enter' && createMenu()} />
            <button onClick={createMenu} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: '#fff', cursor: 'pointer', fontSize: '0.875rem' }}>Create</button>
            <button onClick={() => setShowNewMenu(false)} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {/* Menu selector tabs */}
        {menus.length > 1 && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {menus.map(menu => (
              <div key={menu.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button onClick={() => setActiveMenu(menu.id)} style={{ padding: '0.4rem 0.875rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', background: activeMenu === menu.id ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.05)', color: activeMenu === menu.id ? '#a78bfa' : '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}>
                  {menu.name}
                </button>
                {menus.length > 1 && (
                  <button onClick={() => deleteMenu(menu.id)} style={{ padding: '0.3rem', borderRadius: '0.375rem', border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer' }}><X size={12} /></button>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left Panel - Add Items */}
          <div style={{ borderRadius: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', color: '#e2e8f0' }}>Add Menu Items</h3>
            </div>

            {/* Item type tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {[['pages', 'Pages', FileText], ['posts', 'Posts', FileText], ['categories', 'Categories', Folder], ['custom', 'Custom Link', Link]].map(([id, label, Icon]) => (
                <button key={id} onClick={() => setActiveItemTab(id)} style={{ flex: 1, padding: '0.6rem 0.25rem', border: 'none', borderBottom: `2px solid ${activeItemTab === id ? '#a78bfa' : 'transparent'}`, background: 'transparent', color: activeItemTab === id ? '#a78bfa' : '#64748b', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem', marginBottom: '-1px' }}>
                  <Icon size={13} />{label}
                </button>
              ))}
            </div>

            <div style={{ padding: '1rem' }}>
              {activeItemTab === 'custom' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>URL</label>
                    <input value={customLink.url} onChange={e => setCustomLink(p => ({ ...p, url: e.target.value }))} placeholder="https://example.com" style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Link Text</label>
                    <input value={customLink.label} onChange={e => setCustomLink(p => ({ ...p, label: e.target.value }))} placeholder="Label" style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <button onClick={addCustomLink} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: 'none', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>Add to Menu</button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: '260px', overflowY: 'auto', marginBottom: '0.75rem' }}>
                    {(ITEM_SOURCES[activeItemTab] || []).map(item => {
                      const isSelected = selectedItems.find(s => s.id === item.id);
                      return (
                        <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.5rem', borderRadius: '0.375rem', background: isSelected ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isSelected ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', fontSize: '0.8rem', color: '#e2e8f0' }}>
                          <input type="checkbox" checked={!!isSelected} onChange={() => toggleItemSelection(item)} style={{ cursor: 'pointer' }} />
                          {item.title}
                        </label>
                      );
                    })}
                  </div>
                  <button onClick={addItems} disabled={selectedItems.length === 0} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: 'none', background: selectedItems.length > 0 ? 'linear-gradient(135deg, #a78bfa, #60a5fa)' : 'rgba(255,255,255,0.08)', color: selectedItems.length > 0 ? '#fff' : '#64748b', cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed', fontSize: '0.8rem', fontWeight: '600' }}>
                    Add to Menu {selectedItems.length > 0 ? `(${selectedItems.length})` : ''}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right Panel - Menu Structure */}
          <div>
            <div style={{ borderRadius: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', color: '#e2e8f0' }}>
                  {currentMenu?.name || 'Menu Structure'}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{currentMenu?.items?.length || 0} items</span>
              </div>

              <div style={{ padding: '1rem 1.25rem' }}>
                {!currentMenu?.items?.length ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#475569' }}>
                    <Link size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>Add items from the left panel</p>
                  </div>
                ) : (
                  currentMenu.items.map(item => (
                    <MenuItem
                      key={item.id}
                      item={item}
                      onEdit={editItem}
                      onRemove={removeItem}
                      onMoveUp={moveUp}
                      onMoveDown={moveDown}
                      onToggleExpand={toggleExpand}
                      expanded={expandedItems.includes(item.id)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Menu Locations */}
            <div style={{ borderRadius: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: '600', color: '#e2e8f0' }}>Menu Locations</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {MENU_LOCATIONS.map(loc => (
                  <div key={loc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>{loc.label}</span>
                    <select value={menus.find(m => m.location === loc.id)?.id || ''} onChange={e => {
                      setMenus(prev => prev.map(m => ({
                        ...m,
                        location: m.id === e.target.value ? loc.id : (m.location === loc.id ? '' : m.location)
                      })));
                    }} style={{ padding: '0.35rem 0.625rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}>
                      <option value="">— Select —</option>
                      {menus.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
