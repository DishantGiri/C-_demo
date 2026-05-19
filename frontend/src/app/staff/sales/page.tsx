'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, Shield, FileText, PlusCircle, X,
  Search, CheckCircle, Clock, XCircle, Mail, Send, ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';

const PAGE_SIZE = 8;
const API = 'http://localhost:5215';

interface Part { id: number; name: string; partNumber: string; price: number; stockQuantity: number; }
interface Customer { id: number; username: string; email: string; phoneNumber: string; vehicles: { id: number; vehicleNumber: string; make: string; model: string }[]; }
interface Invoice {
  id: number; invoiceNumber: string; saleDate: string; totalAmount: number;
  status: string; emailSent: boolean; notes?: string;
  customer: { id: number; username: string; email: string; phoneNumber: string };
  vehicle?: { id: number; vehicleNumber: string; make: string; model: string };
  items: { id: number; partId: number; partName: string; quantity: number; unitPrice: number }[];
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Paid:    { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e' },
  Unpaid:  { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444' },
  Pending: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
};

export default function StaffSalesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // New Invoice Modal
  const [showModal, setShowModal] = useState(false);
  const [iNumber, setINumber] = useState('');
  const [iCustomerId, setICustomerId] = useState(0);
  const [iVehicleId, setIVehicleId] = useState(0);
  const [iNotes, setINotes] = useState('');
  const [iItems, setIItems] = useState([{ partId: 0, quantity: 1, unitPrice: 0 }]);
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const getToken = () => localStorage.getItem('token') ?? '';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    try {
      const p = JSON.parse(atob(token.split('.')[1]));
      const role = p['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      if (role !== 'Admin' && role !== 'Staff') { setError('Staff/Admin only.'); setLoading(false); return; }
    } catch { router.push('/login'); return; }
    loadAll();
  }, [router]);

