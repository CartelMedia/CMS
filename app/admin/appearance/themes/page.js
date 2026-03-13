'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, Palette, User, Tag, Info } from 'lucide-react';



const SAMPLE_THEMES = [
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'A vibrant theme with deep purple and blue gradients, perfect for creative portfolios and modern blogs.',
    version: '2.1.0',
    author: 'ThemeForge Studio',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    accentColor: '#764ba2',
    tags: ['Dark', 'Modern', 'Portfolio'],
  },
  {
    id: 'ocean',
    name: 'Ocean Breeze',
    description: 'Clean teal and cyan tones inspired by the ocean. Ideal for business and professional sites.',
    version: '1.8.2',
    author: 'CoastalDesigns',
    gradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    accentColor: '#2c5364',
    tags: ['Business', 'Clean', 'Professional'],
  },
  {
    id: 'sunset',
    name: 'Sunset Glow',
    description: 'Warm oranges and pinks that evoke a beautiful sunset. Great for lifestyle and food blogs.',
    version: '3.0.1',
    author: 'WarmPalette Co.',
    gradient: 'linear-gradient(135deg, #f7971e 0%, #ffd200 50%, #f64f59 100%)',
    accentColor: '#f64f59',
    tags: ['Warm', 'Lifestyle', 'Blog'],
  },
  {
    id: 'midnight',
    name: 'Midnight Dark',
    description: 'Sleek and minimal dark theme with subtle accents. Perfect for tech blogs and developer portfolios.',
    version: '4.2.0',
    author: 'DarkMode Labs',
    gradient: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
    accentColor: '#a78bfa',
    tags: ['Dark', 'Minimal', 'Tech'],
  },
  {
    id: 'nature',
    name: 'Nature Fresh',
    description: 'Lush greens and earth tones for an organic feel. Ideal for environmental and wellness brands.',
    version: '1.5.3',
    author: 'GreenThemes',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 50%, #1a7a4a 100%)',
    accentColor: '#11998e',
    tags: ['Green', 'Nature', 'Wellness'],
  },
];

export default function ThemesPage() {
  const [activeTheme, setActiveTheme] = useState('midnight');
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(null);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [expandedTheme, setExpandedTheme] = useState(null);

  useEffect(() => {
    const fetchActiveTheme = async () => {
      try {
        const { data } = await supabase.from('options').select('value').eq('name', 'active_theme').single();
        if (data?.value) setActiveTheme(data.value);
      } catch (err) {
        // ignore, use default
      } finally {
        setLoading(false);
      }
    };
    fetchActiveTheme();
  }, []);

  const handleActivate = async (themeId) => {
    setActivating(themeId);
    setError(null);
    setSuccess(null);
    try {
      const { error: err } = await supabase.from('options').upsert({ name: 'active_theme', value: themeId }, { onConflict: 'name' });
      if (err) throw err;
      setActiveTheme(themeId);
      setSuccess(`Theme "${SAMPLE_THEMES.find(t => t.id === themeId)?.name}" activated successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActivating(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.25rem' }}>Themes</h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.875rem' }}>Choose and manage your site&apos;s appearance</p>
        </div>

        {success && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
            {success} <button onClick={() => setSuccess(null)} style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
            {error} <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {/* Active Theme Banner */}
        {!loading && (
          <div style={{ padding: '1rem 1.5rem', borderRadius: '0.75rem', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', background: SAMPLE_THEMES.find(t => t.id === activeTheme)?.gradient || '' }} />
            <div>
              <p style={{ margin: 0, fontWeight: '600', color: '#e2e8f0', fontSize: '0.875rem' }}>Active Theme: <span style={{ color: '#a78bfa' }}>{SAMPLE_THEMES.find(t => t.id === activeTheme)?.name}</span></p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>v{SAMPLE_THEMES.find(t => t.id === activeTheme)?.version} by {SAMPLE_THEMES.find(t => t.id === activeTheme)?.author}</p>
            </div>
          </div>
        )}

        {/* Theme Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {SAMPLE_THEMES.map(theme => {
            const isActive = activeTheme === theme.id;
            const isActivating = activating === theme.id;
            const isExpanded = expandedTheme === theme.id;

            return (
              <div key={theme.id} style={{ borderRadius: '1rem', background: 'rgba(255,255,255,0.03)', border: `2px solid ${isActive ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, backdropFilter: 'blur(20px)', overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s', boxShadow: isActive ? '0 0 30px rgba(167,139,250,0.15)' : 'none' }}>
                {/* Theme Screenshot */}
                <div style={{ position: 'relative', height: '180px', background: theme.gradient, overflow: 'hidden' }}>
                  {/* Fake UI elements in preview */}
                  <div style={{ position: 'absolute', inset: 0, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ height: '24px', background: 'rgba(255,255,255,0.15)', borderRadius: '4px', width: '40%' }} />
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', width: '70%' }} />
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', width: '55%' }} />
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <div style={{ height: '60px', flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: '6px' }} />
                      <div style={{ height: '60px', flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: '6px' }} />
                      <div style={{ height: '60px', flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: '6px' }} />
                    </div>
                  </div>

                  {isActive && (
                    <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.75rem', borderRadius: '9999px', background: '#a78bfa', color: '#fff', fontSize: '0.7rem', fontWeight: '700' }}>
                      <Check size={11} /> Active
                    </div>
                  )}
                </div>

                {/* Theme Info */}
                <div style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#e2e8f0' }}>{theme.name}</h3>
                    <button onClick={() => setExpandedTheme(isExpanded ? null : theme.id)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '0.375rem', padding: '0.25rem', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                      <Info size={15} />
                    </button>
                  </div>

                  {/* Tags */}
                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.875rem' }}>
                    {theme.tags.map(tag => (
                      <span key={tag} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>{tag}</span>
                    ))}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{ marginBottom: '1rem', padding: '0.875rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.6' }}>{theme.description}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                          <Tag size={12} /> Version {theme.version}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                          <User size={12} /> {theme.author}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '0.625rem' }}>
                    {isActive ? (
                      <button disabled style={{ flex: 1, padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(167,139,250,0.3)', background: 'rgba(167,139,250,0.1)', color: '#a78bfa', fontSize: '0.8rem', fontWeight: '600', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                        <Check size={14} /> Currently Active
                      </button>
                    ) : (
                      <button onClick={() => handleActivate(theme.id)} disabled={isActivating} style={{ flex: 1, padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', background: isActivating ? 'rgba(167,139,250,0.3)' : 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: '#fff', fontSize: '0.8rem', fontWeight: '600', cursor: isActivating ? 'not-allowed' : 'pointer' }}>
                        {isActivating ? 'Activating...' : 'Activate'}
                      </button>
                    )}
                    <button style={{ padding: '0.5rem 0.875rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <Palette size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
