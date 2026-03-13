'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Type, Palette, Image, Code, ChevronRight, ChevronLeft,
  Save, Check, X, RefreshCw, Monitor, Smartphone, Tablet,
  Eye, EyeOff, Upload
} from 'lucide-react';



const DEFAULT_SETTINGS = {
  siteTitle: 'My CMS Site',
  tagline: 'Just another CMS site',
  logoUrl: '',
  accentColor: '#a78bfa',
  backgroundColor: '#0f0f1a',
  headerImage: '',
  additionalCss: '',
};

const SECTIONS = [
  { id: 'identity', label: 'Site Identity', icon: Type, description: 'Title, tagline, and logo' },
  { id: 'colors', label: 'Colors', icon: Palette, description: 'Accent and background colors' },
  { id: 'header', label: 'Header', icon: Image, description: 'Header image and layout' },
  { id: 'css', label: 'Additional CSS', icon: Code, description: 'Custom CSS code' },
];

function ColorInput({ label, value, onChange, hint }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.375rem', fontWeight: '500' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <div style={{ position: 'relative' }}>
          <input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ width: '40px', height: '40px', borderRadius: '0.5rem', border: '2px solid rgba(255,255,255,0.1)', background: 'transparent', cursor: 'pointer', padding: '2px' }} />
        </div>
        <input value={value} onChange={e => onChange(e.target.value)} style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.8rem', outline: 'none', fontFamily: 'monospace' }} />
      </div>
      {hint && <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: '#64748b' }}>{hint}</p>}
    </div>
  );
}

