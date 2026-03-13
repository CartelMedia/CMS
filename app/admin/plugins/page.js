'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Search, Settings, Trash2, X, Check, ExternalLink,
  Shield, BarChart3, ShoppingBag, Mail, HardDrive, Zap
} from 'lucide-react';



const SAMPLE_PLUGINS = [
  {
    id: 'seo-optimizer',
    name: 'SEO Optimizer Pro',
    description: 'Improve your search engine rankings with advanced meta tags, sitemaps, schema markup, and real-time SEO analysis for every post and page.',
    version: '3.8.2',
    author: 'SEOForge Team',
    authorUrl: 'https://seoforge.example.com',
    icon: Search,
    iconColor: '#60a5fa',
    tags: ['SEO', 'Marketing'],
    active: true,
  },
  {
    id: 'contact-form',
    name: 'Contact Form Builder',
    description: 'Build beautiful, responsive contact forms with drag-and-drop ease. Includes spam protection, email notifications, and form analytics.',
    version: '2.4.1',
    author: 'FormCraft',
    authorUrl: 'https://formcraft.example.com',
    icon: Mail,
    iconColor: '#a78bfa',
    tags: ['Forms', 'Email'],
    active: true,
  },
  {
    id: 'woo-store',
    name: 'Easy Store',
    description: 'Full-featured e-commerce solution. Sell products, manage inventory, process payments, and track orders — all from your CMS dashboard.',
    version: '5.2.0',
    author: 'StorePlugins Inc.',
    authorUrl: 'https://storeplugins.example.com',
    icon: ShoppingBag,
    iconColor: '#f59e0b',
    tags: ['E-commerce', 'Payments'],
    active: false,
  },
  {
    id: 'backup-manager',
    name: 'Backup Manager',
    description: 'Automated daily backups to cloud storage. One-click restore, migration tools, and backup scheduling keep your data safe and accessible.',
    version: '1.9.5',
    author: 'SafeGuard Labs',
    authorUrl: 'https://safeguard.example.com',
    icon: HardDrive,
    iconColor: '#34d399',
    tags: ['Backup', 'Storage'],
    active: false,
  },
  {
    id: 'security-scanner',
    name: 'Security Scanner',
    description: 'Protect your site with malware scanning, login protection, firewall rules, and real-time threat monitoring. Stay one step ahead of attackers.',
    version: '4.1.0',
    author: 'SecureWP',
    authorUrl: 'https://securewp.example.com',
    icon: Shield,
    iconColor: '#fb7185',
    tags: ['Security', 'Firewall'],
    active: true,
  },
  {
    id: 'analytics-dashboard',
    name: 'Analytics Dashboard',
    description: 'Comprehensive visitor analytics with real-time stats, traffic sources, conversion tracking, and customizable reports — all without leaving your CMS.',
    version: '2.7.3',
    author: 'DataPulse',
    authorUrl: 'https://datapulse.example.com',
    icon: BarChart3,
    iconColor: '#818cf8',
    tags: ['Analytics', 'Reports'],
    active: false,
  },
];

