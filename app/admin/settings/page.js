'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, Check, X, Globe, BookOpen, Edit3, MessageSquare, Link, Lock } from 'lucide-react';



const TABS = [
  { id: 'general', label: 'General', icon: Globe },
  { id: 'reading', label: 'Reading', icon: BookOpen },
  { id: 'writing', label: 'Writing', icon: Edit3 },
  { id: 'discussion', label: 'Discussion', icon: MessageSquare },
  { id: 'permalinks', label: 'Permalinks', icon: Link },
  { id: 'privacy', label: 'Privacy', icon: Lock },
];

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
  'Australia/Sydney', 'Pacific/Auckland',
];

const DATE_FORMATS = [
  { value: 'F j, Y', label: 'March 13, 2026' },
  { value: 'm/d/Y', label: '03/13/2026' },
  { value: 'd/m/Y', label: '13/03/2026' },
  { value: 'Y-m-d', label: '2026-03-13' },
];

const TIME_FORMATS = [
  { value: 'g:i a', label: '1:30 pm' },
  { value: 'g:i A', label: '1:30 PM' },
  { value: 'H:i', label: '13:30' },
];

const DEFAULT_SETTINGS = {
  siteTitle: 'My CMS Site',
  tagline: 'Just another CMS',
  siteUrl: 'http://localhost:3000',
  adminEmail: 'admin@example.com',
  membershipEnabled: false,
  defaultRole: 'subscriber',
  timezone: 'UTC',
  dateFormat: 'F j, Y',
  timeFormat: 'g:i a',
  postsOnFront: 'posts',
  staticFrontPage: '',
  postsPerPage: 10,
  searchEngineVisibility: true,
  defaultCategory: 'Uncategorized',
  defaultPostFormat: 'standard',
  allowComments: true,
  allowPings: true,
  closeCommentsAfter: false,
  closeCommentsDays: 14,
  requireNameEmail: true,
  requireApproval: false,
  avatarRating: 'G',
  permalinkStructure: 'postname',
  customPermalink: '/posts/%postname%/',
  privacyPage: '',
};

