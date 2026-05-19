'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Search, Plus, Loader2, Shield, Users,
  Car, ChevronDown, ChevronUp, Phone, Mail, Edit3,
  Trash2, PlusCircle, X, User2
} from 'lucide-react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';

const PAGE_SIZE = 10;
const API = 'http://localhost:5215';

interface Vehicle {
  id: number;
  vehicleNumber: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  notes?: string;
}

interface Customer {
  id: number;
  username: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  vehicles: Vehicle[];
}

export default function StaffCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);

  // Create Customer Modal
  const [showModal, setShowModal] = useState(false);
  const [fName, setFName] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fPassword, setFPassword] = useState('');
  const [vehicles, setVehicles] = useState([{ vehicleNumber: '', make: '', model: '', year: '', color: '' }]);
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const getToken = () => localStorage.getItem('token') ?? '';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      if (role !== 'Admin' && role !== 'Staff') {
        setError('Access restricted to Staff and Admins.');
        setLoading(false);
        return;
      }
    } catch { router.push('/login'); return; }
    fetchCustomers();
  }, [router]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/customers`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) setCustomers(await res.json());
      else setError('Failed to load customers.');
    } catch { setError('Cannot reach backend.'); }
    finally { setLoading(false); }
  };

  // Search via API
  useEffect(() => {
    if (!searchQuery.trim()) { fetchCustomers(); return; }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`${API}/api/customers/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (res.ok) setCustomers(await res.json());
      } finally { setIsSearching(false); setPage(1); }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return customers.slice(start, start + PAGE_SIZE);
  }, [customers, page]);

  const totalPages = Math.ceil(customers.length / PAGE_SIZE);

  const resetModal = () => {
    setFName(''); setFEmail(''); setFPhone(''); setFPassword('');
    setVehicles([{ vehicleNumber: '', make: '', model: '', year: '', color: '' }]);
    setModalError('');
  };

  const addVehicleRow = () =>
    setVehicles([...vehicles, { vehicleNumber: '', make: '', model: '', year: '', color: '' }]);

  const removeVehicleRow = (i: number) =>
    setVehicles(vehicles.filter((_, idx) => idx !== i));

  const updateVehicle = (i: number, field: string, val: string) => {
    const v = [...vehicles];
    (v[i] as any)[field] = val;
    setVehicles(v);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (!fName || !fEmail || !fPhone) { setModalError('Name, email, and phone are required.'); return; }
    
    if (fPassword) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{6,}$/;
      if (!passwordRegex.test(fPassword)) {
        setModalError('Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.');
        return;
      }
    }

    setModalLoading(true);
    try {
      const res = await fetch(`${API}/api/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          name: fName, email: fEmail, phoneNumber: fPhone,
          password: fPassword || undefined,
          vehicles: vehicles.filter(v => v.vehicleNumber && v.make && v.model).map(v => ({
            vehicleNumber: v.vehicleNumber, make: v.make, model: v.model,
            year: v.year ? parseInt(v.year) : null, color: v.color || null
          }))
        })
      });
      if (res.ok) {
        setShowModal(false); resetModal(); await fetchCustomers();
      } else {
        const msg = await res.text(); setModalError(msg || 'Failed to create customer.');
      }
    } catch { setModalError('Network error.'); }
    finally { setModalLoading(false); }
  };

  const handleDeleteVehicle = async (customerId: number, vehicleId: number) => {
    if (!confirm('Remove this vehicle from the customer?')) return;
    await fetch(`${API}/api/customers/${customerId}/vehicles/${vehicleId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` }
    });
    await fetchCustomers();
  };

  return (
    <div className="admin-portal-wrapper">
      <header className="admin-portal-header">
        <div className="admin-header-container">
          <div className="admin-logo-group">
            <Link href="/" className="admin-back-btn">
              <ArrowLeft size={18} />
              <span>Back to Site</span>
            </Link>
            <h1>Redline Auto Garage <span className="red-badge">Customer Management</span></h1>
          </div>
          <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/staff/customers" style={{ color: 'var(--primary-accent)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>Customers</Link>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
            <Link href="/staff/sales" style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>Sales & Invoices</Link>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
            <Link href="/staff/reports" style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>Reports</Link>
          </div>
          <div className="admin-user-info">
            <Shield size={18} className="shield-icon" />
            <span>Staff Portal</span>
          </div>
        </div>
      </header>

      <main className="admin-main-container">
        {error ? (
          <div className="admin-error-card"><h2>Access Denied</h2><p>{error}</p></div>
        ) : loading ? (
          <div className="admin-loading-screen"><Loader2 className="loading-spinner" /><p>Loading customers...</p></div>
        ) : (
          <>
            {/* Stats */}
            <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="admin-stat-card">
                <div className="stat-icon-box blue"><Users size={24} /></div>
                <div className="stat-info"><h3>{customers.length}</h3><p>TOTAL CUSTOMERS</p></div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-icon-box green"><Car size={24} /></div>
                <div className="stat-info">
                  <h3>{customers.reduce((acc, c) => acc + c.vehicles.length, 0)}</h3>
                  <p>TOTAL VEHICLES</p>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-icon-box purple"><Shield size={24} /></div>
                <div className="stat-info">
                  <h3>{customers.filter(c => c.isActive).length}</h3>
                  <p>ACTIVE CUSTOMERS</p>
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
                    placeholder="Search by name, email, phone, vehicle plate..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  {isSearching && <Loader2 size={16} style={{ position: 'absolute', right: '1rem', color: 'var(--text-secondary)', animation: 'spin 1s linear infinite' }} />}
                </div>
              </div>
              <button className="create-staff-btn" onClick={() => { resetModal(); setShowModal(true); }}>
                <Plus size={18} /><span>New Customer</span>
              </button>
            </div>

            {/* Table */}
            <div className="users-table-card">
              <h2>Customer Directory</h2>
              <div className="table-responsive-wrapper">
                <table className="users-dashboard-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Vehicles</th>
                      <th>Status</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr><td colSpan={6} className="table-empty-row">No customers found.</td></tr>
                    ) : paginated.map(c => (
                      <React.Fragment key={c.id}>
                        <tr className={!c.isActive ? 'inactive-row' : ''}>
                          <td>
                            <div className="user-profile-meta">
                              <div className="avatar-initials customer">{c.username.substring(0, 2).toUpperCase()}</div>
                              <div className="meta-text">
                                <span className="username">{c.username}</span>
                                <span className="user-id">ID: #{c.id}</span>
                              </div>
                            </div>
                          </td>
                          <td><div className="email-meta"><Mail size={14} className="meta-icon" /><span>{c.email}</span></div></td>
                          <td><div className="phone-meta"><Phone size={14} className="meta-icon" /><span>{c.phoneNumber}</span></div></td>
                          <td>
                            <span className="role-badge staff">{c.vehicles.length} vehicle{c.vehicles.length !== 1 ? 's' : ''}</span>
                          </td>
                          <td><span className={`status-pill ${c.isActive ? 'active' : 'inactive'}`}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                          <td>
                            <button
                              className="toggle-status-btn activate"
                              onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                              style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#fff', gap: '0.4rem' }}
                            >
                              {expanded === c.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              <span>{expanded === c.id ? 'Collapse' : 'View'}</span>
                            </button>
                          </td>
                        </tr>
                        {expanded === c.id && (
                          <tr>
                            <td colSpan={6} style={{ padding: '0', background: '#050505' }}>
                              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--borders)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Registered Vehicles</strong>
                                  <Link href={`/staff/customers/${c.id}`} style={{ fontSize: '0.8rem', color: 'var(--primary-accent)', fontWeight: 700, textDecoration: 'none' }}>
                                    Full History & Details →
                                  </Link>
                                </div>
                                {c.vehicles.length === 0 ? (
                                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>No vehicles registered.</p>
                                ) : (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                                    {c.vehicles.map(v => (
                                      <div key={v.id} style={{
                                        background: '#0d0d0d', border: '1px solid var(--borders)',
                                        borderRadius: '6px', padding: '0.6rem 1rem',
                                        display: 'flex', alignItems: 'center', gap: '0.8rem'
                                      }}>
                                        <Car size={16} style={{ color: 'var(--primary-accent)' }} />
                                        <div>
                                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{v.vehicleNumber}</div>
                                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                            {v.make} {v.model} {v.year ? `(${v.year})` : ''} {v.color ? `• ${v.color}` : ''}
                                          </div>
                                        </div>
                                        <button onClick={() => handleDeleteVehicle(c.id, v.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', marginLeft: '0.4rem' }}>
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={p => { setPage(p); setExpanded(null); }} pageSize={PAGE_SIZE} totalItems={customers.length} />
            </div>
          </>
        )}
      </main>

      {/* Create Customer Modal */}
      {showModal && (
        <div className="staff-modal-overlay">
          <div className="staff-modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h2>Register New Customer</h2>
              <button className="close-modal-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            {modalError && <div className="modal-error-message">{modalError}</div>}
            <form onSubmit={handleCreateCustomer} className="modal-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="modal-form-group">
                  <label>Full Name *</label>
                  <div className="modal-input-wrapper">
                    <User2 size={16} className="modal-input-icon" />
                    <input type="text" placeholder="John Doe" value={fName} onChange={e => setFName(e.target.value)} required />
                  </div>
                </div>
                <div className="modal-form-group">
                  <label>Phone *</label>
                  <div className="modal-input-wrapper">
                    <Phone size={16} className="modal-input-icon" />
                    <input type="tel" placeholder="+1 555 000 0000" value={fPhone} onChange={e => setFPhone(e.target.value)} required />
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="modal-form-group">
                  <label>Email *</label>
                  <div className="modal-input-wrapper">
                    <Mail size={16} className="modal-input-icon" />
                    <input type="email" placeholder="customer@email.com" value={fEmail} onChange={e => setFEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="modal-form-group">
                  <label>Password <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(optional — auto-generated)</span></label>
                  <div className="modal-input-wrapper">
                    <input type="password" placeholder="Leave blank to auto-generate" value={fPassword} onChange={e => setFPassword(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Vehicles section */}
              <div className="modal-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ margin: 0 }}>Vehicle(s)</label>
                  <button type="button" onClick={addVehicleRow} style={{ background: 'none', border: 'none', color: 'var(--primary-accent)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <PlusCircle size={14} /> Add Vehicle
                  </button>
                </div>
                {vehicles.map((v, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 0.7fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <input type="text" placeholder="Plate No. *" value={v.vehicleNumber} onChange={e => updateVehicle(i, 'vehicleNumber', e.target.value)}
                      style={{ backgroundColor: '#060606', border: '1px solid var(--borders)', borderRadius: '6px', padding: '0.55rem', color: '#fff', fontSize: '0.85rem' }} />
                    <input type="text" placeholder="Make *" value={v.make} onChange={e => updateVehicle(i, 'make', e.target.value)}
                      style={{ backgroundColor: '#060606', border: '1px solid var(--borders)', borderRadius: '6px', padding: '0.55rem', color: '#fff', fontSize: '0.85rem' }} />
                    <input type="text" placeholder="Model *" value={v.model} onChange={e => updateVehicle(i, 'model', e.target.value)}
                      style={{ backgroundColor: '#060606', border: '1px solid var(--borders)', borderRadius: '6px', padding: '0.55rem', color: '#fff', fontSize: '0.85rem' }} />
                    <input type="number" placeholder="Year" value={v.year} onChange={e => updateVehicle(i, 'year', e.target.value)}
                      style={{ backgroundColor: '#060606', border: '1px solid var(--borders)', borderRadius: '6px', padding: '0.55rem', color: '#fff', fontSize: '0.85rem', textAlign: 'center' }} />
                    <button type="button" onClick={() => removeVehicleRow(i)} disabled={vehicles.length === 1} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: vehicles.length === 1 ? 0.3 : 1 }}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>Rows with empty plate/make/model will be skipped.</p>
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="modal-submit-btn" disabled={modalLoading}>
                  {modalLoading ? 'Creating...' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
