'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus, X, ChevronDown, ChevronUp, Save, Check,
  FileText, MessageSquare, Search, Tag, Hash,
  Code, Type, Archive, Settings, GripVertical
} from 'lucide-react';



const AVAILABLE_WIDGETS = [
  { id: 'recent-posts', name: 'Recent Posts', description: 'Displays your most recent posts', icon: FileText, settings: { title: 'Recent Posts', count: 5 } },
  { id: 'recent-comments', name: 'Recent Comments', description: 'Shows latest comments', icon: MessageSquare, settings: { title: 'Recent Comments', count: 5 } },
  { id: 'search', name: 'Search', description: 'A search form for your site', icon: Search, settings: { title: 'Search' } },
  { id: 'categories', name: 'Categories', description: 'List or dropdown of categories', icon: Tag, settings: { title: 'Categories', style: 'list' } },
  { id: 'tag-cloud', name: 'Tag Cloud', description: 'Cloud of your most used tags', icon: Hash, settings: { title: 'Tags', count: 45 } },
  { id: 'custom-html', name: 'Custom HTML', description: 'Arbitrary HTML code', icon: Code, settings: { title: '', html: '' } },
  { id: 'text', name: 'Text Widget', description: 'Arbitrary text or HTML', icon: Type, settings: { title: '', content: '' } },
  { id: 'archives', name: 'Archives', description: 'Monthly archive of your posts', icon: Archive, settings: { title: 'Archives' } },
  { id: 'meta', name: 'Meta', description: 'Login, RSS, & WordPress.org links', icon: Settings, settings: { title: 'Meta' } },
];

const WIDGET_AREAS = [
  { id: 'sidebar', name: 'Main Sidebar', description: 'Appears on posts and pages' },
  { id: 'footer-1', name: 'Footer 1', description: 'First footer widget area' },
  { id: 'footer-2', name: 'Footer 2', description: 'Second footer widget area' },
];