function SettingsSection({ title, children }) {
  return (
    <div style={{ borderRadius: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', overflow: 'hidden', marginBottom: '1.25rem' }}>
      {title && <div style={{ padding: '0.875rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}><h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: '#e2e8f0' }}>{title}</h3></div>}
      <div style={{ padding: '1.25rem 1.5rem' }}>{children}</div>
    </div>
  );
}

function Field({ label, description, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1rem', alignItems: 'flex-start', paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div>
        <label style={{ fontSize: '0.875rem', color: '#e2e8f0', fontWeight: '500', display: 'block' }}>{label}</label>
        {description && <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: '#64748b', lineHeight: '1.5' }}>{description}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' };
const selectStyle = { padding: '0.5rem 0.75rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' };

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await supabase.from('options').select('name, value').in('name', Object.keys(DEFAULT_SETTINGS));
        if (data) {
          const loaded = { ...DEFAULT_SETTINGS };
          data.forEach(item => {
            if (item.name in loaded) {
              const val = item.value;
              if (val === 'true') loaded[item.name] = true;
              else if (val === 'false') loaded[item.name] = false;
              else if (!isNaN(val) && typeof DEFAULT_SETTINGS[item.name] === 'number') loaded[item.name] = Number(val);
              else loaded[item.name] = val;
            }
          });
          setSettings(loaded);
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const update = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const upserts = Object.entries(settings).map(([name, value]) => ({ name, value: String(value) }));
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

  const renderTab = () => {
    if (loading) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ height: '60px', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.04)' }} />)}
      </div>
    );

    switch (activeTab) {
      case 'general':
        return (
          <>
            <SettingsSection>
              <Field label="Site Title"><input value={settings.siteTitle} onChange={e => update('siteTitle', e.target.value)} style={inputStyle} /></Field>
              <Field label="Tagline" description="In a few words, explain what this site is about."><input value={settings.tagline} onChange={e => update('tagline', e.target.value)} style={inputStyle} /></Field>
              <Field label="WordPress Address (URL)" description="Enter the full URL here."><input value={settings.siteUrl} onChange={e => update('siteUrl', e.target.value)} style={inputStyle} /></Field>
              <Field label="Site Address (URL)" description="Enter the address to reach your site."><input value={settings.siteUrl} onChange={e => update('siteUrl', e.target.value)} style={inputStyle} /></Field>
              <Field label="Administration Email Address" description="This address is used for admin purposes."><input type="email" value={settings.adminEmail} onChange={e => update('adminEmail', e.target.value)} style={inputStyle} /></Field>
            </SettingsSection>
            <SettingsSection title="Membership">
              <Field label="Membership">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings.membershipEnabled} onChange={e => update('membershipEnabled', e.target.checked)} style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>Anyone can register</span>
                </label>
              </Field>
              <Field label="New User Default Role">
                <select value={settings.defaultRole} onChange={e => update('defaultRole', e.target.value)} style={selectStyle}>
                  {['subscriber', 'contributor', 'author', 'editor', 'administrator'].map(r => (
                    <option key={r} value={r} style={{ background: '#1a1a2e', textTransform: 'capitalize' }}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </Field>
            </SettingsSection>
            <SettingsSection title="Localization">
              <Field label="Timezone">
                <select value={settings.timezone} onChange={e => update('timezone', e.target.value)} style={{ ...selectStyle, minWidth: '200px' }}>
                  {TIMEZONES.map(tz => <option key={tz} value={tz} style={{ background: '#1a1a2e' }}>{tz}</option>)}
                </select>
              </Field>
              <Field label="Date Format">
                {DATE_FORMATS.map(fmt => (
                  <label key={fmt.value} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
                    <input type="radio" name="dateFormat" value={fmt.value} checked={settings.dateFormat === fmt.value} onChange={() => update('dateFormat', fmt.value)} />
                    <span style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>{fmt.label}</span>
                  </label>
                ))}
              </Field>
              <Field label="Time Format">
                {TIME_FORMATS.map(fmt => (
                  <label key={fmt.value} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
                    <input type="radio" name="timeFormat" value={fmt.value} checked={settings.timeFormat === fmt.value} onChange={() => update('timeFormat', fmt.value)} />
                    <span style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>{fmt.label}</span>
                  </label>
                ))}
              </Field>
            </SettingsSection>
          </>
        );

      case 'reading':
        return (
          <SettingsSection>
            <Field label="Your homepage displays">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.625rem' }}>
                <input type="radio" name="postsOnFront" value="posts" checked={settings.postsOnFront === 'posts'} onChange={() => update('postsOnFront', 'posts')} />
                <span style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>Your latest posts</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="postsOnFront" value="page" checked={settings.postsOnFront === 'page'} onChange={() => update('postsOnFront', 'page')} />
                <span style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>A static page</span>
              </label>
            </Field>
            <Field label="Blog pages show at most">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="number" min={1} max={100} value={settings.postsPerPage} onChange={e => update('postsPerPage', parseInt(e.target.value))} style={{ ...inputStyle, width: '80px' }} />
                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>posts</span>
              </div>
            </Field>
            <Field label="Search Engine Visibility">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={settings.searchEngineVisibility} onChange={e => update('searchEngineVisibility', e.target.checked)} style={{ width: '16px', height: '16px' }} />
                <span style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>Discourage search engines from indexing this site</span>
              </label>
              <p style={{ margin: '0.375rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>It is up to search engines to honor this request.</p>
            </Field>
          </SettingsSection>
        );

      case 'writing':
        return (
          <SettingsSection>
            <Field label="Default Post Category">
              <select value={settings.defaultCategory} onChange={e => update('defaultCategory', e.target.value)} style={selectStyle}>
                {['Uncategorized', 'Technology', 'Design', 'Business', 'Lifestyle'].map(c => (
                  <option key={c} value={c} style={{ background: '#1a1a2e' }}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Default Post Format">
              <select value={settings.defaultPostFormat} onChange={e => update('defaultPostFormat', e.target.value)} style={selectStyle}>
                {['standard', 'aside', 'gallery', 'link', 'image', 'quote', 'status', 'video', 'audio', 'chat'].map(f => (
                  <option key={f} value={f} style={{ background: '#1a1a2e', textTransform: 'capitalize' }}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                ))}
              </select>
            </Field>
          </SettingsSection>
        );

      case 'discussion':
        return (
          <>
            <SettingsSection title="Default Post Settings">
              {[
                ['allowComments', 'Allow people to submit comments on new posts'],
                ['allowPings', 'Allow link notifications from other blogs (pingbacks and trackbacks)'],
              ].map(([key, label]) => (
                <Field key={key} label="">
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={settings[key]} onChange={e => update(key, e.target.checked)} style={{ marginTop: '2px' }} />
                    <span style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>{label}</span>
                  </label>
                </Field>
              ))}
              <Field label="Close comments">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
                  <input type="checkbox" checked={settings.closeCommentsAfter} onChange={e => update('closeCommentsAfter', e.target.checked)} />
                  <span style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>Automatically close comments after</span>
                  <input type="number" value={settings.closeCommentsDays} onChange={e => update('closeCommentsDays', parseInt(e.target.value))} disabled={!settings.closeCommentsAfter} style={{ ...inputStyle, width: '70px', opacity: settings.closeCommentsAfter ? 1 : 0.5 }} />
                  <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>days</span>
                </label>
              </Field>
            </SettingsSection>
            <SettingsSection title="Comment Moderation">
              <Field label="Comment author must">
                {[
                  ['requireNameEmail', 'Fill out name and email'],
                  ['requireApproval', 'Have a previously approved comment'],
                ].map(([key, label]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
                    <input type="checkbox" checked={settings[key]} onChange={e => update(key, e.target.checked)} />
                    <span style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>{label}</span>
                  </label>
                ))}
              </Field>
            </SettingsSection>
            <SettingsSection title="Avatars">
              <Field label="Avatar Maximum Rating">
                <select value={settings.avatarRating} onChange={e => update('avatarRating', e.target.value)} style={selectStyle}>
                  {['G', 'PG', 'R', 'X'].map(r => <option key={r} value={r} style={{ background: '#1a1a2e' }}>{r} – {r === 'G' ? 'Suitable for all audiences' : r === 'PG' ? 'Possibly offensive' : r === 'R' ? 'Adult content' : 'Explicit content'}</option>)}
                </select>
              </Field>
            </SettingsSection>
          </>
        );

      case 'permalinks':
        return (
          <SettingsSection title="Common Settings">
            {[
              { value: 'plain', label: 'Plain', example: '/?p=123' },
              { value: 'day', label: 'Day and name', example: '/2026/03/13/sample-post/' },
              { value: 'month', label: 'Month and name', example: '/2026/03/sample-post/' },
              { value: 'numeric', label: 'Numeric', example: '/archives/123' },
              { value: 'postname', label: 'Post name', example: '/sample-post/' },
              { value: 'custom', label: 'Custom Structure', example: '' },
            ].map(opt => (
              <div key={opt.value} style={{ marginBottom: '0.875rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input type="radio" name="permalinkStructure" value={opt.value} checked={settings.permalinkStructure === opt.value} onChange={() => update('permalinkStructure', opt.value)} />
                  <div>
                    <span style={{ fontSize: '0.875rem', color: '#e2e8f0', fontWeight: '500' }}>{opt.label}</span>
                    {opt.example && <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>{opt.example}</p>}
                  </div>
                </label>
                {opt.value === 'custom' && settings.permalinkStructure === 'custom' && (
                  <div style={{ marginLeft: '1.75rem', marginTop: '0.5rem' }}>
                    <input value={settings.customPermalink} onChange={e => update('customPermalink', e.target.value)} placeholder="/posts/%postname%/" style={{ ...inputStyle, fontFamily: 'monospace' }} />
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: '#64748b' }}>Available tags: %year%, %monthnum%, %day%, %postname%, %post_id%</p>
                  </div>
                )}
              </div>
            ))}
          </SettingsSection>
        );

      case 'privacy':
        return (
          <SettingsSection>
            <Field label="Privacy Policy Page" description="Select a page to use as your Privacy Policy. A link will be shown in the footer.">
              <select value={settings.privacyPage} onChange={e => update('privacyPage', e.target.value)} style={{ ...selectStyle, minWidth: '240px' }}>
                <option value="" style={{ background: '#1a1a2e' }}>— Select —</option>
                {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(p => (
                  <option key={p} value={p} style={{ background: '#1a1a2e' }}>{p}</option>
                ))}
              </select>
            </Field>
          </SettingsSection>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.25rem' }}>Settings</h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.875rem' }}>Configure your site settings</p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            {error} <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {/* Tab navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.25rem' }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.625rem 1rem', border: 'none', borderBottom: `2px solid ${activeTab === tab.id ? '#a78bfa' : 'transparent'}`, background: 'transparent', color: activeTab === tab.id ? '#a78bfa' : '#64748b', cursor: 'pointer', fontSize: '0.875rem', fontWeight: activeTab === tab.id ? '600' : '400', marginBottom: '-1px' }}>
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>

        {renderTab()}

        {/* Save Button */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.5rem', borderRadius: '0.5rem', border: 'none', background: saved ? 'rgba(34,197,94,0.8)' : 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', opacity: saving ? 0.7 : 1 }}>
            {saved ? <><Check size={16} /> Settings Saved!</> : <><Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
