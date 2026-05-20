'use client';
import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Camera, Save, Loader2, Lock, CheckCircle2, AlertCircle, Shield, Calendar, Trash2, ChevronRight, Car } from 'lucide-react';

export default function ProfilePage() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [formData, setFormData] = useState({ username: '', email: '', phoneNumber: '' });

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:5215/api/customer-portal/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setFormData({ username: data.username, email: data.email, phoneNumber: data.phoneNumber || '' });
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        setMessage({ text: '', type: '' });
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:5215/api/customer-portal/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setMessage({ text: 'Profile updated successfully!', type: 'success' });
                fetchProfile();
            } else {
                const err = await res.text();
                setMessage({ text: err || 'Failed to update.', type: 'error' });
            }
        } catch (err) { setMessage({ text: 'Connection failure.', type: 'error' }); }
        finally { setUpdating(false); }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('file', file);
        const token = localStorage.getItem('token');
        setUpdating(true);
        try {
            const res = await fetch('http://localhost:5215/api/customer-portal/upload-profile-picture', {
                method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd
            });
            if (res.ok) fetchProfile();
            else alert('File upload failed (Max 2MB, JPG/PNG only).');
        } catch (err) { console.error(err); } finally { setUpdating(false); }
    };

    if (loading) return (
        <div className="card empty-state">
            <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary-accent)', marginBottom: '1rem' }} />
            <p className="card-eyebrow">Accessing records...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in">
            {/* Hero Banner */}
            <div className="card" style={{ position: 'relative', overflow: 'hidden', padding: '3rem' }}>
                <Shield style={{ position: 'absolute', right: '-2rem', top: '-2rem', width: '18rem', height: '18rem', color: '#fff', opacity: 0.03, pointerEvents: 'none' }} />
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '3rem', position: 'relative', zIndex: 10 }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{ width: '8rem', height: '8rem', borderRadius: '2rem', overflow: 'hidden', border: '3px solid var(--primary-accent)', backgroundColor: 'var(--secondary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {profile?.profilePictureUrl
                                ? <img src={profile.profilePictureUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <User size={60} style={{ color: 'var(--text-secondary)' }} />
                            }
                        </div>
                        <label style={{ position: 'absolute', bottom: '-0.5rem', right: '-0.5rem', width: '2.5rem', height: '2.5rem', backgroundColor: 'var(--primary-accent)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                            <Camera size={18} />
                            <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handlePhotoUpload} />
                        </label>
                    </div>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(214,31,44,0.1)', color: 'var(--primary-accent)', padding: '0.3rem 0.75rem', borderRadius: '0.5rem', marginBottom: '0.75rem' }}>
                            <span className="card-eyebrow" style={{ fontSize: '0.65rem' }}>Official Member</span>
                        </div>
                        <h1 className="page-header-title" style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
                            {profile?.username?.toUpperCase()}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>"{profile?.email}"</p>
                        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                <Car size={14} style={{ color: 'var(--primary-accent)' }} /> {profile?.vehicles?.length || 0} Registered Vehicles
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                <Calendar size={14} style={{ color: 'var(--primary-accent)' }} /> Member since 2026
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid-main">
                {/* Edit Form */}
                <div className="card p-7">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div className="stat-card-icon-wrap"><User size={22} /></div>
                        <h2 className="card-title" style={{ fontSize: '1.5rem' }}>PERSONAL DETAILS</h2>
                    </div>

                    {message.text && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '1rem', marginBottom: '1.5rem', backgroundColor: message.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(214,31,44,0.1)', color: message.type === 'success' ? '#22c55e' : 'var(--primary-accent)', border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(214,31,44,0.3)'}` }}>
                            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{message.text}</span>
                        </div>
                    )}

                    <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label className="card-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><User size={14} /> Full Name</label>
                            <input className="form-input" required value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
                        </div>
                        <div>
                            <label className="card-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><Phone size={14} /> Phone Number</label>
                            <input className="form-input" required value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} />
                        </div>
                        <div>
                            <label className="card-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><Mail size={14} /> Email (Unchangeable)</label>
                            <input className="form-input" disabled value={formData.email} style={{ opacity: 0.6 }} />
                        </div>
                        <button type="submit" disabled={updating} className="btn-primary"
                            style={{ padding: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                            {updating ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            UPDATE PROFILE
                        </button>
                    </form>
                </div>

                {/* Sidebar Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card p-7">
                        <div className="stat-card-icon-wrap" style={{ marginBottom: '1.25rem' }}><Lock size={24} /></div>
                        <h3 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>SECURITY</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>Keep your account secure by regularly updating your password.</p>
                        <button className="btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                            CHANGE PASSWORD <ChevronRight size={16} />
                        </button>
                    </div>
                    <div className="card p-7" style={{ border: '1px solid rgba(214,31,44,0.3)' }}>
                        <div style={{ width: '3.5rem', height: '3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(214,31,44,0.1)', borderRadius: '1rem', marginBottom: '1.25rem' }}>
                            <AlertCircle size={24} style={{ color: 'var(--primary-accent)' }} />
                        </div>
                        <h3 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>DANGER ZONE</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>Permanently delete your account and all associated data.</p>
                        <button style={{ width: '100%', padding: '0.75rem', backgroundColor: 'transparent', border: '1px solid var(--primary-accent)', color: 'var(--primary-accent)', borderRadius: '1rem', fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            DELETE ACCOUNT <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