  const loadAll = async () => {
    setLoading(true);
    const h = { headers: { Authorization: `Bearer ${getToken()}` } };
    const [invRes, partsRes, custRes] = await Promise.all([
      fetch(`${API}/api/sales`, h),
      fetch(`${API}/api/parts`, h),
      fetch(`${API}/api/customers`, h),
    ]);
    if (invRes.ok) setInvoices(await invRes.json());
    if (partsRes.ok) setParts(await partsRes.json());
    if (custRes.ok) setCustomers(await custRes.json());
    setLoading(false);
  };

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return invoices.filter(inv => {
      const matchSearch = !q || inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customer.username.toLowerCase().includes(q) ||
        inv.customer.email.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'All' || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const selectedCustomer = customers.find(c => c.id === iCustomerId);
  const invoiceTotal = iItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  const addItemRow = () => setIItems([...iItems, { partId: 0, quantity: 1, unitPrice: 0 }]);
  const removeItemRow = (i: number) => { if (iItems.length > 1) setIItems(iItems.filter((_, idx) => idx !== i)); };
  const updateItem = (i: number, field: string, val: number) => { const a = [...iItems]; (a[i] as any)[field] = val; setIItems(a); };

  const handlePartSelect = (i: number, partId: number) => {
    const p = parts.find(p => p.id === partId);
    const a = [...iItems];
    a[i] = { partId, quantity: 1, unitPrice: p?.price ?? 0 };
    setIItems(a);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!iNumber.trim()) { setModalError('Invoice number is required.'); return; }
    if (!iCustomerId) { setModalError('Please select a customer.'); return; }
    if (iItems.some(i => !i.partId)) { setModalError('Select a part for every line.'); return; }
    if (iItems.some(i => i.quantity <= 0 || i.unitPrice <= 0)) { setModalError('Quantity and price must be > 0.'); return; }
    setModalError(''); setModalLoading(true);
    try {
      const res = await fetch(`${API}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ invoiceNumber: iNumber, customerId: iCustomerId, vehicleId: iVehicleId || null, notes: iNotes, items: iItems })
      });
      if (res.ok) {
        setShowModal(false); resetModal(); await loadAll();
      } else { const msg = await res.text(); setModalError(msg || 'Failed.'); }
    } catch { setModalError('Network error.'); }
    finally { setModalLoading(false); }
  };

  const resetModal = () => { setINumber(''); setICustomerId(0); setIVehicleId(0); setINotes(''); setIItems([{ partId: 0, quantity: 1, unitPrice: 0 }]); setModalError(''); };

  const handleStatusChange = async (id: number, status: string) => {
    await fetch(`${API}/api/sales/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ status })
    });
    await loadAll();
  };

  const handleSendEmail = async (id: number) => {
    const res = await fetch(`${API}/api/sales/${id}/send-email`, {
      method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }
    });
    const data = await res.json();
    alert(data.message || 'Email sent.');
    await loadAll();
  };

  const StatusIcon = ({ s }: { s: string }) =>
    s === 'Paid' ? <CheckCircle size={14} /> : s === 'Pending' ? <Clock size={14} /> : <XCircle size={14} />;

  return (
    <div className="admin-portal-wrapper">
      <header className="admin-portal-header">
        <div className="admin-header-container">
          <div className="admin-logo-group">
            <Link href="/" className="admin-back-btn"><ArrowLeft size={18} /><span>Back</span></Link>
            <h1>Redline Auto Garage <span className="red-badge">Sales & Invoices</span></h1>
          </div>
          <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
            <Link href="/staff/customers" style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>Customers</Link>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
            <Link href="/staff/sales" style={{ color: 'var(--primary-accent)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>Sales & Invoices</Link>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
            <Link href="/staff/reports" style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>Reports</Link>
          </div>
          <div className="admin-user-info"><Shield size={18} className="shield-icon" /><span>Staff Portal</span></div>
        </div>
      </header>

      <main className="admin-main-container">
        {error ? (
          <div className="admin-error-card"><h2>Access Denied</h2><p>{error}</p></div>
        ) : loading ? (
          <div className="admin-loading-screen"><Loader2 className="loading-spinner" /><p>Loading invoices...</p></div>
        ) : (
          <>
            {/* Stats */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="stat-icon-box blue"><FileText size={24} /></div>
                <div className="stat-info"><h3>{invoices.length}</h3><p>TOTAL INVOICES</p></div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-icon-box green"><CheckCircle size={24} /></div>
                <div className="stat-info">
                  <h3>${invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.totalAmount, 0).toFixed(0)}</h3>
                  <p>COLLECTED</p>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-icon-box red"><XCircle size={24} /></div>
                <div className="stat-info">
                  <h3>${invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + i.totalAmount, 0).toFixed(0)}</h3>
                  <p>OUTSTANDING</p>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-icon-box purple"><Clock size={24} /></div>
                <div className="stat-info"><h3>{invoices.filter(i => i.status === 'Pending').length}</h3><p>PENDING</p></div>
              </div>
            </div>

            {/* Controls */}
            <div className="admin-controls-card">
              <div className="search-and-filters">
                <div className="search-box-wrapper">
                  <Search size={18} className="search-icon" />
                  <input type="text" placeholder="Search by invoice #, customer..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }} />
                </div>
                <div className="filter-select-group">
                  <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                    <option value="All">All Statuses</option>
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
              <button className="create-staff-btn" onClick={() => { resetModal(); setShowModal(true); }}>
                <PlusCircle size={18} /><span>New Sales Invoice</span>
              </button>
            </div>

            {/* Table */}
            <div className="users-table-card">
              <h2>Invoice History</h2>
              <div className="table-responsive-wrapper">
                <table className="users-dashboard-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Customer</th>
                      <th>Vehicle</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Email</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr><td colSpan={8} className="table-empty-row">No invoices found.</td></tr>
                    ) : paginated.map(inv => (
                      <React.Fragment key={inv.id}>
                        <tr>
                          <td><strong style={{ fontFamily: 'monospace' }}>{inv.invoiceNumber}</strong></td>
                          <td>
                            <div className="meta-text">
                              <span className="username">{inv.customer.username}</span>
                              <span className="user-id">{inv.customer.email}</span>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            {inv.vehicle ? `${inv.vehicle.vehicleNumber} – ${inv.vehicle.make} ${inv.vehicle.model}` : '—'}
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {new Date(inv.saleDate).toLocaleDateString()}
                          </td>
                          <td><strong style={{ color: '#22c55e' }}>${inv.totalAmount.toFixed(2)}</strong></td>
                          <td>
                            <span style={{
                              ...STATUS_COLORS[inv.status],
                              padding: '0.3rem 0.8rem', borderRadius: '20px',
                              fontSize: '0.75rem', fontWeight: 700,
                              display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
                            }}>
                              <StatusIcon s={inv.status} />{inv.status}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.75rem', color: inv.emailSent ? '#22c55e' : 'var(--text-secondary)' }}>
                              {inv.emailSent ? '✓ Sent' : 'Not sent'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              <button className="toggle-status-btn activate"
                                onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
                                style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                                <ChevronDown size={13} /><span>Items</span>
                              </button>
                              {inv.status !== 'Paid' && (
                                <button className="toggle-status-btn activate"
                                  onClick={() => handleStatusChange(inv.id, 'Paid')}
                                  style={{ borderColor: '#22c55e', color: '#22c55e' }}>
                                  Mark Paid
                                </button>
                              )}
                              {!inv.emailSent && (
                                <button className="toggle-status-btn activate"
                                  onClick={() => handleSendEmail(inv.id)}
                                  style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                                  <Mail size={13} /><span>Email</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expandedId === inv.id && (
                          <tr>
                            <td colSpan={8} style={{ background: '#050505', padding: 0 }}>
                              <div style={{ padding: '0.8rem 1.5rem', borderTop: '1px solid var(--borders)' }}>
                                <table style={{ width: '100%', fontSize: '0.83rem' }}>
                                  <thead>
                                    <tr style={{ color: 'var(--text-secondary)' }}>
                                      <th style={{ padding: '0.4rem', textAlign: 'left', fontWeight: 600 }}>Part</th>
                                      <th style={{ padding: '0.4rem', textAlign: 'center', fontWeight: 600 }}>Qty</th>
                                      <th style={{ padding: '0.4rem', textAlign: 'center', fontWeight: 600 }}>Unit Price</th>
                                      <th style={{ padding: '0.4rem', textAlign: 'right', fontWeight: 600 }}>Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {inv.items.map(item => (
                                      <tr key={item.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                        <td style={{ padding: '0.4rem' }}>{item.partName}</td>
                                        <td style={{ padding: '0.4rem', textAlign: 'center' }}>{item.quantity}</td>
                                        <td style={{ padding: '0.4rem', textAlign: 'center' }}>${item.unitPrice.toFixed(2)}</td>
                                        <td style={{ padding: '0.4rem', textAlign: 'right', fontWeight: 700 }}>${(item.quantity * item.unitPrice).toFixed(2)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {inv.notes && <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Note: {inv.notes}</p>}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={p => { setPage(p); setExpandedId(null); }} pageSize={PAGE_SIZE} totalItems={filtered.length} />
            </div>
          </>
        )}
      </main>

      {/* New Invoice Modal */}
      {showModal && (
        <div className="staff-modal-overlay">
          <div className="staff-modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>Create Sales Invoice</h2>
              <button className="close-modal-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            {modalError && <div className="modal-error-message">{modalError}</div>}
            <form onSubmit={handleCreateInvoice} className="modal-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="modal-form-group">
                  <label>Invoice Number *</label>
                  <div className="modal-input-wrapper">
                    <FileText size={16} className="modal-input-icon" />
                    <input type="text" placeholder="SI-2026-001" value={iNumber} onChange={e => setINumber(e.target.value)} required />
                  </div>
                </div>
                <div className="modal-form-group">
                  <label>Customer *</label>
                  <select value={iCustomerId} onChange={e => { setICustomerId(parseInt(e.target.value)); setIVehicleId(0); }}
                    style={{ width: '100%', backgroundColor: '#060606', border: '1px solid var(--borders)', borderRadius: '6px', padding: '0.75rem', color: '#fff', fontSize: '0.9rem' }}>
                    <option value={0}>Select customer...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.username} ({c.email})</option>)}
                  </select>
                </div>
              </div>

              {selectedCustomer && selectedCustomer.vehicles.length > 0 && (
                <div className="modal-form-group">
                  <label>Vehicle (optional)</label>
                  <select value={iVehicleId} onChange={e => setIVehicleId(parseInt(e.target.value))}
                    style={{ width: '100%', backgroundColor: '#060606', border: '1px solid var(--borders)', borderRadius: '6px', padding: '0.75rem', color: '#fff', fontSize: '0.9rem' }}>
                    <option value={0}>No specific vehicle</option>
                    {selectedCustomer.vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicleNumber} – {v.make} {v.model}</option>)}
                  </select>
                </div>
              )}

              {/* Line Items */}
              <div className="modal-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label style={{ margin: 0 }}>Parts *</label>
                  <button type="button" onClick={addItemRow} style={{ background: 'none', border: 'none', color: 'var(--primary-accent)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <PlusCircle size={14} /> Add Line
                  </button>
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {iItems.map((item, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 0.8fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                      <select value={item.partId} onChange={e => handlePartSelect(i, parseInt(e.target.value))}
                        style={{ backgroundColor: '#060606', border: '1px solid var(--borders)', borderRadius: '6px', padding: '0.5rem', color: '#fff', fontSize: '0.83rem' }}>
                        <option value={0}>Select part...</option>
                        {parts.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stockQuantity})</option>)}
                      </select>
                      <input type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)}
                        style={{ backgroundColor: '#060606', border: '1px solid var(--borders)', borderRadius: '6px', padding: '0.5rem', color: '#fff', fontSize: '0.83rem', textAlign: 'center' }} />
                      <input type="number" step="0.01" min="0" value={item.unitPrice || ''} onChange={e => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                        style={{ backgroundColor: '#060606', border: '1px solid var(--borders)', borderRadius: '6px', padding: '0.5rem', color: '#fff', fontSize: '0.83rem', textAlign: 'center' }}
                        placeholder="Price" />
                      <button type="button" onClick={() => removeItemRow(i)} disabled={iItems.length === 1}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: iItems.length === 1 ? 0.3 : 1 }}>
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-form-group">
                <label>Notes</label>
                <textarea value={iNotes} onChange={e => setINotes(e.target.value)} placeholder="Optional note for this invoice..."
                  style={{ width: '100%', minHeight: '60px', backgroundColor: '#060606', border: '1px solid var(--borders)', borderRadius: '6px', padding: '0.7rem', color: '#fff', fontSize: '0.9rem', fontFamily: 'inherit' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: '0.8rem 1rem', borderRadius: '6px', border: '1px solid var(--borders)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>INVOICE TOTAL</span>
                <strong style={{ fontSize: '1.4rem', color: '#22c55e' }}>${invoiceTotal.toFixed(2)}</strong>
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="modal-submit-btn" disabled={modalLoading}>
                  {modalLoading ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