export default function CustomizerPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [activeSection, setActiveSection] = useState('identity');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [previewVisible, setPreviewVisible] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await supabase.from('options').select('name, value').in('name', Object.keys(DEFAULT_SETTINGS));
        if (data) {
          const loadedSettings = { ...DEFAULT_SETTINGS };
          data.forEach(item => { if (item.name in loadedSettings) loadedSettings[item.name] = item.value; });
          setSettings(loadedSettings);
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handlePublish = async () => {
    setSaving(true);
    setError(null);
    try {
      const upserts = Object.entries(settings).map(([name, value]) => ({ name, value }));
      const { error: err } = await supabase.from('options').upsert(upserts, { onConflict: 'name' });
      if (err) throw err;
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const refreshPreview = () => setIframeKey(k => k + 1);

  const deviceSizes = { desktop: '100%', tablet: '768px', mobile: '375px' };

  const renderSection = () => {
    switch (activeSection) {
      case 'identity':
        return (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.375rem', fontWeight: '500' }}>Site Title</label>
              <input value={settings.siteTitle} onChange={e => updateSetting('siteTitle', e.target.value)} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.375rem', fontWeight: '500' }}>Tagline</label>
              <input value={settings.tagline} onChange={e => updateSetting('tagline', e.target.value)} placeholder="Just another CMS site" style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.375rem', fontWeight: '500' }}>Logo URL</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input value={settings.logoUrl} onChange={e => updateSetting('logoUrl', e.target.value)} placeholder="https://..." style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none' }} />
                <button style={{ padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem' }}>
                  <Upload size={13} /> Upload
                </button>
              </div>
              {settings.logoUrl && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                  <img src={settings.logoUrl} alt="Logo preview" style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
                </div>
              )}
            </div>
          </div>
        );

      case 'colors':
        return (
          <div>
            <ColorInput label="Accent Color" value={settings.accentColor} onChange={v => updateSetting('accentColor', v)} hint="Used for buttons, links, and highlights" />
            <ColorInput label="Background Color" value={settings.backgroundColor} onChange={v => updateSetting('backgroundColor', v)} hint="Main background color of the site" />
            <div style={{ padding: '1rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginTop: '0.5rem' }}>
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500' }}>Color Preview</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ flex: 1, height: '40px', borderRadius: '0.375rem', background: settings.backgroundColor, border: '1px solid rgba(255,255,255,0.08)' }} />
                <div style={{ flex: 1, height: '40px', borderRadius: '0.375rem', background: settings.accentColor }} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Background</span>
                <span style={{ fontSize: '0.65rem', color: '#64748b', marginLeft: 'auto' }}>Accent</span>
              </div>
            </div>
          </div>
        );

      case 'header':
        return (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.375rem', fontWeight: '500' }}>Header Image URL</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input value={settings.headerImage} onChange={e => updateSetting('headerImage', e.target.value)} placeholder="https://..." style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none' }} />
                <button style={{ padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem' }}>
                  <Upload size={13} /> Browse
                </button>
              </div>
              {settings.headerImage ? (
                <div style={{ borderRadius: '0.5rem', overflow: 'hidden', aspectRatio: '16/4', background: 'rgba(255,255,255,0.04)' }}>
                  <img src={settings.headerImage} alt="Header" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                </div>
              ) : (
                <div style={{ borderRadius: '0.5rem', aspectRatio: '16/4', background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                  <Image size={24} style={{ opacity: 0.3 }} />
                </div>
              )}
            </div>
          </div>
        );

      case 'css':
        return (
          <div>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.375rem', fontWeight: '500' }}>Additional CSS</label>
            <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '0 0 0.625rem' }}>Add custom CSS that will be applied to the front end of your site.</p>
            <textarea
              value={settings.additionalCss}
              onChange={e => updateSetting('additionalCss', e.target.value)}
              placeholder={`/* Add your custom CSS here */\n\n.site-title {\n  font-size: 2rem;\n}`}
              rows={16}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#a5f3fc', fontSize: '0.75rem', outline: 'none', resize: 'vertical', fontFamily: '"Fira Code", "Cascadia Code", monospace', lineHeight: '1.6', boxSizing: 'border-box' }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <div style={{ height: '52px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontWeight: '700', fontSize: '0.9rem', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Customizer</span>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Customize your site in real-time</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {/* Device toggles */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
            {[['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]].map(([device, Icon]) => (
              <button key={device} onClick={() => setPreviewDevice(device)} style={{ padding: '0.35rem 0.6rem', border: 'none', background: previewDevice === device ? 'rgba(167,139,250,0.25)' : 'transparent', color: previewDevice === device ? '#a78bfa' : '#64748b', cursor: 'pointer' }}>
                <Icon size={15} />
              </button>
            ))}
          </div>
          <button onClick={refreshPreview} style={{ padding: '0.35rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', cursor: 'pointer' }}><RefreshCw size={14} /></button>
          <button onClick={() => setPreviewVisible(!previewVisible)} style={{ padding: '0.35rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', cursor: 'pointer' }}>
            {previewVisible ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          {error && <span style={{ fontSize: '0.7rem', color: '#fca5a5' }}>{error}</span>}
          <button onClick={handlePublish} disabled={saving} style={{ padding: '0.4rem 1rem', borderRadius: '0.375rem', border: 'none', background: saved ? 'rgba(34,197,94,0.8)' : 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.375rem', opacity: saving ? 0.7 : 1 }}>
            {saved ? <><Check size={14} /> Published!</> : <><Save size={14} /> {saving ? 'Publishing...' : 'Publish'}</>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Panel */}
        <div style={{ width: '320px', flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {activeSection ? (
            <>
              <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button onClick={() => setActiveSection(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '0.375rem', padding: '0.3rem', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                  <ChevronLeft size={16} />
                </button>
                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', color: '#e2e8f0' }}>
                  {SECTIONS.find(s => s.id === activeSection)?.label}
                </h3>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {Array.from({ length: 3 }).map((_, i) => <div key={i} style={{ height: '60px', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.04)' }} />)}
                  </div>
                ) : renderSection()}
              </div>
            </>
          ) : (
            <>
              <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', color: '#e2e8f0' }}>Customizing:</h3>
                <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>{settings.siteTitle}</p>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
                {SECTIONS.map(section => {
                  const Icon = section.icon;
                  return (
                    <button key={section.id} onClick={() => setActiveSection(section.id)} style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.375rem', textAlign: 'left', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                      <Icon size={18} style={{ color: '#a78bfa', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#e2e8f0', fontWeight: '500' }}>{section.label}</p>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>{section.description}</p>
                      </div>
                      <ChevronRight size={14} style={{ color: '#475569' }} />
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Right: Preview */}
        {previewVisible && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem', background: '#0a0a12', overflow: 'auto', gap: '1rem' }}>
            <div style={{ width: deviceSizes[previewDevice], maxWidth: '100%', transition: 'width 0.3s', flex: '0 0 auto' }}>
              <div style={{ borderRadius: previewDevice === 'desktop' ? '0.5rem' : '1rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', background: '#fff' }}>
                {/* Browser chrome */}
                <div style={{ height: '32px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', padding: '0 0.75rem', gap: '0.375rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', opacity: 0.7 }} />
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', opacity: 0.7 }} />
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', opacity: 0.7 }} />
                  <div style={{ flex: 1, height: '16px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', marginLeft: '0.5rem' }} />
                </div>
                <iframe key={iframeKey} src="/" title="Site Preview" style={{ width: '100%', height: previewDevice === 'mobile' ? '667px' : '600px', border: 'none', display: 'block' }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
