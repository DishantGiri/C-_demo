'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, Plus, Edit3, Trash2, Search, Shield,
  Building2, Mail, Phone, MapPin, User2, X
} from 'lucide-react';
import Link from 'next/link';

interface Vendor {
  id: number;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phoneNumber: string | null;
  address: string | null;
}

const API = 'http://localhost:5215/api/vendors';

export default function AdminVendorsPage() {
  const router = useRouter();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form fields
  const [fName, setFName] = useState('');
  const [fContact, setFContact] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fAddress, setFAddress] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const getToken = () => localStorage.getItem('token') ?? '';

  // Auth + initial fetch
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      if (role !== 'Admin') { setError('Access restricted to Admins.'); setLoading(false); return; }
    } catch { router.push('/login'); return; }
    fetchVendors();
  }, [router]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await fetch(API, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setVendors(await res.json());
      else setError('Failed to load vendors.');
    } catch { setError('Cannot reach backend server.'); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setIsEditing(false); setEditingId(null);
    setFName(''); setFContact(''); setFEmail(''); setFPhone(''); setFAddress('');
    setModalError('');
  };

  const openCreate = () => { resetForm(); setShowModal(true); };
  const openEdit = (v: Vendor) => {
    setIsEditing(true); setEditingId(v.id);
    setFName(v.name); setFContact(v.contactPerson ?? '');
    setFEmail(v.email ?? ''); setFPhone(v.phoneNumber ?? ''); setFAddress(v.address ?? '');
    setModalError(''); setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName.trim()) { setModalError('Vendor name is required.'); return; }
    setModalError(''); setModalLoading(true);

    const body = JSON.stringify({ name: fName, contactPerson: fContact, email: fEmail, phoneNumber: fPhone, address: fAddress });
    const url = isEditing ? `${API}/${editingId}` : API;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body
      });
      if (res.ok) { setShowModal(false); resetForm(); await fetchVendors(); }
      else { const msg = await res.text(); setModalError(msg || 'Operation failed.'); }
    } catch { setModalError('Network error.'); }
    finally { setModalLoading(false); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete vendor "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) await fetchVendors();
      else { const msg = await res.text(); alert(msg || 'Failed to delete.'); }
    } catch { alert('Network error.'); }
  };

  const filtered = vendors.filter(v =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.email ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.contactPerson ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-portal-wrapper">
      {/* Header */}
      <header className="admin-portal-header">
        <div className="admin-header-container">
          <div className="admin-logo-group">
            <Link href="/" className="admin-back-btn">
              <ArrowLeft size={18} />
              <span>Back to Site</span>
            </Link>
            <h1>Redline Auto Garage <span className="red-badge">Vendor Management</span></h1>
          </div>

          {/* Sub-nav */}
          <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/admin/users" style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
              Users
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
            <Link href="/admin/parts" style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
              Parts & Invoices
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
            <Link href="/admin/vendors" style={{ color: 'var(--primary-accent)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
              Vendors
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
            <Link href="/admin/reports" style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
              Financial Reports
            </Link>
          </div>

          <div className="admin-user-info">
            <Shield size={18} className="shield-icon" />
            <span>Administrator Portal</span>
          </div>
        </div>
      </header>

      <main className="admin-main-container">
        {error ? (
          <div className="admin-error-card">
            <h2>Access Restriction</h2>
            <p>{error}</p>
            <Link href="/login" className="admin-login-redirect">Go to Login</Link>
          </div>
        ) : loading ? (
          <div className="admin-loading-screen">
            <Loader2 className="loading-spinner" />
            <p>Loading vendor directory...</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="admin-stat-card">
                <div className="stat-icon-box blue"><Building2 size={24} /></div>
                <div className="stat-info">
                  <h3>{vendors.length}</h3>
                  <p>TOTAL VENDORS</p>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-icon-box green"><Mail size={24} /></div>
                <div className="stat-info">
                  <h3>{vendors.filter(v => v.email).length}</h3>
                  <p>WITH EMAIL</p>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-icon-box purple"><Phone size={24} /></div>
                <div className="stat-info">
                  <h3>{vendors.filter(v => v.phoneNumber).length}</h3>
                  <p>WITH PHONE</p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="admin-controls-card">
              <div className="search-and-filters">
                <div className="search-box-wrapper">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by name, contact or email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <button className="create-staff-btn" onClick={openCreate}>
                <Plus size={18} />
                <span>Add New Vendor</span>
              </button>
            </div>

            {/* Table */}
            <div className="users-table-card">
              <h2>Vendor Directory ({filtered.length})</h2>
              <div className="table-responsive-wrapper">
                <table className="users-dashboard-table">
                  <thead>
                    <tr>
                      <th>Vendor Name</th>
                      <th>Contact Person</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Address</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="table-empty-row">
                          {vendors.length === 0
                            ? 'No vendors registered yet. Add your first vendor supplier above.'
                            : 'No vendors match your search query.'}
                        </td>
                      </tr>
                    ) : (
                      filtered.map(v => (
                        <tr key={v.id}>
                          <td>
                            <div className="user-profile-meta">
                              <div className="avatar-initials staff">
                                {v.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="meta-text">
                                <span className="username">{v.name}</span>
                                <span className="user-id">ID: #{v.id}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="email-meta">
                              <User2 size={14} className="meta-icon" />
                              <span>{v.contactPerson || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>—</span>}</span>
                            </div>
                          </td>
                          <td>
                            <div className="email-meta">
                              <Mail size={14} className="meta-icon" />
                              <span>{v.email || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>—</span>}</span>
                            </div>
                          </td>
                          <td>
                            <div className="phone-meta">
                              <Phone size={14} className="meta-icon" />
                              <span>{v.phoneNumber || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>—</span>}</span>
                            </div>
                          </td>
                          <td style={{ maxWidth: '200px' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              {v.address || '—'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                              <button
                                className="toggle-status-btn activate"
                                onClick={() => openEdit(v)}
                                style={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
                              >
                                <Edit3 size={14} />
                                <span>Edit</span>
                              </button>
                              <button
                                className="toggle-status-btn deactivate"
                                onClick={() => handleDelete(v.id, v.name)}
                              >
                                <Trash2 size={14} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="staff-modal-overlay">
          <div className="staff-modal-content">
            <div className="modal-header">
              <h2>{isEditing ? 'Edit Vendor Details' : 'Add New Vendor'}</h2>
              <button className="close-modal-btn" onClick={() => { setShowModal(false); resetForm(); }}>
                <X size={18} />
              </button>
            </div>

            {modalError && <div className="modal-error-message">{modalError}</div>}

            <form onSubmit={handleSubmit} className="modal-form">
              {/* Vendor Name */}
              <div className="modal-form-group">
                <label>Vendor / Company Name *</label>
                <div className="modal-input-wrapper">
                  <Building2 size={16} className="modal-input-icon" />
                  <input
                    type="text"
                    placeholder="e.g. Bosch Global Parts Ltd."
                    value={fName}
                    onChange={e => setFName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Contact Person */}
              <div className="modal-form-group">
                <label>Contact Person</label>
                <div className="modal-input-wrapper">
                  <User2 size={16} className="modal-input-icon" />
                  <input
                    type="text"
                    placeholder="e.g. John Smith"
                    value={fContact}
                    onChange={e => setFContact(e.target.value)}
                  />
                </div>
              </div>

              {/* Email + Phone — side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="modal-form-group">
                  <label>Email Address</label>
                  <div className="modal-input-wrapper">
                    <Mail size={16} className="modal-input-icon" />
                    <input
                      type="email"
                      placeholder="vendor@example.com"
                      value={fEmail}
                      onChange={e => setFEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-form-group">
                  <label>Phone Number</label>
                  <div className="modal-input-wrapper">
                    <Phone size={16} className="modal-input-icon" />
                    <input
                      type="tel"
                      placeholder="+1 555 000 0000"
                      value={fPhone}
                      onChange={e => setFPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="modal-form-group">
                <label>Business Address</label>
                <div className="modal-input-wrapper">
                  <MapPin size={16} className="modal-input-icon" style={{ alignSelf: 'flex-start', marginTop: '0.75rem' }} />
                  <textarea
                    placeholder="Street, City, Country, ZIP"
                    value={fAddress}
                    onChange={e => setFAddress(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      backgroundColor: '#060606',
                      border: '1px solid var(--borders)',
                      borderRadius: '6px',
                      padding: '0.75rem',
                      color: '#fff',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-cancel-btn" onClick={() => { setShowModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="modal-submit-btn" disabled={modalLoading}>
                  {modalLoading ? 'Saving...' : isEditing ? 'Update Vendor' : 'Add Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
