'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, Shield, TrendingUp, Users,
  AlertTriangle, Star, DollarSign, FileText
} from 'lucide-react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';

const PAGE_SIZE = 10;
const API = 'http://localhost:5215';

interface Regular { customerId: number; customerName: string; customerEmail: string; customerPhone: string; invoiceCount: number; totalSpent: number; }
interface Spender extends Regular { }
interface PendingCredit {
  id: number; invoiceNumber: string; saleDate: string; totalAmount: number; status: string;
  customer: { username: string; email: string; phoneNumber: string };
  vehicle?: { vehicleNumber: string; make: string; model: string };
}
interface Summary { totalRevenue: number; paidAmount: number; pendingAmount: number; invoiceCount: number; }

export default function StaffReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'regulars' | 'spenders' | 'pending'>('summary');

  const [summary, setSummary] = useState<Summary | null>(null);
  const [regulars, setRegulars] = useState<Regular[]>([]);
  const [spenders, setSpenders] = useState<Spender[]>([]);
  const [pending, setPending] = useState<PendingCredit[]>([]);

  const [regularPage, setRegularPage] = useState(1);
  const [spenderPage, setSpenderPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);

  const getToken = () => localStorage.getItem('token') ?? '';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    try {
      const p = JSON.parse(atob(token.split('.')[1]));
      const role = p['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      if (role !== 'Admin' && role !== 'Staff') { setError('Staff/Admin only.'); setLoading(false); return; }
    } catch { router.push('/login'); return; }
    loadReports();
  }, [router]);

  const loadReports = async () => {
    setLoading(true);
    const h = { headers: { Authorization: `Bearer ${getToken()}` } };
    const [sumRes, regRes, spdRes, penRes] = await Promise.all([
      fetch(`${API}/api/sales/reports/summary`, h),
      fetch(`${API}/api/sales/reports/regulars`, h),
      fetch(`${API}/api/sales/reports/high-spenders`, h),
      fetch(`${API}/api/sales/reports/pending-credits`, h),
    ]);
    if (sumRes.ok) setSummary(await sumRes.json());
    if (regRes.ok) setRegulars(await regRes.json());
    if (spdRes.ok) setSpenders(await spdRes.json());
    if (penRes.ok) setPending(await penRes.json());
    setLoading(false);
  };

  const pagedRegulars = useMemo(() => regulars.slice((regularPage - 1) * PAGE_SIZE, regularPage * PAGE_SIZE), [regulars, regularPage]);
  const pagedSpenders = useMemo(() => spenders.slice((spenderPage - 1) * PAGE_SIZE, spenderPage * PAGE_SIZE), [spenders, spenderPage]);
  const pagedPending = useMemo(() => pending.slice((pendingPage - 1) * PAGE_SIZE, pendingPage * PAGE_SIZE), [pending, pendingPage]);

  const tabs = [
    { key: 'summary', label: 'Revenue Summary', icon: <TrendingUp size={16} /> },
    { key: 'regulars', label: `Regular Customers (${regulars.length})`, icon: <Star size={16} /> },
    { key: 'spenders', label: `Top Spenders (${spenders.length})`, icon: <DollarSign size={16} /> },
    { key: 'pending', label: `Pending Credits (${pending.length})`, icon: <AlertTriangle size={16} /> },
  ] as const;

  return (
    <div className="admin-portal-wrapper">
      <header className="admin-portal-header">
        <div className="admin-header-container">
          <div className="admin-logo-group">
            <Link href="/" className="admin-back-btn"><ArrowLeft size={18} /><span>Back</span></Link>
            <h1>Redline Auto Garage <span className="red-badge">Reports</span></h1>
          </div>
          <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
            <Link href="/staff/customers" style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>Customers</Link>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
            <Link href="/staff/sales" style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>Sales & Invoices</Link>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
            <Link href="/staff/reports" style={{ color: 'var(--primary-accent)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>Reports</Link>
          </div>
          <div className="admin-user-info"><Shield size={18} className="shield-icon" /><span>Staff Portal</span></div>
        </div>
      </header>

      <main className="admin-main-container">
        {error ? (
          <div className="admin-error-card"><h2>Access Denied</h2><p>{error}</p></div>
        ) : loading ? (
          <div className="admin-loading-screen"><Loader2 className="loading-spinner" /><p>Generating reports...</p></div>
        ) : (
          <>
            {/* Tab bar */}
            <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.7rem 1.4rem', borderRadius: '6px', border: 'none',
                    backgroundColor: activeTab === t.key ? 'var(--primary-accent)' : '#0f0f0f',
                    color: '#fff', fontWeight: activeTab === t.key ? 800 : 500,
                    fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            {/* SUMMARY TAB */}
            {activeTab === 'summary' && summary && (
              <div>
                <div className="admin-stats-grid">
                  <div className="admin-stat-card">
                    <div className="stat-icon-box green"><DollarSign size={24} /></div>
                    <div className="stat-info"><h3>${summary.totalRevenue.toFixed(2)}</h3><p>TOTAL REVENUE</p></div>
                  </div>
                  <div className="admin-stat-card">
                    <div className="stat-icon-box blue"><DollarSign size={24} /></div>
                    <div className="stat-info"><h3>${summary.paidAmount.toFixed(2)}</h3><p>COLLECTED (PAID)</p></div>
                  </div>
                  <div className="admin-stat-card">
                    <div className="stat-icon-box red"><AlertTriangle size={24} /></div>
                    <div className="stat-info"><h3>${summary.pendingAmount.toFixed(2)}</h3><p>OUTSTANDING</p></div>
                  </div>
                  <div className="admin-stat-card">
                    <div className="stat-icon-box purple"><FileText size={24} /></div>
                    <div className="stat-info"><h3>{summary.invoiceCount}</h3><p>TOTAL INVOICES</p></div>
                  </div>
                </div>
                <div className="users-table-card" style={{ marginTop: '1.5rem' }}>
                  <h2>Revenue Breakdown</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', padding: '1rem 0' }}>
                    {[
                      { label: 'Collection Rate', value: summary.totalRevenue > 0 ? ((summary.paidAmount / summary.totalRevenue) * 100).toFixed(1) + '%' : '0%', color: '#22c55e' },
                      { label: 'Avg Invoice Value', value: summary.invoiceCount > 0 ? '$' + (summary.totalRevenue / summary.invoiceCount).toFixed(2) : '$0', color: '#60a5fa' },
                      { label: 'Pending Ratio', value: summary.totalRevenue > 0 ? ((summary.pendingAmount / summary.totalRevenue) * 100).toFixed(1) + '%' : '0%', color: '#f59e0b' },
                    ].map(m => (
                      <div key={m.label} style={{ background: '#0a0a0a', border: '1px solid var(--borders)', borderRadius: '8px', padding: '1.5rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: m.color }}>{m.value}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* REGULARS TAB */}
            {activeTab === 'regulars' && (
              <div className="users-table-card">
                <h2>Regular Customers <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '0.85rem' }}>(3+ purchases)</span></h2>
                {regulars.length === 0 ? (
                  <div className="table-empty-row" style={{ textAlign: 'center', padding: '3rem' }}>No regular customers yet — requires 3+ sales invoices per customer.</div>
                ) : (
                  <>
                    <div className="table-responsive-wrapper">
                      <table className="users-dashboard-table">
                        <thead><tr><th>Customer</th><th>Email</th><th>Phone</th><th>Invoices</th><th style={{ textAlign: 'right' }}>Total Spent</th></tr></thead>
                        <tbody>
                          {pagedRegulars.map(r => (
                            <tr key={r.customerId}>
                              <td><div className="user-profile-meta">
                                <div className="avatar-initials customer">{r.customerName.substring(0, 2).toUpperCase()}</div>
                                <div className="meta-text"><span className="username">{r.customerName}</span></div>
                              </div></td>
                              <td style={{ fontSize: '0.85rem' }}>{r.customerEmail}</td>
                              <td style={{ fontSize: '0.85rem' }}>{r.customerPhone}</td>
                              <td><span className="role-badge staff">{r.invoiceCount} orders</span></td>
                              <td style={{ textAlign: 'right' }}><strong style={{ color: '#22c55e' }}>${r.totalSpent.toFixed(2)}</strong></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination currentPage={regularPage} totalPages={Math.ceil(regulars.length / PAGE_SIZE)} onPageChange={setRegularPage} pageSize={PAGE_SIZE} totalItems={regulars.length} />
                  </>
                )}
              </div>
            )}

            {/* HIGH SPENDERS TAB */}
            {activeTab === 'spenders' && (
              <div className="users-table-card">
                <h2>Top 20 High Spenders</h2>
                <div className="table-responsive-wrapper">
                  <table className="users-dashboard-table">
                    <thead><tr><th>Rank</th><th>Customer</th><th>Email</th><th>Invoices</th><th style={{ textAlign: 'right' }}>Total Spent</th></tr></thead>
                    <tbody>
                      {pagedSpenders.length === 0 ? (
                        <tr><td colSpan={5} className="table-empty-row">No sales data yet.</td></tr>
                      ) : pagedSpenders.map((s, i) => (
                        <tr key={s.customerId}>
                          <td><span style={{ fontWeight: 800, fontSize: '1.1rem', color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : 'var(--text-secondary)' }}>#{(spenderPage - 1) * PAGE_SIZE + i + 1}</span></td>
                          <td><div className="user-profile-meta">
                            <div className="avatar-initials staff">{s.customerName.substring(0, 2).toUpperCase()}</div>
                            <div className="meta-text"><span className="username">{s.customerName}</span></div>
                          </div></td>
                          <td style={{ fontSize: '0.85rem' }}>{s.customerEmail}</td>
                          <td><span className="role-badge customer">{s.invoiceCount}</span></td>
                          <td style={{ textAlign: 'right' }}><strong style={{ color: '#22c55e', fontSize: '1rem' }}>${s.totalSpent.toFixed(2)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination currentPage={spenderPage} totalPages={Math.ceil(spenders.length / PAGE_SIZE)} onPageChange={setSpenderPage} pageSize={PAGE_SIZE} totalItems={spenders.length} />
              </div>
            )}

            {/* PENDING CREDITS TAB */}
            {activeTab === 'pending' && (
              <div className="users-table-card">
                <h2>Pending / Unpaid Credits</h2>
                <div className="table-responsive-wrapper">
                  <table className="users-dashboard-table">
                    <thead><tr><th>Invoice #</th><th>Customer</th><th>Vehicle</th><th>Date</th><th>Status</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                    <tbody>
                      {pagedPending.length === 0 ? (
                        <tr><td colSpan={6} className="table-empty-row">All invoices are settled!</td></tr>
                      ) : pagedPending.map(p => (
                        <tr key={p.id}>
                          <td><strong style={{ fontFamily: 'monospace' }}>{p.invoiceNumber}</strong></td>
                          <td><div className="meta-text">
                            <span className="username">{p.customer.username}</span>
                            <span className="user-id">{p.customer.phoneNumber}</span>
                          </div></td>
                          <td style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                            {p.vehicle ? `${p.vehicle.vehicleNumber} – ${p.vehicle.make}` : '—'}
                          </td>
                          <td style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{new Date(p.saleDate).toLocaleDateString()}</td>
                          <td>
                            <span style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                              backgroundColor: p.status === 'Pending' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                              color: p.status === 'Pending' ? '#f59e0b' : '#ef4444' }}>
                              {p.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}><strong style={{ color: '#ef4444' }}>${p.totalAmount.toFixed(2)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination currentPage={pendingPage} totalPages={Math.ceil(pending.length / PAGE_SIZE)} onPageChange={setPendingPage} pageSize={PAGE_SIZE} totalItems={pending.length} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