function generateId() {
  return `w-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}

function WidgetInstance({ widget, areaId, onRemove, onSettingsChange }) {
  const [expanded, setExpanded] = useState(false);
  const WidgetIcon = AVAILABLE_WIDGETS.find(w => w.id === widget.type)?.icon || Settings;

  return (
    <div style={{ borderRadius: '0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        <GripVertical size={14} style={{ color: '#475569', flexShrink: 0 }} />
        <WidgetIcon size={14} style={{ color: '#a78bfa', flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: '0.875rem', color: '#e2e8f0', fontWeight: '500' }}>
          {widget.settings?.title || AVAILABLE_WIDGETS.find(w => w.id === widget.type)?.name}
        </span>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button onClick={(e) => { e.stopPropagation(); onRemove(areaId, widget.instanceId); }} style={{ padding: '0.2rem', borderRadius: '0.25rem', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', cursor: 'pointer' }}><X size={12} /></button>
          {expanded ? <ChevronUp size={14} style={{ color: '#94a3b8' }} /> : <ChevronDown size={14} style={{ color: '#94a3b8' }} />}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0.875rem', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}>
          <div style={{ marginBottom: '0.625rem' }}>
            <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>Title</label>
            <input
              value={widget.settings?.title || ''}
              onChange={e => onSettingsChange(areaId, widget.instanceId, 'title', e.target.value)}
              style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {widget.type === 'recent-posts' || widget.type === 'recent-comments' ? (
            <div>
              <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>Number of items</label>
              <input type="number" min={1} max={20} value={widget.settings?.count || 5} onChange={e => onSettingsChange(areaId, widget.instanceId, 'count', parseInt(e.target.value))} style={{ width: '80px', padding: '0.4rem 0.5rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.8rem', outline: 'none' }} />
            </div>
          ) : widget.type === 'custom-html' ? (
            <div>
              <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>HTML Content</label>
              <textarea rows={4} value={widget.settings?.html || ''} onChange={e => onSettingsChange(areaId, widget.instanceId, 'html', e.target.value)} style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.75rem', outline: 'none', resize: 'vertical', fontFamily: 'monospace', boxSizing: 'border-box' }} />
            </div>
          ) : widget.type === 'text' ? (
            <div>
              <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>Content</label>
              <textarea rows={4} value={widget.settings?.content || ''} onChange={e => onSettingsChange(areaId, widget.instanceId, 'content', e.target.value)} style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.75rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
          ) : widget.type === 'categories' ? (
            <div>
              <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>Display as</label>
              <select value={widget.settings?.style || 'list'} onChange={e => onSettingsChange(areaId, widget.instanceId, 'style', e.target.value)} style={{ padding: '0.4rem 0.5rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}>
                <option value="list">List</option>
                <option value="dropdown">Dropdown</option>
              </select>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function WidgetsPage() {
  const [widgetAreas, setWidgetAreas] = useState({
    'sidebar': [
      { instanceId: generateId(), type: 'search', settings: { title: 'Search' } },
      { instanceId: generateId(), type: 'recent-posts', settings: { title: 'Recent Posts', count: 5 } },
      { instanceId: generateId(), type: 'categories', settings: { title: 'Categories', style: 'list' } },
    ],
    'footer-1': [
      { instanceId: generateId(), type: 'recent-comments', settings: { title: 'Recent Comments', count: 5 } },
    ],
    'footer-2': [],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const addWidget = (areaId, widgetType) => {
    const baseWidget = AVAILABLE_WIDGETS.find(w => w.id === widgetType);
    if (!baseWidget) return;
    setWidgetAreas(prev => ({
      ...prev,
      [areaId]: [...(prev[areaId] || []), { instanceId: generateId(), type: widgetType, settings: { ...baseWidget.settings } }]
    }));
  };

  const removeWidget = (areaId, instanceId) => {
    setWidgetAreas(prev => ({ ...prev, [areaId]: prev[areaId].filter(w => w.instanceId !== instanceId) }));
  };

  const updateSettings = (areaId, instanceId, key, value) => {
    setWidgetAreas(prev => ({
      ...prev,
      [areaId]: prev[areaId].map(w => w.instanceId === instanceId ? { ...w, settings: { ...w.settings, [key]: value } } : w)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await supabase.from('options').upsert({ name: 'widgets', value: JSON.stringify(widgetAreas) }, { onConflict: 'name' });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.25rem' }}>Widgets</h1>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.875rem' }}>Add and arrange widgets in your widget areas</p>
          </div>
          <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none', background: saved ? 'rgba(34,197,94,0.8)' : 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem', opacity: saving ? 0.7 : 1 }}>
            {saved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}</>}
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
            {error} <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left: Available Widgets */}
          <div style={{ borderRadius: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', color: '#e2e8f0' }}>Available Widgets</h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: '#64748b' }}>Click + to add to an area</p>
            </div>
            <div style={{ padding: '0.75rem' }}>
              {AVAILABLE_WIDGETS.map(widget => {
                const Icon = widget.icon;
                return (
                  <div key={widget.id} style={{ padding: '0.625rem 0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.375rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <Icon size={14} style={{ color: '#a78bfa', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.8rem', fontWeight: '500', color: '#e2e8f0' }}>{widget.name}</span>
                    </div>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.7rem', color: '#64748b' }}>{widget.description}</p>
                    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                      {WIDGET_AREAS.map(area => (
                        <button key={area.id} onClick={() => addWidget(area.id, widget.id)} style={{ padding: '0.2rem 0.5rem', borderRadius: '0.25rem', border: '1px solid rgba(167,139,250,0.3)', background: 'rgba(167,139,250,0.08)', color: '#a78bfa', cursor: 'pointer', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Plus size={10} /> {area.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Widget Areas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {WIDGET_AREAS.map(area => (
              <div key={area.id} onDragOver={(e) => { e.preventDefault(); setDragOver(area.id); }} onDragLeave={() => setDragOver(null)} onDrop={() => setDragOver(null)}
                style={{ borderRadius: '0.75rem', background: 'rgba(255,255,255,0.03)', border: `1px solid ${dragOver === area.id ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.08)'}`, backdropFilter: 'blur(20px)', overflow: 'hidden', transition: 'border-color 0.2s' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', color: '#e2e8f0' }}>{area.name}</h3>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>{area.description}</p>
                  </div>
                  <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
                    {widgetAreas[area.id]?.length || 0} widgets
                  </span>
                </div>

                <div style={{ padding: '1rem 1.25rem', minHeight: '80px' }}>
                  {(!widgetAreas[area.id] || widgetAreas[area.id].length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: '#475569', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '0.5rem' }}>
                      <p style={{ margin: 0, fontSize: '0.8rem' }}>No widgets yet. Add from the left panel.</p>
                    </div>
                  ) : (
                    widgetAreas[area.id].map(widget => (
                      <WidgetInstance
                        key={widget.instanceId}
                        widget={widget}
                        areaId={area.id}
                        onRemove={removeWidget}
                        onSettingsChange={updateSettings}
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
