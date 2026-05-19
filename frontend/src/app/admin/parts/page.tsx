'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Trash2, Edit3, AlertTriangle, History, FileText, CheckCircle2, 
  DollarSign, Package, Layers, Search, ArrowLeft, Loader2, X, PlusCircle
} from 'lucide-react';
import Link from 'next/link';

interface Part {
  id: number;
  name: string;
  partNumber: string;
  description: string;
  category: string;
  price: number;
  stockQuantity: number;
  minStockLevel: number;
}

interface InvoiceItem {
  id: number;
  partId: number;
  part?: Part;
  quantity: number;
  unitPrice: number;
}

interface PurchaseInvoice {
  id: number;
  invoiceNumber: string;
  supplierName: string;
  purchaseDate: string;
  totalAmount: number;
  items: InvoiceItem[];
}

export default function AdminPartsDashboard() {
  const router = useRouter();

  // Parts list state
  const [parts, setParts] = useState<Part[]>([]);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'parts' | 'invoices'>('parts');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');

  // Modal State for Parts (Add/Edit)
  const [showPartModal, setShowPartModal] = useState(false);
  const [isEditingPart, setIsEditingPart] = useState(false);
  const [editingPartId, setEditingPartId] = useState<number | null>(null);
  
  // Part Form State
  const [partName, setPartName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [partDesc, setPartDesc] = useState('');
  const [partCategory, setPartCategory] = useState('Engine');
  const [partPrice, setPartPrice] = useState('');
  const [partStock, setPartStock] = useState('0');
  const [partMinStock, setPartMinStock] = useState('5');
  const [partModalError, setPartModalError] = useState('');
  const [partModalLoading, setPartModalLoading] = useState(false);

  // Modal State for Purchase Invoice (Stock Update)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<{ partId: number; quantity: number; unitPrice: number }[]>([
    { partId: 0, quantity: 1, unitPrice: 0 }
  ]);
  const [invoiceModalError, setInvoiceModalError] = useState('');
  const [invoiceModalLoading, setInvoiceModalLoading] = useState(false);

  // Verify Admin Authentication
  useEffect(() => {
    const verifyAndFetch = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
        if (role !== 'Admin') {
          setError('Access restricted. Admins only.');
          setLoading(false);
          return;
        }
      } catch (e) {
        router.push('/login');
        return;
      }

      await fetchAllData(token);
    };

    verifyAndFetch();
  }, [router]);

  const fetchAllData = async (token: string) => {
    try {
      setLoading(true);
      // Fetch parts
      const partsRes = await fetch('http://localhost:5215/api/parts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let partsData: Part[] = [];
      if (partsRes.ok) {
        partsData = await partsRes.json();
        setParts(partsData);
      }

      // Fetch purchase invoices
      const invoicesRes = await fetch('http://localhost:5215/api/parts/purchase-invoices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        setInvoices(invoicesData);
      }
    } catch (err) {
      setError('Connection to backend API failed.');
    } finally {
      setLoading(false);
    }
  };

  // Create or Update Part
  const handlePartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPartModalError('');
    setPartModalLoading(true);

    const token = localStorage.getItem('token');
    if (!token) return;

    const payload = {
      name: partName,
      partNumber: partNumber,
      description: partDesc,
      category: partCategory,
      price: parseFloat(partPrice) || 0,
      stockQuantity: parseInt(partStock) || 0,
      minStockLevel: parseInt(partMinStock) || 5
    };

    try {
      const url = isEditingPart 
        ? `http://localhost:5215/api/parts/${editingPartId}`
        : 'http://localhost:5215/api/parts';
      
      const method = isEditingPart ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowPartModal(false);
        resetPartForm();
        await fetchAllData(token);
      } else {
        const errMsg = await response.text();
        setPartModalError(errMsg || 'An error occurred during submission.');
      }
    } catch (err) {
      setPartModalError('Failed to connect to the server.');
    } finally {
      setPartModalLoading(false);
    }
  };

  // Open Edit Part Modal
  const openEditModal = (part: Part) => {
    setIsEditingPart(true);
    setEditingPartId(part.id);
    setPartName(part.name);
    setPartNumber(part.partNumber);
    setPartDesc(part.description || '');
    setPartCategory(part.category);
    setPartPrice(part.price.toString());
    setPartStock(part.stockQuantity.toString());
    setPartMinStock(part.minStockLevel.toString());
    setShowPartModal(true);
  };

  const resetPartForm = () => {
    setIsEditingPart(false);
    setEditingPartId(null);
    setPartName('');
    setPartNumber('');
    setPartDesc('');
    setPartCategory('Engine');
    setPartPrice('');
    setPartStock('0');
    setPartMinStock('5');
    setPartModalError('');
  };

  // Delete Part
  const handleDeletePart = async (partId: number) => {
    if (!confirm('Are you sure you want to delete this part? This cannot be undone.')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5215/api/parts/${partId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchAllData(token);
      } else {
        const errMsg = await response.text();
        alert(errMsg || 'Failed to delete the part.');
      }
    } catch (err) {
      alert('Error connecting to backend.');
    }
  };

  // Add Item Line inside Invoice Creator
  const addInvoiceItemLine = () => {
    setInvoiceItems([...invoiceItems, { partId: 0, quantity: 1, unitPrice: 0 }]);
  };

  // Remove Item Line inside Invoice Creator
  const removeInvoiceItemLine = (index: number) => {
    if (invoiceItems.length === 1) return;
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  // Update Invoice Item Values dynamically
  const updateInvoiceItem = (index: number, field: 'partId' | 'quantity' | 'unitPrice', value: number) => {
    const updated = [...invoiceItems];
    updated[index][field] = value;
    setInvoiceItems(updated);
  };

  // Calculate Invoice total dynamically
  const calculateInvoiceTotal = () => {
    return invoiceItems.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);
  };

  // Submit Purchase Invoice
  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvoiceModalError('');

    // Validations
    if (!invoiceNumber.trim()) {
      setInvoiceModalError('Invoice number is required.');
      return;
    }
    if (!supplierName.trim()) {
      setInvoiceModalError('Supplier name is required.');
      return;
    }
    if (invoiceItems.some(i => i.partId === 0)) {
      setInvoiceModalError('Please select a valid vehicle part for all item lines.');
      return;
    }
    if (invoiceItems.some(i => i.quantity <= 0 || i.unitPrice <= 0)) {
      setInvoiceModalError('Quantity and Unit Price must be greater than zero.');
      return;
    }

    setInvoiceModalLoading(true);
    const token = localStorage.getItem('token');
    if (!token) return;

    const payload = {
      invoiceNumber,
      supplierName,
      purchaseDate: new Date().toISOString(),
      items: invoiceItems.map(i => ({
        partId: i.partId,
        quantity: i.quantity,
        unitPrice: i.unitPrice
      }))
    };

    try {
      const response = await fetch('http://localhost:5215/api/parts/purchase-invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowInvoiceModal(false);
        resetInvoiceForm();
        await fetchAllData(token);
      } else {
        const errMsg = await response.text();
        setInvoiceModalError(errMsg || 'Failed to submit purchase invoice.');
      }
    } catch (err) {
      setInvoiceModalError('Network error connecting to backend.');
    } finally {
      setInvoiceModalLoading(false);
    }
  };

  const resetInvoiceForm = () => {
    setInvoiceNumber('');
    setSupplierName('');
    setInvoiceItems([{ partId: 0, quantity: 1, unitPrice: 0 }]);
    setInvoiceModalError('');
  };

  // Category list
  const categories = ['Engine', 'Brakes', 'Suspension', 'Electrical', 'Transmission', 'Body & Trim', 'Accessories'];

  // Filtering Parts
  const filteredParts = parts.filter(part => {
    const matchesSearch = 
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.partNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' ? true : part.category === categoryFilter;
    
    const matchesStock = 
      stockFilter === 'All' ? true :
      stockFilter === 'Out' ? part.stockQuantity === 0 :
      stockFilter === 'Low' ? part.stockQuantity > 0 && part.stockQuantity <= part.minStockLevel :
      part.stockQuantity > part.minStockLevel;

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="admin-portal-wrapper">
      {/* Dynamic Top Banner */}
      <header className="admin-portal-header">
        <div className="admin-header-container">
          <div className="admin-logo-group">
            <Link href="/" className="admin-back-btn">
              <ArrowLeft size={18} />
              <span>Back to Site</span>
            </Link>
            <h1>Redline Auto Garage <span className="red-badge">Inventory Control</span></h1>
          </div>

          <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/admin/users" style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
              Users
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
            <Link href="/admin/parts" style={{ color: 'var(--primary-accent)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
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
            <Layers size={18} className="shield-icon" />
            <span>Parts & Stock Management</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
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
            <p>Retrieving Parts Directory and Invoices...</p>
          </div>
        ) : (
          <>
            {/* Quick Action Navigation Tabs */}
            <div className="admin-tabs-wrapper" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <button 
                className={`admin-tab-btn ${activeTab === 'parts' ? 'active' : ''}`}
                onClick={() => setActiveTab('parts')}
                style={{
                  padding: '0.8rem 2rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'parts' ? 'var(--primary-accent)' : '#0f0f0f',
                  color: '#fff',
                  borderBottom: activeTab === 'parts' ? '3px solid #fff' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Package size={18} />
                  <span>Parts Catalog ({parts.length})</span>
                </div>
              </button>
              <button 
                className={`admin-tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
                onClick={() => setActiveTab('invoices')}
                style={{
                  padding: '0.8rem 2rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'invoices' ? 'var(--primary-accent)' : '#0f0f0f',
                  color: '#fff',
                  borderBottom: activeTab === 'invoices' ? '3px solid #fff' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <History size={18} />
                  <span>Purchase Invoices ({invoices.length})</span>
                </div>
              </button>
            </div>

            {activeTab === 'parts' ? (
              <>
                {/* Control Panel Grid */}
                <div className="admin-controls-card">
                  <div className="search-and-filters">
                    <div className="search-box-wrapper">
                      <Search size={18} className="search-icon" />
                      <input 
                        type="text" 
                        placeholder="Search by part name or part number..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <div className="filter-select-group">
                      <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        <option value="All">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>

                      <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
                        <option value="All">All Stock Levels</option>
                        <option value="In">In Stock</option>
                        <option value="Low">Low Stock Warning</option>
                        <option value="Out">Out of Stock</option>
                      </select>
                    </div>
                  </div>

                  <div className="action-button-group" style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                      className="create-staff-btn" 
                      onClick={() => { resetInvoiceForm(); setShowInvoiceModal(true); }}
                      style={{ backgroundColor: '#22c55e' }}
                    >
                      <PlusCircle size={18} />
                      <span>Purchase Stock (Invoice)</span>
                    </button>
                    <button className="create-staff-btn" onClick={() => { resetPartForm(); setShowPartModal(true); }}>
                      <Plus size={18} />
                      <span>New Part Definition</span>
                    </button>
                  </div>
                </div>

                {/* Catalog Listing */}
                <div className="users-table-card">
                  <h2>Vehicle Parts Catalog</h2>
                  <div className="table-responsive-wrapper">
                    <table className="users-dashboard-table">
                      <thead>
                        <tr>
                          <th>Part Information</th>
                          <th>Part Number</th>
                          <th>Category</th>
                          <th>Unit Retail Price</th>
                          <th>Stock Level</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredParts.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="table-empty-row">
                              No vehicle parts registered matching your current selection.
                            </td>
                          </tr>
                        ) : (
                          filteredParts.map(part => {
                            const isOutOfStock = part.stockQuantity === 0;
                            const isLowStock = part.stockQuantity > 0 && part.stockQuantity <= part.minStockLevel;

                            return (
                              <tr key={part.id} className={isOutOfStock ? 'inactive-row' : ''}>
                                <td>
                                  <div className="user-profile-meta">
                                    <div className="avatar-initials customer">
                                      {part.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="meta-text">
                                      <span className="username">{part.name}</span>
                                      <span className="user-id">{part.description || 'No description added.'}</span>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.95rem' }}>
                                    {part.partNumber}
                                  </span>
                                </td>
                                <td>
                                  <span className="role-badge staff">{part.category}</span>
                                </td>
                                <td>
                                  <strong style={{ color: '#22c55e', fontSize: '1rem' }}>
                                    ${part.price.toFixed(2)}
                                  </strong>
                                </td>
                                <td>
                                  {isOutOfStock ? (
                                    <span className="status-pill inactive">Out of Stock</span>
                                  ) : isLowStock ? (
                                    <span className="status-pill" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                                      Low Stock ({part.stockQuantity})
                                    </span>
                                  ) : (
                                    <span className="status-pill active">In Stock ({part.stockQuantity})</span>
                                  )}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                                    <button 
                                      className="toggle-status-btn activate" 
                                      onClick={() => openEditModal(part)}
                                      style={{ borderColor: 'rgba(255, 255, 255, 0.2)', color: '#fff' }}
                                    >
                                      <Edit3 size={14} />
                                      <span>Edit</span>
                                    </button>
                                    <button 
                                      className="toggle-status-btn deactivate"
                                      onClick={() => handleDeletePart(part.id)}
                                    >
                                      <Trash2 size={14} />
                                      <span>Delete</span>
                                    </button>
                                  </div>
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
            ) : (
              /* Invoices Tab View */
              <div className="users-table-card">
                <h2>Purchase Invoice replenishment History</h2>
                {invoices.length === 0 ? (
                  <div className="table-empty-row" style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
                    No purchase invoices registered yet. Update your parts stock level by recording a purchase.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {invoices.map(invoice => (
                      <div 
                        key={invoice.id} 
                        style={{
                          backgroundColor: '#070707',
                          border: '1px solid var(--borders)',
                          borderRadius: '8px',
                          padding: '1.5rem'
                        }}
                      >
                        {/* Invoice Header details */}
                        <div 
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid rgba(255,255,255,0.08)',
                            paddingBottom: '1rem',
                            marginBottom: '1rem',
                            flexWrap: 'wrap',
                            gap: '1rem'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <FileText size={18} style={{ color: 'var(--primary-accent)' }} />
                              <strong style={{ fontSize: '1.1rem', color: '#fff' }}>
                                Invoice #{invoice.invoiceNumber}
                              </strong>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                              Supplier: <span style={{ color: '#fff', fontWeight: 600 }}>{invoice.supplierName}</span> | Date: {new Date(invoice.purchaseDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TOTAL REPLENISHMENT AMOUNT</div>
                            <strong style={{ fontSize: '1.3rem', color: '#22c55e' }}>
                              ${invoice.totalAmount.toFixed(2)}
                            </strong>
                          </div>
                        </div>

                        {/* Invoice Line items */}
                        <div className="table-responsive-wrapper">
                          <table className="users-dashboard-table" style={{ fontSize: '0.85rem' }}>
                            <thead>
                              <tr>
                                <th style={{ padding: '0.6rem' }}>Part Name</th>
                                <th style={{ padding: '0.6rem' }}>Part Number</th>
                                <th style={{ padding: '0.6rem' }}>Quantity</th>
                                <th style={{ padding: '0.6rem' }}>Unit Price</th>
                                <th style={{ padding: '0.6rem', textAlign: 'right' }}>Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invoice.items.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                  <td style={{ padding: '0.8rem 0.6rem' }}>{item.part?.name || 'Unknown Part'}</td>
                                  <td style={{ padding: '0.8rem 0.6rem', fontFamily: 'monospace' }}>{item.part?.partNumber || 'N/A'}</td>
                                  <td style={{ padding: '0.8rem 0.6rem', fontWeight: 'bold' }}>{item.quantity} units</td>
                                  <td style={{ padding: '0.8rem 0.6rem', color: '#22c55e' }}>${item.unitPrice.toFixed(2)}</td>
                                  <td style={{ padding: '0.8rem 0.6rem', textAlign: 'right', fontWeight: 700 }}>
                                    ${(item.quantity * item.unitPrice).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Part Definition Add/Edit Modal */}
      {showPartModal && (
        <div className="staff-modal-overlay">
          <div className="staff-modal-content">
            <div className="modal-header">
              <h2>{isEditingPart ? 'Edit Vehicle Part Definition' : 'Define New Vehicle Part'}</h2>
              <button className="close-modal-btn" onClick={() => setShowPartModal(false)}>&times;</button>
            </div>
            
            {partModalError && <div className="modal-error-message">{partModalError}</div>}

            <form onSubmit={handlePartSubmit} className="modal-form">
              <div className="modal-form-group">
                <label>Part Display Name</label>
                <div className="modal-input-wrapper">
                  <Package size={16} className="modal-input-icon" />
                  <input 
                    type="text" 
                    placeholder="e.g. Performance Carbon Ceramic Brake Pads" 
                    value={partName}
                    onChange={(e) => setPartName(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="modal-form-group">
                <label>Unique Part Number (SKU)</label>
                <div className="modal-input-wrapper">
                  <Layers size={16} className="modal-input-icon" />
                  <input 
                    type="text" 
                    placeholder="e.g. BRK-CER-0092" 
                    value={partNumber}
                    onChange={(e) => setPartNumber(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="modal-form-group">
                <label>Inventory Category</label>
                <div className="modal-input-wrapper">
                  <select 
                    value={partCategory} 
                    onChange={(e) => setPartCategory(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#060606',
                      border: '1px solid var(--borders)',
                      borderRadius: '6px',
                      padding: '0.75rem 1rem',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              <div className="modal-form-group">
                <label>Description / Technical Specifications</label>
                <div className="modal-input-wrapper">
                  <textarea 
                    placeholder="Enter part details, compatible models, or material info..." 
                    value={partDesc}
                    onChange={(e) => setPartDesc(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      backgroundColor: '#060606',
                      border: '1px solid var(--borders)',
                      borderRadius: '6px',
                      padding: '0.75rem',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="modal-form-group">
                  <label>Retail Price ($)</label>
                  <div className="modal-input-wrapper">
                    <DollarSign size={16} className="modal-input-icon" />
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="99.99" 
                      value={partPrice}
                      onChange={(e) => setPartPrice(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className="modal-form-group">
                  <label>Low Stock Warning Limit</label>
                  <div className="modal-input-wrapper">
                    <AlertTriangle size={16} className="modal-input-icon" />
                    <input 
                      type="number" 
                      placeholder="5" 
                      value={partMinStock}
                      onChange={(e) => setPartMinStock(e.target.value)}
                      required 
                    />
                  </div>
                </div>
              </div>

              {!isEditingPart && (
                <div className="modal-form-group">
                  <label>Initial Stock Quantity</label>
                  <div className="modal-input-wrapper">
                    <Package size={16} className="modal-input-icon" />
                    <input 
                      type="number" 
                      placeholder="0" 
                      value={partStock}
                      onChange={(e) => setPartStock(e.target.value)}
                      required 
                    />
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="modal-cancel-btn" onClick={() => setShowPartModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="modal-submit-btn" disabled={partModalLoading}>
                  {partModalLoading ? 'Saving...' : isEditingPart ? 'Update Definition' : 'Define Part'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Purchase Invoice Modal */}
      {showInvoiceModal && (
        <div className="staff-modal-overlay">
          <div className="staff-modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h2>Record Stock Purchase Invoice</h2>
              <button className="close-modal-btn" onClick={() => setShowInvoiceModal(false)}>&times;</button>
            </div>

            {invoiceModalError && <div className="modal-error-message">{invoiceModalError}</div>}

            <form onSubmit={handleInvoiceSubmit} className="modal-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="modal-form-group">
                  <label>Invoice Number</label>
                  <div className="modal-input-wrapper">
                    <FileText size={16} className="modal-input-icon" />
                    <input 
                      type="text" 
                      placeholder="e.g. INV-9908" 
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className="modal-form-group">
                  <label>Supplier / Vendor Name</label>
                  <div className="modal-input-wrapper">
                    <Layers size={16} className="modal-input-icon" />
                    <input 
                      type="text" 
                      placeholder="e.g. Bosch Global Parts" 
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* Purchase items list */}
              <div className="modal-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ margin: 0 }}>Replenishment Lines</label>
                  <button 
                    type="button" 
                    onClick={addInvoiceItemLine}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary-accent)',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      cursor: 'pointer'
                    }}
                  >
                    <PlusCircle size={14} /> Add Line Item
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.3rem' }}>
                  {invoiceItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1.2fr auto', gap: '0.6rem', alignItems: 'center' }}>
                      <select
                        value={item.partId}
                        onChange={(e) => updateInvoiceItem(idx, 'partId', parseInt(e.target.value))}
                        style={{
                          backgroundColor: '#060606',
                          border: '1px solid var(--borders)',
                          borderRadius: '6px',
                          padding: '0.5rem',
                          color: '#fff',
                          fontSize: '0.85rem'
                        }}
                      >
                        <option value={0}>Select Part...</option>
                        {parts.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.partNumber})</option>
                        ))}
                      </select>

                      <input 
                        type="number" 
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateInvoiceItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                        style={{
                          backgroundColor: '#060606',
                          border: '1px solid var(--borders)',
                          borderRadius: '6px',
                          padding: '0.5rem',
                          color: '#fff',
                          fontSize: '0.85rem',
                          textAlign: 'center'
                        }}
                        required
                      />

                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        placeholder="Cost $"
                        value={item.unitPrice || ''}
                        onChange={(e) => updateInvoiceItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                        style={{
                          backgroundColor: '#060606',
                          border: '1px solid var(--borders)',
                          borderRadius: '6px',
                          padding: '0.5rem',
                          color: '#fff',
                          fontSize: '0.85rem',
                          textAlign: 'center'
                        }}
                        required
                      />

                      <button 
                        type="button" 
                        onClick={() => removeInvoiceItemLine(idx)}
                        disabled={invoiceItems.length === 1}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          opacity: invoiceItems.length === 1 ? 0.3 : 1
                        }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total calculations */}
              <div 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  padding: '1rem',
                  borderRadius: '6px',
                  border: '1px solid var(--borders)',
                  marginTop: '0.5rem'
                }}
              >
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                  TOTAL PURCHASE AMOUNT
                </span>
                <strong style={{ fontSize: '1.4rem', color: '#22c55e' }}>
                  ${calculateInvoiceTotal().toFixed(2)}
                </strong>
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-cancel-btn" onClick={() => setShowInvoiceModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="modal-submit-btn" disabled={invoiceModalLoading} style={{ backgroundColor: '#22c55e' }}>
                  {invoiceModalLoading ? 'Processing...' : 'Complete Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