export default function PluginsPage() {
  const [plugins, setPlugins] = useState(SAMPLE_PLUGINS);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const filtered = plugins.filter(p => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'all' || (activeTab === 'active' && p.active) || (activeTab === 'inactive' && !p.active);
    return matchesSearch && matchesTab;
  });

  const activeCount = plugins.filter(p => p.active).length;
  const inactiveCount = plugins.filter(p => !p.active).length;

  const handleToggle = async (pluginId) => {
    setToggling(pluginId);
    setError(null);
    try {
      const plugin = plugins.find(p => p.id === pluginId);
      const newState = !plugin.active;

      await supabase.from('options').upsert({
        name: `plugin_${pluginId}_active`,
        value: String(newState)
      }, { onConflict: 'name' });

      setPlugins(prev => prev.map(p => p.id === pluginId ? { ...p, active: newState } : p));
      setSuccessMsg(`"${plugin.name}" ${newState ? 'activated' : 'deactivated'}`);
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (pluginId) => {
    setDeleting(pluginId);
    setError(null);
    try {
      await supabase.from('options').delete().eq('name', `plugin_${pluginId}_active`);
      const plugin = plugins.find(p => p.id === pluginId);
      setPlugins(prev => prev.filter(p => p.id !== pluginId));
      setConfirmDelete(null);
      setSuccessMsg(`"${plugin.name}" deleted`);
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.25rem' }}>Plugins</h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.875rem' }}>{activeCount} active · {inactiveCount} inactive</p>
        </div>

        {successMsg && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Check size={16} /> {successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            {error} <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {[['all', `All (${plugins.length})`], ['active', `Active (${activeCount})`], ['inactive', `Inactive (${inactiveCount})`]].map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{ padding: '0.5rem 1rem', border: 'none', borderBottom: `2px solid ${activeTab === id ? '#a78bfa' : 'transparent'}`, background: 'transparent', color: activeTab === id ? '#a78bfa' : '#64748b', cursor: 'pointer', fontSize: '0.875rem', fontWeight: activeTab === id ? '600' : '400', marginBottom: '-1px', whiteSpace: 'nowrap' }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative', marginLeft: 'auto' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search plugins..." style={{ paddingLeft: '2.125rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none', width: '220px' }} />
          </div>
        </div>

        {/* Plugin Cards */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
            <Zap size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p>No plugins found</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {filtered.map(plugin => {
              const Icon = plugin.icon;
              const isToggling = toggling === plugin.id;
              const isConfirmingDelete = confirmDelete === plugin.id;

              return (
                <div key={plugin.id} style={{ borderRadius: '0.875rem', background: 'rgba(255,255,255,0.03)', border: `1px solid ${plugin.active ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.08)'}`, backdropFilter: 'blur(20px)', overflow: 'hidden', boxShadow: plugin.active ? '0 0 20px rgba(34,197,94,0.05)' : 'none', transition: 'border-color 0.3s, box-shadow 0.3s' }}>
                  <div style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                      {/* Icon */}
                      <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: `${plugin.iconColor}18`, border: `1px solid ${plugin.iconColor}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={22} style={{ color: plugin.iconColor }} />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
                          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#e2e8f0' }}>{plugin.name}</h3>
                          {plugin.active && (
                            <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', fontWeight: '600' }}>
                              Active
                            </span>
                          )}
                          {plugin.tags.map(tag => (
                            <span key={tag} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>{tag}</span>
                          ))}
                        </div>
                        <p style={{ margin: '0 0 0.625rem', fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.6' }}>{plugin.description}</p>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#475569' }}>
                          <span>v{plugin.version}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            By <span style={{ color: '#a78bfa', cursor: 'pointer' }}>{plugin.author}</span>
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', flexShrink: 0 }}>
                        {/* Toggle */}
                        <button onClick={() => handleToggle(plugin.id)} disabled={isToggling} style={{ padding: '0.45rem 1.125rem', borderRadius: '0.5rem', border: `1px solid ${plugin.active ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`, background: plugin.active ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: plugin.active ? '#fca5a5' : '#4ade80', cursor: isToggling ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: '500', opacity: isToggling ? 0.7 : 1, transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                          {isToggling ? 'Working...' : plugin.active ? 'Deactivate' : 'Activate'}
                        </button>

                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          {plugin.active && (
                            <button style={{ padding: '0.35rem 0.625rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Settings size={12} /> Settings
                            </button>
                          )}
                          {!plugin.active && (
                            <button onClick={() => setConfirmDelete(isConfirmingDelete ? null : plugin.id)} style={{ padding: '0.35rem 0.625rem', borderRadius: '0.375rem', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.08)', color: '#fca5a5', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Trash2 size={12} /> Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delete Confirmation */}
                    {isConfirmingDelete && (
                      <div style={{ marginTop: '1rem', padding: '0.875rem 1rem', borderRadius: '0.5rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', color: '#fca5a5' }}>
                          Are you sure you want to delete <strong>{plugin.name}</strong>? This cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '0.625rem' }}>
                          <button onClick={() => handleDelete(plugin.id)} disabled={deleting === plugin.id} style={{ padding: '0.4rem 1rem', borderRadius: '0.375rem', border: 'none', background: 'rgba(239,68,68,0.7)', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', opacity: deleting === plugin.id ? 0.7 : 1 }}>
                            {deleting === plugin.id ? 'Deleting...' : 'Yes, Delete'}
                          </button>
                          <button onClick={() => setConfirmDelete(null)} style={{ padding: '0.4rem 0.875rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
