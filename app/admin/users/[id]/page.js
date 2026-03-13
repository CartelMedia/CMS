'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import {
  Save, Check, X, Trash2, ArrowLeft, Eye, EyeOff,
  User, Lock, Globe, FileText, Mail, Shield
} from 'lucide-react';



const ROLES = ['administrator', 'editor', 'author', 'contributor', 'subscriber'];

function passwordStrength(pwd) {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score, label: 'Very Weak', color: '#ef4444' };
  if (score === 2) return { score, label: 'Weak', color: '#f97316' };
  if (score === 3) return { score, label: 'Fair', color: '#fbbf24' };
  if (score === 4) return { score, label: 'Strong', color: '#22c55e' };
  return { score, label: 'Very Strong', color: '#10b981' };
}

function Avatar({ name, size = 80 }) {
  const initials = (name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const hue = name ? name.charCodeAt(0) * 15 % 360 : 200;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `linear-gradient(135deg, hsl(${hue}, 60%, 30%), hsl(${hue + 40}, 60%, 45%))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: '700', color: '#fff', flexShrink: 0, border: `3px solid hsl(${hue}, 50%, 40%)`, boxShadow: `0 0 20px hsl(${hue}, 60%, 20%)` }}>
      {initials}
    </div>
  );
}

function FormField({ label, description, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.5rem', alignItems: 'flex-start', paddingBottom: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div>
        <label style={{ fontSize: '0.875rem', color: '#e2e8f0', fontWeight: '500', display: 'block' }}>{label}</label>
        {description && <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: '#64748b', lineHeight: '1.5' }}>{description}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '0.55rem 0.875rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' };

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('subscriber');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isNew = userId === 'new';

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }
    const fetchUser = async () => {
      try {
        const { data, error: err } = await supabase.from('users').select('*').eq('id', userId).single();
        if (err) throw err;
        setUser(data);
        const nameParts = (data.name || '').split(' ');
        setFirstName(nameParts[0] || '');
        setLastName(nameParts.slice(1).join(' ') || '');
        setDisplayName(data.display_name || data.name || '');
        setBio(data.bio || '');
        setWebsite(data.website || '');
        setEmail(data.email || '');
        setRole(data.role || 'subscriber');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId, isNew]);

  const handleSave = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const userData = {
        name: fullName,
        display_name: displayName || fullName,
        bio,
        website,
        email,
        role,
        updated_at: new Date().toISOString(),
      };

      if (isNew) {
        if (!email) throw new Error('Email is required');
        const { error: err } = await supabase.from('users').insert(userData);
        if (err) throw err;
        setSaved(true);
        setTimeout(() => router.push('/admin/users'), 1500);
      } else {
        const { error: err } = await supabase.from('users').update(userData).eq('id', userId);
        if (err) throw err;

        if (newPassword) {
          const { error: pwErr } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });
          if (pwErr) throw pwErr;
        }

        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await supabase.from('users').delete().eq('id', userId);
      router.push('/admin/users');
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  const pwStrength = passwordStrength(newPassword);
  const displayNamePreview = displayName || `${firstName} ${lastName}`.trim() || 'User';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '2rem', maxWidth: '960px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/admin/users')} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.875rem' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
              {isNew ? 'Add New User' : 'Edit User'}
            </h1>
          </div>
          <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.5rem', borderRadius: '0.5rem', border: 'none', background: saved ? 'rgba(34,197,94,0.8)' : 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.875rem', opacity: saving ? 0.7 : 1 }}>
            {saved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> {saving ? 'Saving...' : (isNew ? 'Create User' : 'Save Changes')}</>}
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
            {error} <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Array.from({ length: 5 }).map((_, i) => <div key={i} style={{ height: '64px', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.04)' }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', alignItems: 'start' }}>

            {/* Main Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Personal Info */}
              <div style={{ borderRadius: '0.875rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <User size={16} style={{ color: '#a78bfa' }} />
                  <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', color: '#e2e8f0' }}>Personal Info</h3>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <FormField label="First Name">
                    <input value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle} />
                  </FormField>
                  <FormField label="Last Name">
                    <input value={lastName} onChange={e => setLastName(e.target.value)} style={inputStyle} />
                  </FormField>
                  <FormField label="Display Name" description="This will be shown publicly.">
                    <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={`${firstName} ${lastName}`.trim() || 'Enter display name'} style={inputStyle} />
                  </FormField>
                  <FormField label="Biographical Info" description="Share a little about yourself.">
                    <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }} />
                  </FormField>
                  <FormField label="Website">
                    <input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://example.com" style={inputStyle} />
                  </FormField>
                </div>
              </div>

              {/* Account Info */}
              <div style={{ borderRadius: '0.875rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <Mail size={16} style={{ color: '#60a5fa' }} />
                  <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', color: '#e2e8f0' }}>Account</h3>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <FormField label="Email Address">
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
                  </FormField>
                  <FormField label="Role" description="Set the user's access level.">
                    <select value={role} onChange={e => setRole(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {ROLES.map(r => (
                        <option key={r} value={r} style={{ background: '#1a1a2e', textTransform: 'capitalize' }}>
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </div>

              {/* Password */}
              <div style={{ borderRadius: '0.875rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <Lock size={16} style={{ color: '#34d399' }} />
                  <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', color: '#e2e8f0' }}>Password</h3>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  {!isNew && <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: '#64748b' }}>Leave blank to keep the current password.</p>}
                  <FormField label="New Password">
                    <div style={{ position: 'relative' }}>
                      <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder={isNew ? 'Set a password' : 'Enter new password'} style={{ ...inputStyle, paddingRight: '2.5rem' }} />
                      <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex' }}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {newPassword && (
                      <div style={{ marginTop: '0.625rem' }}>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginBottom: '0.375rem', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(pwStrength.score / 5) * 100}%`, background: pwStrength.color, borderRadius: '2px', transition: 'width 0.3s, background 0.3s' }} />
                        </div>
                        <span style={{ fontSize: '0.7rem', color: pwStrength.color }}>{pwStrength.label}</span>
                      </div>
                    )}
                  </FormField>
                  <FormField label="Confirm Password">
                    <div style={{ position: 'relative' }}>
                      <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" style={{ ...inputStyle, paddingRight: '2.5rem', borderColor: confirmPassword && confirmPassword !== newPassword ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.12)' }} />
                      <button onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex' }}>
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: '#f87171' }}>Passwords do not match</p>
                    )}
                    {confirmPassword && confirmPassword === newPassword && newPassword && (
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Check size={12} /> Passwords match</p>
                    )}
                  </FormField>
                </div>
              </div>

              {/* Danger Zone */}
              {!isNew && (
                <div style={{ borderRadius: '0.875rem', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.2)', overflow: 'hidden' }}>
                  <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <Shield size={16} style={{ color: '#f87171' }} />
                    <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', color: '#f87171' }}>Danger Zone</h3>
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: '600', fontSize: '0.875rem', color: '#e2e8f0' }}>Delete this account</p>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>Permanently delete this user account. This action cannot be undone.</p>
                      </div>
                      <button onClick={() => setShowDeleteConfirm(true)} style={{ padding: '0.5rem 1.125rem', borderRadius: '0.5rem', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)', color: '#f87171', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Trash2 size={15} /> Delete Account
                      </button>
                    </div>

                    {showDeleteConfirm && (
                      <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '0.5rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', color: '#fca5a5' }}>
                          Are you absolutely sure? This will permanently delete <strong>{user?.name || user?.email}</strong> and all their data.
                        </p>
                        <div style={{ display: 'flex', gap: '0.625rem' }}>
                          <button onClick={handleDelete} disabled={deleting} style={{ padding: '0.4rem 1rem', borderRadius: '0.375rem', border: 'none', background: 'rgba(239,68,68,0.7)', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', opacity: deleting ? 0.7 : 1 }}>
                            {deleting ? 'Deleting...' : 'Yes, Delete Forever'}
                          </button>
                          <button onClick={() => setShowDeleteConfirm(false)} style={{ padding: '0.4rem 0.875rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Avatar Preview */}
              <div style={{ borderRadius: '0.875rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                  <Avatar name={displayNamePreview} size={80} />
                </div>
                <p style={{ margin: '0 0 0.25rem', fontWeight: '600', color: '#e2e8f0', fontSize: '0.95rem' }}>{displayNamePreview}</p>
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: '#64748b' }}>{email || 'No email set'}</p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.75rem', borderRadius: '9999px', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', color: '#a78bfa', fontSize: '0.75rem', fontWeight: '600', textTransform: 'capitalize' }}>
                  <Shield size={12} /> {role}
                </div>
                <p style={{ margin: '0.875rem 0 0', fontSize: '0.7rem', color: '#475569' }}>Avatar is generated from display name initials</p>
              </div>

              {/* User Stats */}
              {!isNew && user && (
                <div style={{ borderRadius: '0.875rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', padding: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 1rem', fontSize: '0.8rem', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Info</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                      ['Registered', user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'],
                      ['Last Login', user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'],
                      ['User ID', `#${userId?.toString().slice(0, 8)}...`],
                    ].map(([label, value]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{label}</span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: label === 'User ID' ? 'monospace' : 'inherit' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
