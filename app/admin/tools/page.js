'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Upload, Download, Database, HardDrive, Shield, Activity,
  Check, X, AlertTriangle, RefreshCw, FileJson, FileText,
  Archive, User, Trash2, Eye, EyeOff, Server, Cpu, Wifi
} from 'lucide-react';



function StatusCard({ label, status, detail, icon: Icon, color }) {
  const colors = {
    good: { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)', text: '#4ade80', dot: '#22c55e' },
    warning: { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)', text: '#fbbf24', dot: '#f59e0b' },
    error: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', text: '#f87171', dot: '#ef4444' },
    unknown: { bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.25)', text: '#94a3b8', dot: '#64748b' },
  };
  const c = colors[color] || colors.unknown;
  return (
    <div style={{ padding: '1.125rem', borderRadius: '0.75rem', background: c.bg, border: `1px solid ${c.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
        <Icon size={18} style={{ color: c.text, flexShrink: 0 }} />
        <span style={{ fontWeight: '600', fontSize: '0.875rem', color: '#e2e8f0' }}>{label}</span>
        <span style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      </div>
      <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', color: c.text, fontWeight: '500' }}>{status}</p>
      {detail && <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>{detail}</p>}
    </div>
  );
}

function SectionCard({ title, description, icon: Icon, children }) {
  return (
    <div style={{ borderRadius: '0.875rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', overflow: 'hidden', marginBottom: '1.5rem' }}>
      <div style={{ padding: '1.125rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Icon size={20} style={{ color: '#a78bfa' }} />
        <div>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', color: '#e2e8f0' }}>{title}</h3>
          {description && <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>{description}</p>}
        </div>
      </div>
      <div style={{ padding: '1.5rem' }}>{children}</div>
    </div>
  );
}

export default function ToolsPage() {
  const [importing, setImporting] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);
  const [healthChecks, setHealthChecks] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [exportingItem, setExportingItem] = useState(null);
  const [privacyEmail, setPrivacyEmail] = useState('');
  const [privacyAction, setPrivacyAction] = useState(null);
  const [error, setError] = useState(null);
  const jsonInputRef = useRef(null);
  const csvInputRef = useRef(null);

  const runHealthCheck = async () => {
    setCheckingHealth(true);
    const checks = {};

    // Database check
    try {
      const start = Date.now();
      const { error: dbErr } = await supabase.from('options').select('count').limit(1);
      const ms = Date.now() - start;
      checks.database = dbErr ? { status: 'Error', detail: dbErr.message, color: 'error' } : { status: 'Connected', detail: `Response: ${ms}ms`, color: 'good' };
    } catch { checks.database = { status: 'Unreachable', detail: 'Cannot connect to Supabase', color: 'error' }; }

    // Storage check
    try {
      const { error: storErr } = await supabase.storage.listBuckets();
      checks.storage = storErr ? { status: 'Error', detail: storErr.message, color: 'error' } : { status: 'Connected', detail: 'Storage bucket accessible', color: 'good' };
    } catch { checks.storage = { status: 'Unreachable', detail: 'Cannot connect to storage', color: 'error' }; }

    // Auth check
    try {
      const { data: { session }, error: authErr } = await supabase.auth.getSession();
      checks.auth = authErr ? { status: 'Error', detail: authErr.message, color: 'error' } : session ? { status: 'Authenticated', detail: `User: ${session.user?.email}`, color: 'good' } : { status: 'No Session', detail: 'Not authenticated', color: 'warning' };
    } catch { checks.auth = { status: 'Error', detail: 'Auth service unavailable', color: 'error' }; }

    // API check
    try {
      const res = await fetch('/api/health').catch(() => null);
      checks.api = res?.ok ? { status: 'Healthy', detail: `Status ${res.status}`, color: 'good' } : { status: 'Not Found', detail: 'API route /api/health not configured', color: 'warning' };
    } catch { checks.api = { status: 'Unavailable', detail: 'API check failed', color: 'warning' }; }

    // Node version (browser cannot access directly, show env)
    checks.nodeVersion = { status: 'Next.js 14', detail: 'Running in browser context', color: 'good' };

    // ENV vars check
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    checks.envVars = hasSupabaseUrl && hasSupabaseKey
      ? { status: 'All set', detail: 'SUPABASE_URL and ANON_KEY present', color: 'good' }
      : { status: 'Missing vars', detail: `Missing: ${!hasSupabaseUrl ? 'SUPABASE_URL ' : ''}${!hasSupabaseKey ? 'ANON_KEY' : ''}`, color: 'error' };

    setHealthChecks(checks);
    setCheckingHealth(false);
  };

  useEffect(() => { runHealthCheck(); }, []);

  const handleJsonImport = async (file, type) => {
    if (!file) return;
    setImporting(type);
    setError(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const items = Array.isArray(data) ? data : data[type] || [];
      if (items.length === 0) throw new Error('No items found in file');

      if (type === 'posts') {
        for (const item of items) {
          await supabase.from('posts').upsert({ title: item.title, content: item.content, slug: item.slug, status: item.status || 'draft', excerpt: item.excerpt || '' }, { onConflict: 'slug' });
        }
      } else if (type === 'pages') {
        for (const item of items) {
          await supabase.from('pages').upsert({ title: item.title, content: item.content, slug: item.slug, status: item.status || 'draft' }, { onConflict: 'slug' });
        }
      }

      setImportSuccess(`Successfully imported ${items.length} ${type}`);
      setTimeout(() => setImportSuccess(null), 3000);
    } catch (err) {
      setError(`Import failed: ${err.message}`);
    } finally {
      setImporting(null);
    }
  };

  const handleCsvImport = async (file) => {
    if (!file) return;
    setImporting('users');
    setError(null);
    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        return Object.fromEntries(headers.map((h, i) => [h, values[i] || '']));
      });

      for (const row of rows) {
        if (row.email) {
          await supabase.from('users').upsert({ email: row.email, name: row.name || row.display_name || '', role: row.role || 'subscriber' }, { onConflict: 'email' });
        }
      }

      setImportSuccess(`Successfully imported ${rows.length} users`);
      setTimeout(() => setImportSuccess(null), 3000);
    } catch (err) {
      setError(`CSV import failed: ${err.message}`);
    } finally {
      setImporting(null);
    }
  };

  const handleExport = async (type) => {
    setExportingItem(type);
    setError(null);
    try {
      let data = [];
      let filename = '';

      if (type === 'posts') {
        const { data: posts } = await supabase.from('posts').select('*');
        data = posts || [];
        filename = 'posts-export.json';
      } else if (type === 'pages') {
        const { data: pages } = await supabase.from('pages').select('*');
        data = pages || [];
        filename = 'pages-export.json';
      } else if (type === 'comments') {
        const { data: comments } = await supabase.from('comments').select('*');
        data = comments || [];
        filename = 'comments-export.json';
      } else if (type === 'all') {
        const [posts, pages, comments, media] = await Promise.all([
          supabase.from('posts').select('*'),
          supabase.from('pages').select('*'),
          supabase.from('comments').select('*'),
          supabase.from('media').select('*'),
        ]);
        data = { posts: posts.data || [], pages: pages.data || [], comments: comments.data || [], media: media.data || [] };
        filename = 'full-export.json';
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Export failed: ${err.message}`);
    } finally {
      setExportingItem(null);
    }
  };

  const handlePrivacyAction = async (action) => {
    if (!privacyEmail.trim()) { setError('Please enter an email address'); return; }
    setPrivacyAction(action);
    setError(null);
    try {
      if (action === 'export') {
        const { data: users } = await supabase.from('users').select('*').eq('email', privacyEmail);
        const { data: comments } = await supabase.from('comments').select('*').eq('author_email', privacyEmail);
        const personalData = { users: users || [], comments: comments || [] };
        const blob = new Blob([JSON.stringify(personalData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `personal-data-${privacyEmail}.json`; a.click();
        URL.revokeObjectURL(url);
      } else if (action === 'erase') {
        if (!confirm(`Permanently erase all data for ${privacyEmail}?`)) return;
        await supabase.from('comments').update({ author_name: '[Deleted]', author_email: '[deleted]', content: '[Content removed]' }).eq('author_email', privacyEmail);
      }
      setPrivacyEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setPrivacyAction(null);
    }
  };

  const HEALTH_ITEMS = [
    { key: 'database', label: 'Database', icon: Database },
    { key: 'storage', label: 'Storage', icon: HardDrive },
    { key: 'auth', label: 'Authentication', icon: Shield },
    { key: 'api', label: 'API Routes', icon: Wifi },
    { key: 'nodeVersion', label: 'Runtime', icon: Cpu },
    { key: 'envVars', label: 'Environment Variables', icon: Server },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.25rem' }}>Tools</h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.875rem' }}>Import, export, and manage your site data</p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
            {error} <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {importSuccess && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Check size={16} />{importSuccess}</span>
            <button onClick={() => setImportSuccess(null)} style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {/* Import */}
        <SectionCard title="Import" description="Import content from JSON or CSV files" icon={Upload}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { type: 'posts', label: 'Import Posts', hint: 'JSON file with posts array', icon: FileJson, ref: jsonInputRef, accept: '.json', handler: (f) => handleJsonImport(f, 'posts') },
              { type: 'pages', label: 'Import Pages', hint: 'JSON file with pages array', icon: FileJson, ref: null, accept: '.json', handler: (f) => handleJsonImport(f, 'pages') },
            ].map(item => {
              const ref = useRef(null);
              return (
                <div key={item.type} style={{ padding: '1.125rem', borderRadius: '0.625rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <item.icon size={18} style={{ color: '#60a5fa' }} />
                    <span style={{ fontWeight: '600', fontSize: '0.875rem', color: '#e2e8f0' }}>{item.label}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>{item.hint}</p>
                  <input ref={ref} type="file" accept={item.accept} style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) { item.handler(e.target.files[0]); e.target.value = ''; } }} />
                  <button onClick={() => ref.current?.click()} disabled={importing === item.type} style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', border: '1px solid rgba(96,165,250,0.3)', background: 'rgba(96,165,250,0.08)', color: '#60a5fa', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', opacity: importing === item.type ? 0.7 : 1 }}>
                    <Upload size={14} /> {importing === item.type ? 'Importing...' : 'Choose File'}
                  </button>
                </div>
              );
            })}

            <div style={{ padding: '1.125rem', borderRadius: '0.625rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} style={{ color: '#a78bfa' }} />
                <span style={{ fontWeight: '600', fontSize: '0.875rem', color: '#e2e8f0' }}>Import Users</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>CSV with columns: name, email, role</p>
              <input ref={csvInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) { handleCsvImport(e.target.files[0]); e.target.value = ''; } }} />
              <button onClick={() => csvInputRef.current?.click()} disabled={importing === 'users'} style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', border: '1px solid rgba(167,139,250,0.3)', background: 'rgba(167,139,250,0.08)', color: '#a78bfa', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', opacity: importing === 'users' ? 0.7 : 1 }}>
                <Upload size={14} /> {importing === 'users' ? 'Importing...' : 'Choose CSV'}
              </button>
            </div>
          </div>
        </SectionCard>

        {/* Export */}
        <SectionCard title="Export" description="Download your site content as JSON files" icon={Download}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {[
              { type: 'posts', label: 'Export Posts', icon: FileJson, color: '#60a5fa' },
              { type: 'pages', label: 'Export Pages', icon: FileJson, color: '#34d399' },
              { type: 'comments', label: 'Export Comments', icon: FileText, color: '#fbbf24' },
              { type: 'all', label: 'Export All Content', icon: Archive, color: '#f87171' },
            ].map(item => (
              <button key={item.type} onClick={() => handleExport(item.type)} disabled={exportingItem === item.type} style={{ padding: '0.875rem 1rem', borderRadius: '0.625rem', border: `1px solid ${item.color}30`, background: `${item.color}08`, color: item.color, cursor: exportingItem === item.type ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.625rem', transition: 'all 0.15s', opacity: exportingItem === item.type ? 0.7 : 1 }}>
                {exportingItem === item.type ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <item.icon size={16} />}
                {exportingItem === item.type ? 'Exporting...' : item.label}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Site Health */}
        <SectionCard title="Site Health" description="Check the status of your site's systems" icon={Activity}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={runHealthCheck} disabled={checkingHealth} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: checkingHealth ? 'not-allowed' : 'pointer', fontSize: '0.8rem', opacity: checkingHealth ? 0.7 : 1 }}>
              <RefreshCw size={14} style={{ animation: checkingHealth ? 'spin 1s linear infinite' : 'none' }} />
              {checkingHealth ? 'Checking...' : 'Re-check'}
            </button>
          </div>
          {!healthChecks ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ height: '80px', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.04)' }} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {HEALTH_ITEMS.map(item => (
                <StatusCard
                  key={item.key}
                  label={item.label}
                  status={healthChecks[item.key]?.status || '...'}
                  detail={healthChecks[item.key]?.detail}
                  icon={item.icon}
                  color={healthChecks[item.key]?.color || 'unknown'}
                />
              ))}
            </div>
          )}
        </SectionCard>

        {/* Privacy */}
        <SectionCard title="Privacy" description="Export or erase personal data for a user" icon={Shield}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.375rem' }}>User Email Address</label>
            <div style={{ display: 'flex', gap: '0.625rem', maxWidth: '480px' }}>
              <input type="email" value={privacyEmail} onChange={e => setPrivacyEmail(e.target.value)} placeholder="user@example.com" style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
            <div style={{ padding: '1.125rem', borderRadius: '0.625rem', background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)', flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Download size={16} style={{ color: '#60a5fa' }} />
                <span style={{ fontWeight: '600', fontSize: '0.875rem', color: '#e2e8f0' }}>Export Personal Data</span>
              </div>
              <p style={{ margin: '0 0 0.875rem', fontSize: '0.75rem', color: '#64748b' }}>Download all data associated with this user email.</p>
              <button onClick={() => handlePrivacyAction('export')} disabled={!!privacyAction} style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: 'none', background: 'rgba(96,165,250,0.15)', color: '#60a5fa', cursor: 'pointer', fontSize: '0.8rem', opacity: privacyAction ? 0.7 : 1 }}>
                {privacyAction === 'export' ? 'Exporting...' : 'Send Request'}
              </button>
            </div>
            <div style={{ padding: '1.125rem', borderRadius: '0.625rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Trash2 size={16} style={{ color: '#f87171' }} />
                <span style={{ fontWeight: '600', fontSize: '0.875rem', color: '#e2e8f0' }}>Erase Personal Data</span>
              </div>
              <p style={{ margin: '0 0 0.875rem', fontSize: '0.75rem', color: '#64748b' }}>Remove all personal data for this user. This cannot be undone.</p>
              <button onClick={() => handlePrivacyAction('erase')} disabled={!!privacyAction} style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: 'none', background: 'rgba(239,68,68,0.15)', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem', opacity: privacyAction ? 0.7 : 1 }}>
                {privacyAction === 'erase' ? 'Erasing...' : 'Erase Data'}
              </button>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
