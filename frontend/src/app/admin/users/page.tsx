'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, UserPlus, Power, Shield, Mail, Phone, Lock, 
  User, Search, Plus, CheckCircle, XCircle, Loader2, ArrowLeft, KeyRound
} from 'lucide-react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';

interface UserItem {
  id: number;
  username: string;
  email: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
}

export default function AdminUsersDashboard() {
  const router = useRouter();
  
  // State
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Create Staff Modal State
  const [showModal, setShowModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSuccess, setModalSuccess] = useState('');

  // Authentication check & Fetch Users
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Simple JWT parse
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
        if (role !== 'Admin') {
          setError('Unauthorized. Only Admins can access this panel.');
          setLoading(false);
          return;
        }
      } catch (e) {
        router.push('/login');
        return;
      }

      await fetchUsers(token);
    };

    checkAuthAndFetch();
  }, [router]);

  const fetchUsers = async (token: string) => {
    try {
      const response = await fetch('http://localhost:5215/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setError('Failed to retrieve users. Please re-login.');
      }
    } catch (err) {
      setError('Connection to backend failed. Please ensure the server is active.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle User Active Status
  const handleToggleActive = async (userId: number, currentStatus: boolean) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setActionLoading(userId);
    try {
      const response = await fetch(`http://localhost:5215/api/admin/users/${userId}/toggle-active`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        // Update local list
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u));
      } else {
        alert('Failed to update status.');
      }
    } catch (err) {
      alert('Error updating user status.');
    } finally {
      setActionLoading(null);
    }
  };

  // Create Staff
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');
    setModalLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      setModalError('Session expired. Please log in.');
      setModalLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{6,}$/;
    if (!passwordRegex.test(staffPassword)) {
      setModalError('Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.');
      setModalLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5215/api/admin/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: staffName,
          email: staffEmail,
          phoneNumber: staffPhone,
          password: staffPassword
        })
      });

      if (response.ok) {
        setModalSuccess('Staff member created successfully!');
        setStaffName('');
        setStaffEmail('');
        setStaffPhone('');
        setStaffPassword('');
        
        // Refresh users list
        await fetchUsers(token);
        
        // Auto-close modal after 1.5 seconds
        setTimeout(() => {
          setShowModal(false);
          setModalSuccess('');
        }, 1500);
      } else {
        const errText = await response.text();
        setModalError(errText || 'Failed to create staff member.');
      }
    } catch (err) {
      setModalError('Network error. Failed to create staff member.');
    } finally {
      setModalLoading(false);
    }
  };

  // Stats Counters
  const totalCustomers = users.filter(u => u.role === 'Customer').length;
  const totalStaff = users.filter(u => u.role === 'Staff').length;
  const activeCount = users.filter(u => u.isActive).length;
  const inactiveCount = users.filter(u => !u.isActive).length;

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  // Filtered Users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phoneNumber.includes(searchQuery);
    const matchesRole = roleFilter === 'All' ? true : user.role === roleFilter;
    const matchesStatus = 
      statusFilter === 'All' ? true : 
      statusFilter === 'Active' ? user.isActive : !user.isActive;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, page]);

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);

  return (
    <div className="admin-portal-wrapper">
      {/* Top Banner Navigation */}
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
            <Link href="/admin/users" style={{ color: 'var(--primary-accent)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
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

      {/* Main Content Dashboard */}
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
            <p>Loading User Administration...</p>
          </div>
        ) : (
          <>
            {/* Stats Dashboard Grid */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="stat-icon-box blue">
                  <Users size={24} />
                </div>
                <div className="stat-info">
                  <h3>{totalCustomers}</h3>
                  <p>TOTAL CUSTOMERS</p>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-icon-box purple">
                  <Shield size={24} />
                </div>
                <div className="stat-info">
                  <h3>{totalStaff}</h3>
                  <p>STAFF MEMBERS</p>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-icon-box green">
                  <CheckCircle size={24} />
                </div>
                <div className="stat-info">
                  <h3>{activeCount}</h3>
                  <p>ACTIVE ACCOUNTS</p>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-icon-box red">
                  <XCircle size={24} />
                </div>
                <div className="stat-info">
                  <h3>{inactiveCount}</h3>
                  <p>INACTIVE ACCOUNTS</p>
                </div>
              </div>
            </div>

            {/* User Control & Search Bar */}
            <div className="admin-controls-card">
              <div className="search-and-filters">
                <div className="search-box-wrapper">
                  <Search size={18} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search by name, email, or phone..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="filter-select-group">
                  <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="All">All Roles</option>
                    <option value="Customer">Customers</option>
                    <option value="Staff">Staff</option>
                  </select>

                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <button className="create-staff-btn" onClick={() => setShowModal(true)}>
                <UserPlus size={18} />
                <span>Create New Staff</span>
              </button>
            </div>

            {/* Users Listing Table */}
            <div className="users-table-card">
              <h2>User Management Directory</h2>
              <div className="table-responsive-wrapper">
                <table className="users-dashboard-table">
                  <thead>
                    <tr>
                      <th>User Info</th>
                      <th>Email Address</th>
                      <th>Phone Number</th>
                      <th>System Role</th>
                      <th>Account Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="table-empty-row">
                          No registered users found matching the selected filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((user) => (
                        <tr key={user.id} className={!user.isActive ? 'inactive-row' : ''}>
                          <td>
                            <div className="user-profile-meta">
                              <div className={`avatar-initials ${user.role.toLowerCase()}`}>
                                {user.username.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="meta-text">
                                <span className="username">{user.username}</span>
                                <span className="user-id">ID: #{user.id}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="email-meta">
                              <Mail size={14} className="meta-icon" />
                              <span>{user.email}</span>
                            </div>
                          </td>
                          <td>
                            <div className="phone-meta">
                              <Phone size={14} className="meta-icon" />
                              <span>{user.phoneNumber || 'N/A'}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`role-badge ${user.role.toLowerCase()}`}>
                              {user.role}
                            </span>
                          </td>
                          <td>
                            <span className={`status-pill ${user.isActive ? 'active' : 'inactive'}`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              className={`toggle-status-btn ${user.isActive ? 'deactivate' : 'activate'}`}
                              onClick={() => handleToggleActive(user.id, user.isActive)}
                              disabled={actionLoading === user.id}
                            >
                              {actionLoading === user.id ? (
                                <Loader2 className="btn-spinner" />
                              ) : (
                                <>
                                  <Power size={14} />
                                  <span>{user.isActive ? 'Deactivate' : 'Activate'}</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={p => setPage(p)}
                pageSize={PAGE_SIZE}
                totalItems={filteredUsers.length}
              />
            </div>
          </>
        )}
      </main>

      {/* Create Staff Modal */}
      {showModal && (
        <div className="staff-modal-overlay">
          <div className="staff-modal-content">
            <div className="modal-header">
              <h2>Create Staff Account</h2>
              <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            
            {modalError && <div className="modal-error-message">{modalError}</div>}
            {modalSuccess && <div className="modal-success-message">{modalSuccess}</div>}

            <form onSubmit={handleCreateStaff} className="modal-form">
              <div className="modal-form-group">
                <label>Staff Full Name</label>
                <div className="modal-input-wrapper">
                  <User size={16} className="modal-input-icon" />
                  <input 
                    type="text" 
                    placeholder="Enter full name" 
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="modal-form-group">
                <label>Email Address</label>
                <div className="modal-input-wrapper">
                  <Mail size={16} className="modal-input-icon" />
                  <input 
                    type="email" 
                    placeholder="Enter email address" 
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="modal-form-group">
                <label>Phone Number</label>
                <div className="modal-input-wrapper">
                  <Phone size={16} className="modal-input-icon" />
                  <input 
                    type="tel" 
                    placeholder="Enter phone number" 
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="modal-form-group">
                <label>Secure Password</label>
                <div className="modal-input-wrapper">
                  <Lock size={16} className="modal-input-icon" />
                  <input 
                    type="password" 
                    placeholder="Create secure password" 
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-cancel-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="modal-submit-btn" disabled={modalLoading}>
                  {modalLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
