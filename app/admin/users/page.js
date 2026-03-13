'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Trash2, Edit2, X, Check, ChevronDown,
  User, Shield, Pen, BookOpen, Eye
} from 'lucide-react';



const ROLES = ['administrator', 'editor', 'author', 'contributor', 'subscriber'];

const ROLE_COLORS = {
  administrator: { bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.25)' },
  editor: { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: 'rgba(167,139,250,0.25)' },
  author: { bg: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: 'rgba(96,165,250,0.25)' },
  contributor: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
  subscriber: { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'rgba(100,116,139,0.25)' },
};

function RoleBadge({ role }) {
  const style = ROLE_COLORS[role] || ROLE_COLORS.subscriber;
  return (
    <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontWeight: '600', textTransform: 'capitalize', ...style }}>
      {role}
    </span>
  );
}

function Avatar({ name, size = 36 }) {
  const initials = (name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const hue = name ? name.charCodeAt(0) * 15 % 360 : 200;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `hsl(${hue}, 60%, 35%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: '700', color: '#fff', flexShrink: 0, border: `2px solid hsl(${hue}, 50%, 45%)` }}>
      {initials}
    </div>
  );
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkRole, setBulkRole] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('users').select('*, posts(count)').order('created_at', { ascending: false });
      if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      if (roleFilter !== 'all') query = query.eq('role', roleFilter);
      const { data, error: err } = await query;
      if (err) throw err;
      setUsers(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async (id) => {
    const user = users.find(u => u.id === id);
    if (!confirm(`Delete user "${user?.name || user?.email}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await supabase.from('users').delete().eq('id', id);
      setUsers(prev => prev.filter(u => u.id !== id));
      setSuccessMsg('User deleted');
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedItems.length === 0) return;
    try {
      if (bulkAction === 'delete') {
        if (!confirm(`Delete ${selectedItems.length} users?`)) return;
        await supabase.from('users').delete().in('id', selectedItems);
        setUsers(prev => prev.filter(u => !selectedItems.includes(u.id)));
      } else if (bulkAction === 'change-role' && bulkRole) {
        await supabase.from('users').update({ role: bulkRole }).in('id', selectedItems);
        setUsers(prev => prev.map(u => selectedItems.includes(u.id) ? { ...u, role: bulkRole } : u));
      }
      setSelectedItems([]);
      setBulkAction('');
      setBulkRole('');
      setSuccessMsg('Bulk action applied');
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleSelect = (id) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const allSelected = users.length > 0 && selectedItems.length === users.length;

  const roleCounts = ROLES.reduce((acc, r) => ({ ...acc, [r]: users.filter(u => u.role === r).length }), {});

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.25rem' }}>Users</h1>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.875rem' }}>{users.length} registered users</p>
          </div>
          <button onClick={() => router.push('/admin/users/new')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>
            <Plus size={16} /> Add New User
          </button>
        </div>

        {successMsg && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Check size={16} />{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            {error} <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {/* Role filter tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <button onClick={() => setRoleFilter('all')} style={{ padding: '0.5rem 1rem', border: 'none', borderBottom: `2px solid ${roleFilter === 'all' ? '#a78bfa' : 'transparent'}`, background: 'transparent', color: roleFilter === 'all' ? '#a78bfa' : '#64748b', cursor: 'pointer', fontSize: '0.875rem', fontWeight: roleFilter === 'all' ? '600' : '400', marginBottom: '-1px' }}>
            All ({users.length})
          </button>
          {ROLES.map(role => roleCounts[role] > 0 && (
            <button key={role} onClick={() => setRoleFilter(role)} style={{ padding: '0.5rem 1rem', border: 'none', borderBottom: `2px solid ${roleFilter === role ? '#a78bfa' : 'transparent'}`, background: 'transparent', color: roleFilter === role ? '#a78bfa' : '#64748b', cursor: 'pointer', fontSize: '0.875rem', fontWeight: roleFilter === role ? '600' : '400', marginBottom: '-1px', textTransform: 'capitalize' }}>
              {role} ({roleCounts[role]})
            </button>
          ))}
        </div>

        {/* Search and Bulk Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="checkbox" checked={allSelected} onChange={() => setSelectedItems(allSelected ? [] : users.map(u => u.id))} style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
          <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}>
            <option value="">Bulk Actions</option>
            <option value="change-role">Change Role</option>
            <option value="delete">Delete</option>
          </select>
          {bulkAction === 'change-role' && (
            <select value={bulkRole} onChange={e => setBulkRole(e.target.value)} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}>
              <option value="">Select Role</option>
              {ROLES.map(r => <option key={r} value={r} style={{ textTransform: 'capitalize', background: '#1a1a2e' }}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          )}
          <button onClick={handleBulkAction} disabled={!bulkAction || selectedItems.length === 0} style={{ padding: '0.4rem 0.875rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', cursor: 'pointer', fontSize: '0.8rem', opacity: (!bulkAction || selectedItems.length === 0) ? 0.5 : 1 }}>
            Apply
          </button>
          <div style={{ position: 'relative', marginLeft: 'auto' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." style={{ paddingLeft: '2.125rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none', width: '200px' }} />
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Array.from({ length: 5 }).map((_, i) => <div key={i} style={{ height: '68px', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.04)' }} />)}
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
            <User size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p>No users found</p>
          </div>
        ) : (
          <div style={{ borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <th style={{ padding: '0.75rem 1rem', width: '40px' }}></th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Posts</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registered</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => (
                  <tr key={user.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: selectedItems.includes(user.id) ? 'rgba(167,139,250,0.05)' : idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent', transition: 'background 0.15s' }}>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                      <input type="checkbox" checked={selectedItems.includes(user.id)} onChange={() => toggleSelect(user.id)} style={{ cursor: 'pointer' }} />
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <Avatar name={user.name || user.email} />
                        <div>
                          <p style={{ margin: 0, fontWeight: '600', fontSize: '0.875rem', color: '#e2e8f0' }}>{user.name || '(No name)'}</p>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>{user.email}</p>
                          {user.username && <p style={{ margin: 0, fontSize: '0.7rem', color: '#475569' }}>@{user.username}</p>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <RoleBadge role={user.role || 'subscriber'} />
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#94a3b8' }}>
                      {user.posts?.[0]?.count ?? 0}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#94a3b8' }}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <button onClick={() => router.push(`/admin/users/${user.id}`)} style={{ padding: '0.35rem 0.625rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Edit2 size={12} /> Edit
                        </button>
                        <button onClick={() => handleDelete(user.id)} disabled={deletingId === user.id} style={{ padding: '0.35rem', borderRadius: '0.375rem', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.08)', color: '#fca5a5', cursor: 'pointer', opacity: deletingId === user.id ? 0.6 : 1 }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
