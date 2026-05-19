'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, Shield, TrendingUp,
  AlertTriangle, DollarSign, FileText, Calendar
} from 'lucide-react';
import Link from 'next/link';

const API = 'http://localhost:5215';

interface ReportItem {
  date?: string;
  month?: number;
  monthName?: string;
  year?: number;
  revenue: number;
  discount: number;
  count: number;
}

export default function AdminFinancialReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [reportData, setReportData] = useState<ReportItem[]>([]);

  const getToken = () => localStorage.getItem('token') ?? '';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      if (role !== 'Admin') {
        setError('Administrator access only.');
        setLoading(false);
        return;
      }
    } catch {
      router.push('/login');
      return;
    }
    loadFinancialReport();
  }, [router, period, selectedYear, selectedMonth]);

  const loadFinancialReport = async () => {
    setLoading(true);
    try {
      const h = { headers: { Authorization: `Bearer ${getToken()}` } };
      let url = `${API}/api/sales/reports/financial?period=${period}`;
      if (period === 'daily') {
        url += `&year=${selectedYear}&month=${selectedMonth}`;
      } else if (period === 'monthly') {
        url += `&year=${selectedYear}`;
      }
      
      const res = await fetch(url, h);
      if (res.ok) {
        const json = await res.json();
        setReportData(json.data || []);
      } else {
        const txt = await res.text();
        setError(txt || 'Failed to fetch financial reports.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading reports.');
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const totalGrossRevenue = reportData.reduce((sum, item) => sum + item.revenue + item.discount, 0);
  const totalDiscounts = reportData.reduce((sum, item) => sum + item.discount, 0);
  const totalNetRevenue = reportData.reduce((sum, item) => sum + item.revenue, 0);
  const totalSalesCount = reportData.reduce((sum, item) => sum + item.count, 0);

  const monthsList = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' }
  ];

  const currentYear = new Date().getFullYear();
  const yearsList = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="admin-portal-wrapper">
      <header className="admin-portal-header">
        <div className="admin-header-container">
          <div className="admin-logo-group">
            <Link href="/" className="admin-back-btn">
              <ArrowLeft size={18} />
              <span>Back to Site</span>
            </Link>
            <h1>Redline Auto Garage <span className="red-badge">Admin Panel</span></h1>
          </div>
          
          <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/admin/users" style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
              Users
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
            <Link href="/admin/parts" style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
              Parts & Invoices
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
            <Link href="/admin/vendors" style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
              Vendors
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
            <Link href="/admin/reports" style={{ color: 'var(--primary-accent)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
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
            <h2>Access Denied</h2>
            <p>{error}</p>
            <Link href="/login" className="admin-login-redirect">Go to Login</Link>
          </div>
        ) : (
          <>
            {/* Header / Report Filter controls */}
            <div className="admin-controls-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(['daily', 'monthly', 'yearly'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      style={{
                        padding: '0.6rem 1.2rem',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: period === p ? 'var(--primary-accent)' : '#0f0f0f',
                        color: '#fff',
                        fontWeight: period === p ? 800 : 500,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        transition: 'all 0.2s'
                      }}
                    >
                      {p} Report
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                  {period !== 'yearly' && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        style={{
                          backgroundColor: '#0a0a0a',
                          color: '#fff',
                          border: '1px solid var(--borders)',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          outline: 'none',
                          fontWeight: 600
                        }}
                      >
                        {yearsList.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {period === 'daily' && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        style={{
                          backgroundColor: '#0a0a0a',
                          color: '#fff',
                          border: '1px solid var(--borders)',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          outline: 'none',
                          fontWeight: 600
                        }}
                      >
                        {monthsList.map(m => (
                          <option key={m.value} value={m.value}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="admin-loading-screen" style={{ marginTop: '3rem' }}>
                <Loader2 className="loading-spinner" />
                <p>Generating financial reports...</p>
              </div>
            ) : (
              <>
                {/* Stats Dashboard Grid */}
                <div className="admin-stats-grid" style={{ marginTop: '1.5rem' }}>
                  <div className="admin-stat-card">
                    <div className="stat-icon-box blue">
                      <DollarSign size={24} />
                    </div>
                    <div className="stat-info">
                      <h3>${totalGrossRevenue.toFixed(2)}</h3>
                      <p>GROSS REVENUE</p>
                    </div>
                  </div>

                  <div className="admin-stat-card">
                    <div className="stat-icon-box purple">
                      <Calendar size={24} />
                    </div>
                    <div className="stat-info">
                      <h3>${totalDiscounts.toFixed(2)}</h3>
                      <p>LOYALTY DISCOUNTS</p>
                    </div>
                  </div>

                  <div className="admin-stat-card">
                    <div className="stat-icon-box green">
                      <DollarSign size={24} />
                    </div>
                    <div className="stat-info">
                      <h3>${totalNetRevenue.toFixed(2)}</h3>
                      <p>NET REVENUE</p>
                    </div>
                  </div>

                  <div className="admin-stat-card">
                    <div className="stat-icon-box red">
                      <FileText size={24} />
                    </div>
                    <div className="stat-info">
                      <h3>{totalSalesCount}</h3>
                      <p>INVOICES GENERATED</p>
                    </div>
                  </div>
                </div>

                {/* Financial Table card */}
                <div className="users-table-card" style={{ marginTop: '2rem' }}>
                  <h2>Financial Summary Details</h2>
                  <div className="table-responsive-wrapper">
                    <table className="users-dashboard-table">
                      <thead>
                        <tr>
                          <th>Period / Timeframe</th>
                          <th style={{ textAlign: 'right' }}>Invoices</th>
                          <th style={{ textAlign: 'right' }}>Gross Revenue</th>
                          <th style={{ textAlign: 'right' }}>Loyalty Discount</th>
                          <th style={{ textAlign: 'right' }}>Net Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="table-empty-row" style={{ textAlign: 'center', padding: '3rem' }}>
                              No financial records found for the selected parameters.
                            </td>
                          </tr>
                        ) : (
                          reportData.map((item, idx) => {
                            let label = '';
                            if (period === 'daily') {
                              label = item.date || '';
                            } else if (period === 'monthly') {
                              label = item.monthName || `Month ${item.month}`;
                            } else if (period === 'yearly') {
                              label = item.year?.toString() || '';
                            }

                            return (
                              <tr key={idx}>
                                <td>
                                  <strong style={{ fontSize: '0.9rem', color: 'var(--primary-accent)' }}>{label}</strong>
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.count}</td>
                                <td style={{ textAlign: 'right', color: '#94a3b8' }}>
                                  ${(item.revenue + item.discount).toFixed(2)}
                                </td>
                                <td style={{ textAlign: 'right', color: '#ef4444' }}>
                                  -${item.discount.toFixed(2)}
                                </td>
                                <td style={{ textAlign: 'right', color: '#22c55e', fontWeight: 700 }}>
                                  ${item.revenue.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
