'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, Car, Calendar, Wrench, Star, FileText, Settings, ShieldAlert,
  Loader2, ArrowLeft, Plus, Trash2, Edit2, ShieldCheck, Mail, Phone, Lock, Sparkles,
  Clock, CheckCircle2, AlertCircle, ShoppingBag, Eye, Printer, Camera
} from 'lucide-react';
import Link from 'next/link';

interface Vehicle {
  id: number;
  vehicleNumber: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  notes?: string;
}

interface InvoiceItem {
  partId: number;
  partName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  saleDate: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  totalAmount: number;
  status: string;
  notes?: string;
  loyaltyApplied: boolean;
  vehicle?: {
    vehicleNumber: string;
    make: string;
    model: string;
  };
  items: InvoiceItem[];
}

interface Appointment {
  id: number;
  serviceType: string;
  appointmentDate: string;
  status: string;
  notes?: string;
  staffNotes?: string;
  createdAt: string;
  vehicle?: {
    vehicleNumber: string;
    make: string;
    model: string;
  };
}

interface PartRequest {
  id: number;
  partName: string;
  partNumber?: string;
  description?: string;
  status: string;
  adminNote?: string;
  requestedAt: string;
}

interface ServiceReview {
  id: number;
  rating: number;
  comment: string;
  reviewedAt: string;
  invoiceNumber?: string;
}

export default function CustomerDashboard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Authentication & Profile States
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data lists
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [partRequests, setPartRequests] = useState<PartRequest[]>([]);
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [stats, setStats] = useState<any>({ totalSpent: 0, invoiceCount: 0, loyaltySavings: 0, unpaidAmount: 0 });

  // Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'vehicles' | 'appointments' | 'part-requests' | 'history' | 'reviews' | 'profile'>('overview');

  // Modals & Form states
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  
  const getServiceIcon = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('diagnost')) return <Sparkles className="text-fuchsia-400" size={18} />;
    if (t.includes('brake')) return <ShieldAlert className="text-red-400" size={18} />;
    if (t.includes('tire') || t.includes('wheel')) return <Car className="text-cyan-400" size={18} />;
    if (t.includes('oil')) return <Wrench className="text-yellow-400" size={18} />;
    if (t.includes('upgrade') || t.includes('perform')) return <Sparkles className="text-red-500" size={18} />;
    return <Settings className="text-blue-400" size={18} />;
  };
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [color, setColor] = useState('');
  const [vehicleNotes, setVehicleNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Book Appointment form states
  const [showApptModal, setShowApptModal] = useState(false);
  const [apptServiceType, setApptServiceType] = useState('');
  const [apptVehicleId, setApptVehicleId] = useState<string>('');
  const [apptDate, setApptDate] = useState('');
  const [apptNotes, setApptNotes] = useState('');

  // Request Part form states
  const [showPartModal, setShowPartModal] = useState(false);
  const [reqPartName, setReqPartName] = useState('');
  const [reqPartNumber, setReqPartNumber] = useState('');
  const [reqDescription, setReqDescription] = useState('');

  // Review form states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [revInvoiceId, setRevInvoiceId] = useState<string>('');
  const [revRating, setRevRating] = useState<number>(5);
  const [revComment, setRevComment] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Profile Edit fields
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  // Global actions loading
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Verify role in JWT
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      if (role !== 'Customer') {
        setError('Unauthorized. Only registered Customers can access the self-service portal.');
        setLoading(false);
        return;
      }
    } catch (e) {
      router.push('/login');
      return;
    }

    // Fetch all customer portal data
    fetchAllData(token);
  }, [router]);

  const fetchAllData = async (token: string) => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Profile
      const resProfile = await fetch('http://localhost:5215/api/customer-portal/profile', { headers });
      if (!resProfile.ok) throw new Error('Failed to load profile');
      const profileData = await resProfile.json();
      setProfile(profileData);
      setEditUsername(profileData.username || '');
      setEditEmail(profileData.email || '');
      setEditPhone(profileData.phoneNumber || '');

      // Vehicles
      const resVehicles = await fetch('http://localhost:5215/api/customer-portal/vehicles', { headers });
      if (resVehicles.ok) setVehicles(await resVehicles.json());

      // History
      const resHistory = await fetch('http://localhost:5215/api/customer-portal/history', { headers });
      if (resHistory.ok) setInvoices(await resHistory.json());

      // Stats
      const resStats = await fetch('http://localhost:5215/api/customer-portal/stats', { headers });
      if (resStats.ok) setStats(await resStats.json());

      // Appointments
      const resAppts = await fetch('http://localhost:5215/api/customer-portal/appointments', { headers });
      if (resAppts.ok) setAppointments(await resAppts.json());

      // Part requests
      const resReqs = await fetch('http://localhost:5215/api/customer-portal/part-requests', { headers });
      if (resReqs.ok) setPartRequests(await resReqs.json());

      // Reviews
      const resReviews = await fetch('http://localhost:5215/api/customer-portal/reviews', { headers });
      if (resReviews.ok) setReviews(await resReviews.json());

    } catch (err: any) {
      setError(err.message || 'Error connecting to the backend. Please check if server is active.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    const token = localStorage.getItem('token');
    if (token) fetchAllData(token);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setProfileError('Image size must be less than 2MB.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    setSubmitting(true);
    setProfileSuccess('');
    setProfileError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('http://localhost:5215/api/customer-portal/upload-profile-picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const errMsg = await res.text();
        throw new Error(errMsg || 'Failed to upload profile picture');
      }

      const data = await res.json();
      setProfile((prev: any) => ({ ...prev, profilePictureUrl: data.profilePictureUrl }));
      setProfileSuccess('Profile picture updated successfully!');
    } catch (err: any) {
      setProfileError(err.message || 'Error uploading file.');
    } finally {
      setSubmitting(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // PROFILE UPDATE & PASSWORD CHANGE
  // ───────────────────────────────────────────────────────────────────────────
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setSubmitting(true);

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5215/api/customer-portal/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: editUsername, email: editEmail, phoneNumber: editPhone })
      });

      if (response.ok) {
        setProfileSuccess('Profile updated successfully.');
        // Refresh token claims if needed by logging out/in or just refreshing UI
        handleRefresh();
      } else {
        const txt = await response.text();
        setProfileError(txt || 'Failed to update profile.');
      }
    } catch (err) {
      setProfileError('Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdSuccess('');
    setPwdError('');

    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5215/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      if (response.ok) {
        setPwdSuccess('Password changed successfully.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const txt = await response.text();
        setPwdError(txt || 'Failed to change password. Double check old password.');
      }
    } catch (err) {
      setPwdError('Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // VEHICLE CRUD
  // ───────────────────────────────────────────────────────────────────────────
  const openVehicleModal = (veh: Vehicle | null = null) => {
    setFormError('');
    if (veh) {
      setEditingVehicle(veh);
      setVehicleNumber(veh.vehicleNumber);
      setMake(veh.make);
      setModel(veh.model);
      setYear(veh.year || '');
      setColor(veh.color || '');
      setVehicleNotes(veh.notes || '');
    } else {
      setEditingVehicle(null);
      setVehicleNumber('');
      setMake('');
      setModel('');
      setYear('');
      setColor('');
      setVehicleNotes('');
    }
    setShowVehicleModal(true);
  };

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!vehicleNumber.trim() || !make.trim() || !model.trim()) {
      setFormError('Vehicle Number, Make, and Model are required.');
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('token');
    if (!token) return;

    const url = editingVehicle 
      ? `http://localhost:5215/api/customer-portal/vehicles/${editingVehicle.id}`
      : 'http://localhost:5215/api/customer-portal/vehicles';
    
    const method = editingVehicle ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicleNumber,
          make,
          model,
          year: year ? Number(year) : null,
          color,
          notes: vehicleNotes
        })
      });

      if (response.ok) {
        setShowVehicleModal(false);
        handleRefresh();
      } else {
        const txt = await response.text();
        setFormError(txt || 'Failed to save vehicle details.');
      }
    } catch (err) {
      setFormError('Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (id: number) => {
    if (!confirm('Are you sure you want to remove this vehicle?')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5215/api/customer-portal/vehicles/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        handleRefresh();
      } else {
        alert('Failed to delete vehicle. It may be linked to appointments or invoices.');
      }
    } catch (err) {
      alert('Connection error.');
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // APPOINTMENT BOOKING
  // ───────────────────────────────────────────────────────────────────────────
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!apptServiceType.trim() || !apptDate) {
      setFormError('Service Type and Appointment Date are required.');
      return;
    }

    const selectedDate = new Date(apptDate);
    if (selectedDate < new Date(Date.now() + 3600000)) {
      setFormError('Appointment must be at least 1 hour from now.');
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5215/api/customer-portal/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceType: apptServiceType,
          vehicleId: apptVehicleId ? Number(apptVehicleId) : null,
          appointmentDate: selectedDate.toISOString(),
          notes: apptNotes
        })
      });

      if (response.ok) {
        setShowApptModal(false);
        setApptServiceType('');
        setApptVehicleId('');
        setApptDate('');
        setApptNotes('');
        handleRefresh();
      } else {
        const txt = await response.text();
        setFormError(txt || 'Failed to book appointment.');
      }
    } catch (err) {
      setFormError('Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAppointment = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5215/api/customer-portal/appointments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        handleRefresh();
      } else {
        const errTxt = await response.text();
        alert(errTxt || 'Failed to cancel appointment.');
      }
    } catch (err) {
      alert('Connection error.');
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // PART REQUEST SUBMISSION
  // ───────────────────────────────────────────────────────────────────────────
  const handleRequestPart = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!reqPartName.trim()) {
      setFormError('Part Name is required.');
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5215/api/customer-portal/part-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          partName: reqPartName,
          partNumber: reqPartNumber || null,
          description: reqDescription
        })
      });

      if (response.ok) {
        setShowPartModal(false);
        setReqPartName('');
        setReqPartNumber('');
        setReqDescription('');
        handleRefresh();
      } else {
        const txt = await response.text();
        setFormError(txt || 'Failed to submit part request.');
      }
    } catch (err) {
      setFormError('Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelPartRequest = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5215/api/part-requests/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        handleRefresh();
      } else {
        const errTxt = await response.text();
        alert(errTxt || 'Failed to cancel request.');
      }
    } catch (err) {
      alert('Connection error.');
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // SERVICE REVIEW SUBMISSION
  // ───────────────────────────────────────────────────────────────────────────
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!revComment.trim()) {
      setFormError('Please write a comment.');
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5215/api/customer-portal/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          salesInvoiceId: revInvoiceId ? Number(revInvoiceId) : null,
          rating: revRating,
          comment: revComment
        })
      });

      if (response.ok) {
        setShowReviewModal(false);
        setRevInvoiceId('');
        setRevRating(5);
        setRevComment('');
        handleRefresh();
      } else {
        const txt = await response.text();
        setFormError(txt || 'Failed to submit review.');
      }
    } catch (err) {
      setFormError('Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <div className="min-h-screen text-[#F5F5F5] font-sans antialiased" style={{ background: 'radial-gradient(circle at top right, rgba(214,31,44,0.15) 0%, transparent 65%), radial-gradient(circle at bottom left, rgba(214,31,44,0.08) 0%, transparent 65%), #161722' }}>
      
      {/* Premium Navbar */}
      <nav className="sticky top-0 z-50 bg-[#1b1d2a]/90 backdrop-blur-xl border-b border-white/[0.06] py-5 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
        <div style={{ maxWidth: '1320px', margin: '0 auto', width: '100%', padding: '0 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" className="flex items-center gap-3">
            <svg className="drop-shadow-[0_0_8px_rgba(214,31,44,0.6)]" viewBox="0 0 24 24" fill="none" stroke="#D61F2C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="34" height="34" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" strokeWidth="2"></circle>
              <circle cx="12" cy="12" r="4" fill="#D61F2C"></circle>
            </svg>
            <div className="flex flex-col line-height-1">
              <span className="font-extrabold italic text-xl tracking-wide text-[#D61F2C] uppercase font-sans">
                RED<span className="text-[#F5F5F5]">LINE</span>
              </span>
              <span className="text-[0.55rem] font-black text-[#A1A1AA] tracking-[3px] uppercase">
                CUSTOMER PORTAL
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            {profile && (
              <span className="hidden md:inline text-sm text-neutral-300">
                Welcome back, <strong className="text-white font-semibold">{profile.username}</strong>
              </span>
            )}
            <button 
              onClick={handleLogout} 
              className="text-xs font-bold uppercase tracking-wider px-4 py-2.5 border border-white/10 hover:border-[#D61F2C] hover:bg-[#D61F2C] bg-white/[0.04] text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-[0_4px_15px_rgba(214,31,44,0.2)]"
            >
              Log Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Layout Grid */}
      <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Sidebar Nav */}
        <aside className="custom-sidebar-scroll" style={{ position: 'sticky', top: '90px', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignSelf: 'start', zIndex: 40, width: '280px', maxHeight: 'calc(100vh - 110px)', overflowY: 'auto', paddingRight: '6px' }}>
          
          {/* Compact Horizontal Profile Summary Card */}
          <div style={{ background: 'linear-gradient(145deg, #1f222e, #161720)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(214,31,44,0.6), transparent)' }} />
            
            {profile?.profilePictureUrl ? (
              <img src={profile.profilePictureUrl} alt="Avatar" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0, boxShadow: '0 0 16px rgba(214,31,44,0.3)' }} />
            ) : (
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #D61F2C, #E53935)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '1rem', flexShrink: 0, boxShadow: '0 0 16px rgba(214,31,44,0.3)' }}>
                {profile ? profile.username.substring(0, 2).toUpperCase() : 'CU'}
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, textAlign: 'left' }}>
              <h3 style={{ fontWeight: 800, fontSize: '0.85rem', color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile ? profile.username : 'Loading...'}</h3>
              <p style={{ fontSize: '0.68rem', color: '#A1A1AA', fontFamily: 'monospace', margin: '2px 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile ? profile.email : ''}</p>
              {stats.totalSpent >= 5000 ? (
                <span style={{ color: '#D61F2C', fontWeight: 800, fontSize: '0.62rem', letterSpacing: '0.5px' }}>LOYALTY MEMBER (10% OFF)</span>
              ) : (
                <span style={{ color: '#A1A1AA', fontSize: '0.62rem' }}>
                  Need ${(5000 - stats.totalSpent).toFixed(0)} for 10% Disc.
                </span>
              )}
            </div>
          </div>

          {/* Unified Sidebar Navigation Card */}
          <div style={{ background: 'linear-gradient(145deg, #1f222e, #161720)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', flexShrink: 0 }}>
            {([
              { id: 'overview',      label: 'Dashboard Overview',       icon: <Settings size={17} /> },
              { id: 'appointments',  label: 'Book Appointments',         icon: <Calendar size={17} /> },
              { id: 'part-requests', label: 'Unavailable Parts Request', icon: <Wrench size={17} /> },
              { id: 'history',       label: 'Purchase & History',        icon: <FileText size={17} /> },
              { id: 'vehicles',      label: 'Manage Vehicles',           icon: <Car size={17} /> },
              { id: 'reviews',       label: 'Service Feedback',          icon: <Star size={17} /> },
              { id: 'profile',       label: 'Profile & Security',        icon: <User size={17} /> },
            ] as { id: "profile" | "vehicles" | "appointments" | "reviews" | "overview" | "part-requests" | "history"; label: string; icon: React.ReactNode }[]).map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.7rem 1.1rem', borderRadius: '10px', textAlign: 'left',
                    fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer', border: 'none',
                    transition: 'all 0.2s ease',
                    background: isActive ? 'linear-gradient(135deg, #D61F2C, #E53935)' : 'transparent',
                    color: isActive ? '#fff' : '#A1A1AA',
                    boxShadow: isActive ? '0 4px 16px rgba(214,31,44,0.35)' : 'none',
                    borderLeft: isActive ? '3px solid #ff5a66' : '3px solid transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = '#fff'; } }}
                  onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#A1A1AA'; } }}
                >
                  <span style={{ color: isActive ? '#fff' : '#8a8f9d', display: 'flex', flexShrink: 0 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Dashboard Main Workspace Area */}
        <main style={{ minWidth: 0 }}>

          {error ? (
            <div style={{ background: 'linear-gradient(145deg, #1f222e, #161720)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '2rem', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(214,31,44,0.4), transparent)' }} />
              <ShieldAlert className="text-[#D61F2C] mx-auto mb-4 animate-bounce" size={48} />
              <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
              <p className="text-[#A1A1AA] mb-6">{error}</p>
              <Link href="/login" className="inline-block px-6 py-3 bg-[#D61F2C] hover:bg-[#F22635] text-white rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-300 shadow-md">
                Go to Login
              </Link>
            </div>
          ) : loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem', background: 'linear-gradient(145deg, #1f222e, #161720)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              <Loader2 className="animate-spin text-[#D61F2C] mb-4" size={40} />
              <p className="text-[#A1A1AA] text-sm font-medium tracking-wide">Synchronizing your dashboard workspace...</p>
            </div>
          ) : (
            <>
              
              {/* Tab 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="flex flex-col gap-6">
                  
                  {/* Stats Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                    {[
                      { label: 'TOTAL SPENT', value: `$${stats.totalSpent.toFixed(2)}`, sub: `${stats.invoiceCount} invoices`, color: '#D61F2C', icon: <FileText size={20} /> },
                      { label: 'LOYALTY SAVINGS', value: `$${stats.loyaltySavings.toFixed(2)}`, sub: '10% discount', color: '#a855f7', icon: <Sparkles size={20} /> },
                      { label: 'UNPAID AMOUNT', value: `$${stats.unpaidAmount.toFixed(2)}`, sub: 'Outstanding', color: '#FFB703', icon: <AlertCircle size={20} /> },
                      { label: 'VEHICLES', value: vehicles.length, sub: 'Registered', color: '#3b82f6', icon: <Car size={20} /> },
                    ].map((card, i) => (
                      <div key={i} style={{ background: 'linear-gradient(145deg, #1e1e22, #151518)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.2rem', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.4)', transition: 'transform 0.25s ease, box-shadow 0.25s ease', cursor: 'default' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 36px rgba(0,0,0,0.5)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.4)'; }}
                      >
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${card.color}80, transparent)` }} />
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${card.color}18`, border: `1px solid ${card.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, marginBottom: '0.75rem' }}>
                          {card.icon}
                        </div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>{card.label}</span>
                        <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', fontFamily: 'monospace', lineHeight: 1.1, margin: 0 }}>{card.value}</h3>
                        <p style={{ fontSize: '0.7rem', color: '#A1A1AA', marginTop: '0.3rem' }}>{card.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Dashboard Shortcuts / Summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

                    {/* Recent Invoices */}
                    <div style={{ background: 'linear-gradient(145deg, #1e1e22, #151518)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.4rem', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                        <h4 style={{ fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', margin: 0 }}>
                          <FileText size={15} style={{ color: '#D61F2C' }} />
                          Recent Invoices
                        </h4>
                        <button onClick={() => setActiveTab('history')} style={{ fontSize: '0.75rem', color: '#D61F2C', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>View All</button>
                      </div>
                      {invoices.length === 0 ? (
                        <p style={{ fontSize: '0.85rem', color: '#A1A1AA', padding: '1.5rem 0', textAlign: 'center' }}>No recent purchase transactions.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {invoices.slice(0, 3).map(inv => (
                            <div key={inv.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '0.7rem 0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <p style={{ fontWeight: 700, color: '#fff', fontFamily: 'monospace', fontSize: '0.82rem', margin: 0 }}>#{inv.invoiceNumber}</p>
                                <p style={{ fontSize: '0.7rem', color: '#A1A1AA', marginTop: '2px' }}>{new Date(inv.saleDate).toLocaleDateString()}</p>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <p style={{ fontWeight: 700, color: '#fff', fontFamily: 'monospace', fontSize: '0.82rem', margin: 0 }}>${inv.totalAmount.toFixed(2)}</p>
                                <span style={{ display: 'inline-block', fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '20px', marginTop: '3px', background: inv.status === 'Paid' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)', color: inv.status === 'Paid' ? '#4ade80' : '#FFB703', border: `1px solid ${inv.status === 'Paid' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}` }}>{inv.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Upcoming Appointments */}
                    <div style={{ background: 'linear-gradient(145deg, #1e1e22, #151518)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.4rem', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                        <h4 style={{ fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', margin: 0 }}>
                          <Calendar size={15} style={{ color: '#D61F2C' }} />
                          Upcoming Services
                        </h4>
                        <button onClick={() => setActiveTab('appointments')} style={{ fontSize: '0.75rem', color: '#D61F2C', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Book New</button>
                      </div>
                      {appointments.length === 0 ? (
                        <p style={{ fontSize: '0.85rem', color: '#A1A1AA', padding: '1.5rem 0', textAlign: 'center' }}>No service slots reserved.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {appointments.slice(0, 3).map(appt => {
                            const statusStyle = appt.status === 'Confirmed' ? { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.2)' } :
                              appt.status === 'Completed' ? { bg: 'rgba(34,197,94,0.12)', color: '#4ade80', border: 'rgba(34,197,94,0.2)' } :
                              appt.status === 'Cancelled'  ? { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.2)'  } :
                              { bg: 'rgba(245,158,11,0.12)', color: '#FFB703', border: 'rgba(245,158,11,0.2)' };
                            return (
                              <div key={appt.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '0.7rem 0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <p style={{ fontWeight: 700, color: '#fff', fontSize: '0.82rem', margin: 0 }}>{appt.serviceType}</p>
                                  <p style={{ fontSize: '0.7rem', color: '#A1A1AA', marginTop: '2px' }}>{new Date(appt.appointmentDate).toLocaleString()}</p>
                                </div>
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.6rem', borderRadius: '20px', background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}>{appt.status}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* Tab 2: APPOINTMENTS */}
              {activeTab === 'appointments' && (
                <div style={{ background: 'linear-gradient(145deg, #1f222e, #161720)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(214,31,44,0.4), transparent)' }} />
                  <div className="flex justify-between items-center mb-6 border-b border-white/[0.05] pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calendar className="text-[#D61F2C]" />
                        <span>Bookings & Appointments</span>
                      </h2>
                      <p className="text-sm text-[#A1A1AA] mt-2">Reserve repair, service or tune-up time slots.</p>
                    </div>
                    <button 
                      onClick={() => setShowApptModal(true)} 
                      className="flex items-center gap-2 bg-[#D61F2C] hover:bg-[#F22635] text-white font-bold text-xs uppercase px-4.5 py-2.5 rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(214,31,44,0.3)] hover:scale-[1.02]"
                    >
                      <Plus size={14} />
                      <span>Book Slot</span>
                    </button>
                  </div>

                  {appointments.length === 0 ? (
                    <div className="text-center py-20 bg-white/[0.01] rounded-2xl border border-dashed border-white/10">
                      <Calendar className="mx-auto text-neutral-600 mb-4 animate-pulse" size={44} />
                      <p className="text-sm text-neutral-300 font-semibold mb-2">No Appointments Found</p>
                      <p className="text-sm text-[#A1A1AA] mb-6 max-w-sm mx-auto">Get your car checked or serviced by our professional mechanics.</p>
                      <button onClick={() => setShowApptModal(true)} className="inline-block px-5 py-2.5 bg-white/[0.04] border border-white/10 hover:border-[#D61F2C] hover:text-[#D61F2C] text-xs font-bold uppercase rounded-lg transition-all">Book Service Slot &rarr;</button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {appointments.map(appt => {
                        const statusColors = 
                          appt.status === 'Confirmed' ? { border: 'border-l-[#3B82F6]', bg: 'bg-[#3B82F6]/10 text-[#60A5FA] border-[#3B82F6]/20' } :
                          appt.status === 'Completed' ? { border: 'border-l-[#10B981]', bg: 'bg-[#10B981]/10 text-[#34D399] border-[#10B981]/20' } :
                          appt.status === 'Cancelled' ? { border: 'border-l-[#6B7280]', bg: 'bg-[#6B7280]/10 text-[#9CA3AF] border-[#6B7280]/20' } :
                          { border: 'border-l-[#F59E0B]', bg: 'bg-[#F59E0B]/10 text-[#FBBF24] border-[#F59E0B]/20' }; // Pending

                        return (
                          <div 
                            key={appt.id} 
                            className={`bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] ${statusColors.border} border-l-4 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-r-white/10 transition-all duration-300 shadow-md group`}
                          >
                            <div className="flex items-start gap-4 flex-1">
                              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-hover:bg-white/[0.06] shrink-0">
                                {getServiceIcon(appt.serviceType)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                  <h4 className="font-extrabold text-white text-sm md:text-base leading-tight">{appt.serviceType}</h4>
                                  <span className={`text-[11px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${statusColors.bg}`}>
                                    {appt.status}
                                  </span>
                                </div>
                                
                                <div className="text-sm text-[#A1A1AA] space-y-2">
                                  <p className="flex items-center gap-1.5">
                                    <Clock size={12} className="text-[#D61F2C]" />
                                    <span>Date & Time: <strong className="text-white font-semibold">{new Date(appt.appointmentDate).toLocaleString()}</strong></span>
                                  </p>
                                  {appt.vehicle && (
                                    <p className="flex items-center gap-1.5">
                                      <Car size={12} className="text-neutral-500" />
                                      <span>Vehicle: <strong className="text-[#F5F5F5] font-semibold">{appt.vehicle.make} {appt.vehicle.model} ({appt.vehicle.vehicleNumber})</strong></span>
                                    </p>
                                  )}
                                </div>
                                
                                {appt.notes && (
                                  <div className="text-sm text-neutral-300 mt-3 bg-black/30 p-2.5 rounded-lg border border-white/[0.03] italic font-sans max-w-xl">
                                    <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider block not-italic mb-0.5">Symptoms / Notes:</span>
                                    "{appt.notes}"
                                  </div>
                                )}
                                
                                {appt.staffNotes && (
                                  <div className="mt-2.5 text-sm bg-[#D61F2C]/5 border border-[#D61F2C]/20 p-2.5 rounded-lg text-neutral-200 max-w-xl">
                                    <strong className="text-[#D61F2C] text-xs font-bold uppercase tracking-wider block mb-1">Garage Response:</strong>
                                    {appt.staffNotes}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {appt.status !== 'Completed' && appt.status !== 'Cancelled' && (
                              <button 
                                onClick={() => handleCancelAppointment(appt.id)}
                                className="px-4 py-2 text-xs font-bold text-red-500 hover:text-white border border-red-500/20 hover:border-red-600 bg-red-500/[0.04] hover:bg-[#D61F2C] rounded-lg transition-all duration-300 self-start md:self-auto shadow-md"
                              >
                                Cancel Booking
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: PART REQUESTS */}
              {activeTab === 'part-requests' && (
                <div style={{ background: 'linear-gradient(145deg, #1f222e, #161720)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(214,31,44,0.4), transparent)' }} />
                  <div className="flex justify-between items-center mb-6 border-b border-white/[0.05] pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Wrench className="text-[#D61F2C]" />
                        <span>Unavailable Parts Request</span>
                      </h2>
                      <p className="text-sm text-[#A1A1AA] mt-2">Request custom vehicle components not in current stock.</p>
                    </div>
                    <button 
                      onClick={() => setShowPartModal(true)} 
                      className="flex items-center gap-2 bg-[#D61F2C] hover:bg-[#F22635] text-white font-bold text-xs uppercase px-4.5 py-2.5 rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(214,31,44,0.3)] hover:scale-[1.02]"
                    >
                      <Plus size={14} />
                      <span>Request Part</span>
                    </button>
                  </div>

                  {partRequests.length === 0 ? (
                    <div className="text-center py-20 bg-white/[0.01] rounded-2xl border border-dashed border-white/10">
                      <Wrench className="mx-auto text-neutral-600 mb-4 animate-pulse" size={44} />
                      <p className="text-sm text-neutral-300 font-semibold mb-2">No Parts Requested</p>
                      <p className="text-sm text-[#A1A1AA] mb-6 max-w-sm mx-auto">Can't find a replacement part in our stock? Submit a request and our procurement team will source it.</p>
                      <button onClick={() => setShowPartModal(true)} className="inline-block px-5 py-2.5 bg-white/[0.04] border border-white/10 hover:border-[#D61F2C] hover:text-[#D61F2C] text-xs font-bold uppercase rounded-lg transition-all">Submit Custom Request &rarr;</button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-5">
                      {partRequests.map(pr => {
                        const isFulfilled = pr.status === 'Fulfilled';
                        const isRejected = pr.status === 'Rejected';
                        const isPending = pr.status === 'Pending';

                        return (
                          <div 
                            key={pr.id} 
                            className="bg-[#121214]/80 hover:bg-[#161619] border border-white/5 hover:border-[#D61F2C]/20 rounded-xl p-5 shadow-lg transition-all duration-300 group"
                          >
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/[0.03] pb-3 mb-4">
                              <div>
                                <h4 className="font-extrabold text-white text-base group-hover:text-[#D61F2C] transition-colors duration-200">{pr.partName}</h4>
                                {pr.partNumber && (
                                  <p className="text-xs text-neutral-500 font-mono mt-1">Part Code: <span className="text-[#A1A1AA]">{pr.partNumber}</span></p>
                                )}
                              </div>
                              <span className={`text-[11px] font-mono font-black uppercase tracking-wider px-3 py-1 rounded-md border ${
                                isFulfilled ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                isRejected ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                'bg-yellow-500/10 text-[#FFB703] border-yellow-500/20'
                              }`}>
                                {pr.status}
                              </span>
                            </div>

                            {pr.description && (
                              <p className="text-sm text-neutral-300 bg-black/40 p-4 rounded-lg border border-white/[0.02] italic mb-4">
                                "{pr.description}"
                              </p>
                            )}

                            {/* Stepper Timeline Progress */}
                            <div className="mb-4 bg-black/20 p-4 rounded-xl border border-white/[0.02]">
                              <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-3">Procurement Timeline</span>
                              <div className="flex items-center w-full">
                                
                                {/* Step 1 */}
                                <div className="flex items-center relative">
                                  <div className="w-5 h-5 rounded-full bg-red-600 border-2 border-red-500/30 flex items-center justify-center text-[10px] text-white font-bold">1</div>
                                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-white whitespace-nowrap">Requested</span>
                                </div>

                                <div className={`flex-1 h-[2px] mx-2 ${!isPending ? 'bg-red-600' : 'bg-neutral-800'}`}></div>

                                {/* Step 2 */}
                                <div className="flex items-center relative">
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    !isPending ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-500'
                                  }`}>2</div>
                                  <span className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold whitespace-nowrap ${
                                    !isPending ? 'text-white' : 'text-neutral-500'
                                  }`}>Sourcing</span>
                                </div>

                                <div className={`flex-1 h-[2px] mx-2 ${isFulfilled ? 'bg-red-600' : 'bg-neutral-800'}`}></div>

                                {/* Step 3 */}
                                <div className="flex items-center relative">
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    isFulfilled ? 'bg-green-600 text-white' : isRejected ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-500'
                                  }`}>3</div>
                                  <span className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold whitespace-nowrap ${
                                    isFulfilled ? 'text-green-400' : isRejected ? 'text-red-400' : 'text-neutral-500'
                                  }`}>{isRejected ? 'Rejected' : 'Ready'}</span>
                                </div>

                              </div>
                              <div className="h-4"></div> {/* spacer for labels */}
                            </div>

                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pt-3 border-t border-white/[0.03]">
                              <span className="text-[10px] text-neutral-500 font-mono">Placed on: {new Date(pr.requestedAt).toLocaleString()}</span>
                              {isPending && (
                                <button 
                                  onClick={() => handleCancelPartRequest(pr.id)}
                                  className="px-3.5 py-1.5 text-xs font-bold text-red-400 hover:text-white border border-red-500/20 hover:bg-red-600 rounded-lg transition-all duration-300"
                                >
                                  Cancel Request
                                </button>
                              )}
                            </div>

                            {pr.adminNote && (
                              <div className="mt-3 text-xs bg-red-500/[0.03] border border-red-500/10 p-3 rounded-lg text-neutral-200">
                                <strong className="text-[#D61F2C] text-[10px] font-bold uppercase tracking-wider block mb-1">Procurement Update Note:</strong>
                                {pr.adminNote}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: PURCHASE & SERVICE HISTORY */}
              {activeTab === 'history' && (
                <div style={{ background: 'linear-gradient(145deg, #1f222e, #161720)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(214,31,44,0.4), transparent)' }} />
                  <div className="border-b border-white/[0.05] pb-4 mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FileText className="text-[#D61F2C]" />
                        <span>Purchase & Service History</span>
                      </h2>
                      <p className="text-sm text-[#A1A1AA] mt-2">Review all your billing details, parts purchases, and service records.</p>
                    </div>
                  </div>

                  {invoices.length === 0 ? (
                    <div className="text-center py-20 bg-white/[0.01] rounded-2xl border border-dashed border-white/10">
                      <ShoppingBag className="mx-auto text-neutral-600 mb-4" size={44} />
                      <p className="text-sm text-neutral-300 font-semibold mb-2">No Transactions Yet</p>
                      <p className="text-xs text-[#A1A1AA] mb-4">When you purchase parts or receive service work, your receipts will be archived here.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {invoices.map(inv => (
                        <div key={inv.id} className="bg-[#121214]/80 border border-white/5 hover:border-[#D61F2C]/20 rounded-xl p-5 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                          
                          {/* Invoice Header */}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/[0.04] pb-4 mb-4 gap-3">
                            <div>
                              <div className="flex items-center gap-3">
                                <span className="font-extrabold text-white text-base font-mono tracking-wider">Invoice #{inv.invoiceNumber}</span>
                                <span className={`text-[9px] font-black font-mono px-2.5 py-0.5 rounded-md border ${
                                  inv.status === 'Paid' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-[#FFB703] border-yellow-500/20'
                                }`}>
                                  {inv.status}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-500 mt-1 font-mono">Issued: {new Date(inv.saleDate).toLocaleString()}</p>
                            </div>
                            <div className="sm:text-right">
                              <span className="text-xs text-[#A1A1AA] font-bold uppercase tracking-wider block">TOTAL DUE</span>
                              <span className="font-black text-white text-xl font-mono">${inv.totalAmount.toFixed(2)}</span>
                            </div>
                          </div>

                          {/* Invoice Items Summary */}
                          <div className="mb-4">
                            <span className="text-xs font-black text-neutral-500 tracking-wider uppercase block mb-2">Parts & Services</span>
                            <div className="space-y-2">
                              {inv.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm bg-black/40 px-4 py-3 rounded-lg border border-white/[0.02]">
                                  <div>
                                    <p className="font-bold text-white leading-tight">{item.partName}</p>
                                    <p className="text-xs text-neutral-500 mt-1">Qty: {item.quantity} &times; ${item.unitPrice.toFixed(2)}</p>
                                  </div>
                                  <span className="font-mono text-white font-semibold">${item.lineTotal.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Totals Summary */}
                          <div className="bg-black/30 border border-white/[0.03] rounded-lg p-3.5 flex flex-col gap-1.5 text-xs text-[#A1A1AA] mb-4">
                            <div className="flex justify-between">
                              <span>Subtotal</span>
                              <span className="text-white font-mono">${inv.subtotal.toFixed(2)}</span>
                            </div>
                            {inv.discountPercent > 0 && (
                              <div className="flex justify-between text-fuchsia-400 font-bold">
                                <span className="flex items-center gap-1">
                                  <Sparkles size={11} className="fill-current text-fuchsia-500 animate-pulse" />
                                  <span>Loyalty Discount ({inv.discountPercent}%)</span>
                                </span>
                                <span className="font-mono">-${inv.discountAmount.toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between border-t border-white/[0.05] pt-2 text-sm font-black text-white">
                              <span>Grand Total</span>
                              <span className="font-mono text-[#D61F2C]">${inv.totalAmount.toFixed(2)}</span>
                            </div>
                          </div>

                          {inv.vehicle && (
                            <p className="text-xs text-[#A1A1AA] bg-white/[0.02] px-3 py-1.5 rounded-md border border-white/[0.04] inline-flex items-center gap-1.5">
                              <Car size={11} className="text-[#D61F2C]" />
                              <span>Serviced Vehicle: <strong className="text-white font-semibold">{inv.vehicle.make} {inv.vehicle.model} ({inv.vehicle.vehicleNumber})</strong></span>
                            </p>
                          )}

                          {/* Action Bar */}
                          <div className="mt-4 flex flex-wrap justify-between items-center gap-3 pt-3 border-t border-white/[0.03]">
                            <button 
                              onClick={() => setSelectedInvoice(inv)}
                              className="flex items-center gap-1 text-[11px] font-bold text-neutral-400 hover:text-white transition-colors"
                            >
                              <Eye size={12} />
                              <span>View Receipt Details</span>
                            </button>

                            <button 
                              onClick={() => {
                                setRevInvoiceId(inv.id.toString());
                                setShowReviewModal(true);
                              }}
                              className="flex items-center gap-1 bg-[#D61F2C]/10 hover:bg-[#D61F2C] border border-[#D61F2C]/20 text-[#D61F2C] hover:text-white font-bold text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all duration-300"
                            >
                              <Star size={11} className="fill-current" />
                              <span>Leave Feedback</span>
                            </button>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: MANAGE VEHICLES */}
              {activeTab === 'vehicles' && (
                <div style={{ background: 'linear-gradient(145deg, #1f222e, #161720)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(214,31,44,0.4), transparent)' }} />
                  <div className="flex justify-between items-center mb-6 border-b border-white/[0.05] pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Car className="text-[#D61F2C]" />
                        <span>My Vehicle Fleet</span>
                      </h2>
                      <p className="text-sm text-[#A1A1AA] mt-2">Manage and track your registered vehicles.</p>
                    </div>
                    <button 
                      onClick={() => openVehicleModal(null)} 
                      className="flex items-center gap-2 bg-[#D61F2C] hover:bg-[#F22635] text-white font-bold text-xs uppercase px-4.5 py-2.5 rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(214,31,44,0.3)] hover:scale-[1.02]"
                    >
                      <Plus size={14} />
                      <span>Add Vehicle</span>
                    </button>
                  </div>

                  {vehicles.length === 0 ? (
                    <div className="text-center py-20 bg-white/[0.01] rounded-2xl border border-dashed border-white/10">
                      <Car className="mx-auto text-neutral-600 mb-4 animate-pulse" size={44} />
                      <p className="text-sm text-neutral-300 font-semibold mb-2">No Vehicles Linked</p>
                      <p className="text-xs text-[#A1A1AA] mb-4">Add your vehicles to schedule service slots and view details.</p>
                      <button onClick={() => openVehicleModal(null)} className="inline-block px-5 py-2.5 bg-white/[0.04] border border-white/10 hover:border-[#D61F2C] hover:text-[#D61F2C] text-xs font-bold uppercase rounded-lg transition-all">Add Your First Vehicle &rarr;</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {vehicles.map(v => (
                        <div 
                          key={v.id} 
                          className="bg-[#121214]/80 border border-white/5 hover:border-[#D61F2C]/30 rounded-xl p-5 hover:shadow-lg transition-all duration-300 group relative overflow-hidden flex flex-col justify-between"
                        >
                          {/* Sleek SVG Car Outline Watermark */}
                          <div className="absolute -right-4 -bottom-4 w-32 h-32 opacity-5 group-hover:opacity-10 group-hover:text-[#D61F2C] text-white transition-all duration-500 pointer-events-none">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path>
                              <circle cx="7" cy="17" r="2"></circle>
                              <circle cx="17" cy="17" r="2"></circle>
                            </svg>
                          </div>

                          <div>
                                             {v.notes && (
                              <div className="text-xs text-neutral-400 bg-black/40 p-3 rounded-lg border border-white/[0.02] italic mb-4">
                                <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider block not-italic mb-1">Specifications & Notes:</span>
                                "{v.notes}"
                              </div>
                            )}
                          </div>

                          <div className="flex justify-end gap-2.5 pt-3 border-t border-white/[0.03]">
                            <button 
                              onClick={() => openVehicleModal(v)}
                              className="p-2 text-neutral-400 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 rounded-lg transition-all"
                              title="Edit Vehicle"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button 
                              onClick={() => handleDeleteVehicle(v.id)}
                              className="p-2 text-red-500 hover:text-white bg-red-500/[0.02] hover:bg-red-600 border border-transparent rounded-lg transition-all"
                              title="Delete Vehicle"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 6: SERVICE FEEDBACK */}
              {activeTab === 'reviews' && (
                <div style={{ background: 'linear-gradient(145deg, #1f222e, #161720)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(214,31,44,0.4), transparent)' }} />
                  <div className="flex justify-between items-center mb-6 border-b border-white/[0.05] pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Star className="text-[#D61F2C]" />
                        <span>Service Reviews & Testimonials</span>
                      </h2>
                      <p className="text-sm text-[#A1A1AA] mt-2">Submit feedback and ratings for completed mechanic services.</p>
                    </div>
                    <button 
                      onClick={() => setShowReviewModal(true)} 
                      className="flex items-center gap-2 bg-[#D61F2C] hover:bg-[#F22635] text-white font-bold text-xs uppercase px-4.5 py-2.5 rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(214,31,44,0.3)] hover:scale-[1.02]"
                    >
                      <Plus size={14} />
                      <span>Write Review</span>
                    </button>
                  </div>

                  {reviews.length === 0 ? (
                    <div className="text-center py-20 bg-white/[0.01] rounded-2xl border border-dashed border-white/10">
                      <Star className="mx-auto text-neutral-600 mb-4 animate-pulse" size={44} />
                      <p className="text-sm text-neutral-300 font-semibold mb-2">No Reviews Found</p>
                      <p className="text-xs text-[#A1A1AA] mb-4">Share your feedback on our service speed, workmanship, or replacement parts.</p>
                      <button onClick={() => setShowReviewModal(true)} className="inline-block px-5 py-2.5 bg-white/[0.04] border border-white/10 hover:border-[#D61F2C] hover:text-[#D61F2C] text-xs font-bold uppercase rounded-lg transition-all">Write Service Review &rarr;</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {reviews.map(r => (
                        <div 
                          key={r.id} 
                          className="bg-[#121214]/80 border border-white/5 hover:border-[#D61F2C]/20 rounded-xl p-5 hover:shadow-lg transition-all duration-300 relative group flex flex-col justify-between"
                        >
                          {/* Large Quotation Mark Watermark */}
                          <div className="absolute top-2 right-4 text-white/[0.02] text-8xl font-serif select-none pointer-events-none group-hover:text-[#D61F2C]/[0.04] transition-colors">
                            ”
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-3.5">
                              <div className="flex items-center gap-1.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    size={12} 
                                    className={i < r.rating ? "text-yellow-500 fill-yellow-500 drop-shadow-[0_0_3px_rgba(234,179,8,0.4)]" : "text-neutral-700"} 
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] text-neutral-500 font-mono">{new Date(r.reviewedAt).toLocaleDateString()}</span>
                            </div>

                            <p className="text-base text-neutral-200 leading-relaxed italic mb-5">
                              "{r.comment}"
                            </p>
                          </div>

                          <div className="pt-3 border-t border-white/[0.03] flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full text-sm bg-[#D61F2C]/10 border border-[#D61F2C]/20 flex items-center justify-center text-[10px] text-white font-extrabold font-mono uppercase">
                                {profile?.fullName ? profile.fullName.charAt(0) : 'C'}
                              </div>
                              <span className="text-[10px] text-[#A1A1AA] font-bold">{profile?.fullName || 'Verified Customer'}</span>
                            </div>
                            {r.invoiceNumber && (
                              <span className="text-[9px] text-neutral-500 font-mono">Invoice: #{r.invoiceNumber}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 7: PROFILE & SECURITY */}
              {activeTab === 'profile' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left panel: Quick Profile summary card */}
                  <div style={{ background: 'linear-gradient(145deg, #1f222e, #161720)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden', height: 'fit-content' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #D61F2C, #E53935)' }} />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#D61F2C] to-red-500 p-0.5 shadow-lg mb-2.5 relative group cursor-pointer overflow-hidden"
                    >
                      <div className="w-full h-full rounded-full bg-[#13141a] flex items-center justify-center text-white text-3xl font-black font-mono relative overflow-hidden">
                        {profile?.profilePictureUrl ? (
                          <img src={profile.profilePictureUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span>{profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'C'}</span>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity duration-200">
                          <Camera size={18} className="text-white mb-0.5" />
                          <span className="text-[8px] font-sans tracking-wider uppercase font-extrabold text-neutral-300">Edit</span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[10px] font-bold text-[#D61F2C] hover:text-[#E53935] bg-[#D61F2C]/10 border border-[#D61F2C]/25 hover:bg-[#D61F2C]/15 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 mb-4"
                    >
                      <Camera size={12} />
                      <span>Change Photo</span>
                    </button>
                    
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                    />
                    
                    <h3 className="font-extrabold text-white text-lg leading-tight">{profile?.fullName || 'AutoCraft User'}</h3>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-red-500 font-black mt-1">Loyalty Tier Member</span>
                    
                    <div className="w-full border-t border-white/[0.05] mt-6 pt-5 space-y-3.5 text-left text-xs text-[#A1A1AA]">
                      <div className="flex justify-between">
                        <span>Total Paid Invoices</span>
                        <span className="text-white font-bold font-mono">{stats.invoiceCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Investment</span>
                        <span className="text-white font-bold font-mono">${stats.totalSpent?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Loyalty Savings</span>
                        <span className="text-green-400 font-bold font-mono">${stats.loyaltySavings?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle/Right: Edit Profile & Account Security */}
                  <div className="lg:col-span-2 flex flex-col gap-6">
                    
                    {/* Profile Fields Update */}
                    <div style={{ background: 'linear-gradient(145deg, #1f222e, #161720)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(214,31,44,0.4), transparent)' }} />
                      <h3 className="text-base font-extrabold text-white flex items-center gap-2 mb-1.5">
                        <User className="text-[#D61F2C]" size={16} />
                        <span>Update Personal Information</span>
                      </h3>
                      <p className="text-sm text-[#A1A1AA] mb-6">Change details associated with your garage billing profile.</p>

                      {profileSuccess && <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 p-3.5 rounded-xl mb-4 font-semibold">{profileSuccess}</div>}
                      {profileError && <div className="text-xs text-[#D61F2C] bg-[#D61F2C]/10 border border-[#D61F2C]/20 p-3.5 rounded-xl mb-4 font-semibold">{profileError}</div>}

                      <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-black text-neutral-400 block mb-2 uppercase tracking-wide">Full Name</label>
                            <input 
                              type="text" 
                              value={editUsername} 
                              onChange={e => setEditUsername(e.target.value)}
                              className="w-full bg-[#13141a] border border-white/[0.08] focus:border-[#D61F2C] focus:ring-1 focus:ring-[#D61F2C] rounded-xl px-5 py-4 text-white text-sm outline-none transition-all duration-200 shadow-inner"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-xs font-black text-neutral-400 block mb-2 uppercase tracking-wide">Email Address</label>
                            <input 
                              type="email" 
                              value={editEmail} 
                              onChange={e => setEditEmail(e.target.value)}
                              className="w-full bg-[#13141a] border border-white/[0.08] focus:border-[#D61F2C] focus:ring-1 focus:ring-[#D61F2C] rounded-xl px-5 py-4 text-white text-sm outline-none transition-all duration-200 shadow-inner"
                              required
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-xs font-black text-neutral-400 block mb-2 uppercase tracking-wide">Phone Number</label>
                            <input 
                              type="tel" 
                              value={editPhone} 
                              onChange={e => setEditPhone(e.target.value)}
                              className="w-full bg-[#13141a] border border-white/[0.08] focus:border-[#D61F2C] focus:ring-1 focus:ring-[#D61F2C] rounded-xl px-5 py-4 text-white text-sm outline-none transition-all duration-200 shadow-inner"
                              required
                            />
                          </div>
                        </div>
                        <button 
                          type="submit" 
                          disabled={submitting}
                          className="px-8 py-4 bg-gradient-to-r from-[#D61F2C] to-[#E53935] hover:from-[#E53935] hover:to-[#ff4d5a] text-white text-sm font-extrabold uppercase rounded-xl transition-all duration-300 shadow-md shadow-red-950/20 hover:scale-[1.01]"
                        >
                          {submitting ? 'Saving Changes...' : 'Save Profile Details'}
                        </button>
                      </form>
                    </div>

                    {/* Account Security Update */}
                    <div style={{ background: 'linear-gradient(145deg, #1f222e, #161720)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(214,31,44,0.4), transparent)' }} />
                      <h3 className="text-base font-extrabold text-white flex items-center gap-2 mb-1.5">
                        <Lock className="text-[#D61F2C]" size={16} />
                        <span>Security Credentials</span>
                      </h3>
                      <p className="text-sm text-[#A1A1AA] mb-6">Change password periodically to safeguard booking records.</p>

                      {pwdSuccess && <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 p-3.5 rounded-xl mb-4 font-semibold">{pwdSuccess}</div>}
                      {pwdError && <div className="text-xs text-[#D61F2C] bg-[#D61F2C]/10 border border-[#D61F2C]/20 p-3.5 rounded-xl mb-4 font-semibold">{pwdError}</div>}

                      <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                          <label className="text-xs font-black text-neutral-400 block mb-2 uppercase tracking-wide">Current Account Password</label>
                          <input 
                            type="password" 
                            value={oldPassword} 
                            onChange={e => setOldPassword(e.target.value)}
                            className="w-full bg-[#13141a] border border-white/[0.08] focus:border-[#D61F2C] focus:ring-1 focus:ring-[#D61F2C] rounded-xl px-5 py-4 text-white text-sm outline-none transition-all duration-200 shadow-inner"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-black text-neutral-400 block mb-2 uppercase tracking-wide">New Secure Password</label>
                            <input 
                              type="password" 
                              value={newPassword} 
                              onChange={e => setNewPassword(e.target.value)}
                              className="w-full bg-[#13141a] border border-white/[0.08] focus:border-[#D61F2C] focus:ring-1 focus:ring-[#D61F2C] rounded-xl px-5 py-4 text-white text-sm outline-none transition-all duration-200 shadow-inner"
                              required
                              minLength={6}
                            />
                            {newPassword && (
                              <div className="mt-2">
                                <div className="flex gap-1.5 h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all duration-300 ${newPassword.length < 8 ? 'bg-red-500 w-1/3' : newPassword.length < 12 ? 'bg-yellow-500 w-2/3' : 'bg-green-500 w-full'}`}></div>
                                </div>
                                <span className="text-[9px] text-neutral-500 font-bold uppercase mt-1 block">
                                  Password Strength: {newPassword.length < 8 ? 'Weak' : newPassword.length < 12 ? 'Moderate' : 'Excellent'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="text-xs font-black text-neutral-400 block mb-2 uppercase tracking-wide">Re-type New Password</label>
                            <input 
                              type="password" 
                              value={confirmPassword} 
                              onChange={e => setConfirmPassword(e.target.value)}
                              className="w-full bg-[#13141a] border border-white/[0.08] focus:border-[#D61F2C] focus:ring-1 focus:ring-[#D61F2C] rounded-xl px-5 py-4 text-white text-sm outline-none transition-all duration-200 shadow-inner"
                              required
                            />
                          </div>
                        </div>
                        <button 
                          type="submit" 
                          disabled={submitting}
                          className="px-8 py-4 bg-gradient-to-r from-[#D61F2C] to-[#E53935] hover:from-[#E53935] hover:to-[#ff4d5a] text-white text-sm font-extrabold uppercase rounded-xl transition-all duration-300 shadow-md shadow-red-950/20 hover:scale-[1.01]"
                        >
                          {submitting ? 'Updating...' : 'Change Portal Password'}
                        </button>
                      </form>
                    </div>

                  </div>
                </div>
              )}
            </>
          )}

        </main>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          MODALS
         ───────────────────────────────────────────────────────────────────────── */}

      {/* 1. Add/Edit Vehicle Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div style={{ background: 'linear-gradient(145deg, #1f222e, #161720)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '2rem', boxShadow: '0 24px 64px rgba(0,0,0,0.85)', position: 'relative', overflow: 'hidden' }} className="max-w-2xl w-full">
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #D61F2C, #E53935)' }} />
            
            <div className="flex justify-between items-center border-b border-white/[0.05] pb-4 mb-5">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">{editingVehicle ? 'Edit Vehicle Details' : 'Add New Vehicle'}</h3>
              <button onClick={() => setShowVehicleModal(false)} className="text-2xl text-neutral-400 hover:text-white transition-colors duration-150 leading-none">&times;</button>
            </div>
            {formError && <div className="text-xs text-[#D61F2C] bg-[#D61F2C]/10 border border-[#D61F2C]/20 p-3.5 rounded-xl mb-4 font-semibold">{formError}</div>}
            
            <form onSubmit={handleVehicleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-black text-neutral-400 block mb-2 uppercase tracking-wide">Plate / Vehicle Number *</label>
                <input 
                  type="text" 
                  value={vehicleNumber} 
                  onChange={e => setVehicleNumber(e.target.value)} 
                  placeholder="e.g. BA 3 PA 1234"
                  className="w-full bg-[#13141a] border border-white/[0.08] focus:border-[#D61F2C] focus:ring-1 focus:ring-[#D61F2C] rounded-xl px-5 py-4 text-white text-sm outline-none transition-all duration-200 shadow-inner"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-neutral-400 block mb-2 uppercase tracking-wide">Make *</label>
                  <input 
                    type="text" 
                    value={make} 
                    onChange={e => setMake(e.target.value)} 
                    placeholder="e.g. Honda"
                    className="w-full bg-[#13141a] border border-white/[0.08] focus:border-[#D61F2C] focus:ring-1 focus:ring-[#D61F2C] rounded-xl px-5 py-4 text-white text-sm outline-none transition-all duration-200 shadow-inner"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-neutral-400 block mb-2 uppercase tracking-wide">Model *</label>
                  <input 
                    type="text" 
                    value={model} 
                    onChange={e => setModel(e.target.value)} 
                    placeholder="e.g. Civic"
                    className="w-full bg-[#13141a] border border-white/[0.08] focus:border-[#D61F2C] focus:ring-1 focus:ring-[#D61F2C] rounded-xl px-5 py-4 text-white text-sm outline-none transition-all duration-200 shadow-inner"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-neutral-400 block mb-2 uppercase tracking-wide">Year</label>
                  <input 
                    type="number" 
                    value={year} 
                    onChange={e => setYear(e.target.value ? Number(e.target.value) : '')} 
                    placeholder="e.g. 2022"
                    className="w-full bg-[#13141a] border border-white/[0.08] focus:border-[#D61F2C] focus:ring-1 focus:ring-[#D61F2C] rounded-xl px-5 py-4 text-white text-sm outline-none transition-all duration-200 shadow-inner"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-neutral-400 block mb-2 uppercase tracking-wide">Color</label>
                  <input 
                    type="text" 
                    value={color} 
                    onChange={e => setColor(e.target.value)} 
                    placeholder="e.g. Matte Black"
                    className="w-full bg-[#13141a] border border-white/[0.08] focus:border-[#D61F2C] focus:ring-1 focus:ring-[#D61F2C] rounded-xl px-5 py-4 text-white text-sm outline-none transition-all duration-200 shadow-inner"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-neutral-400 block mb-2 uppercase tracking-wide">Notes (Engine code, specs, etc.)</label>
                <textarea 
                  value={vehicleNotes} 
                  onChange={e => setVehicleNotes(e.target.value)} 
                  placeholder="Additional configurations..."
                  rows={3}
                  className="w-full bg-[#13141a] border border-white/[0.08] focus:border-[#D61F2C] focus:ring-1 focus:ring-[#D61F2C] rounded-xl px-5 py-4 text-white text-sm outline-none resize-none transition-all duration-200 shadow-inner"
                />
              </div>
              <div className="flex justify-end gap-3 pt-5 border-t border-white/[0.05]">
                <button type="button" onClick={() => setShowVehicleModal(false)} className="px-6 py-4 text-sm border border-white/10 hover:border-white/20 hover:bg-white/5 text-neutral-300 hover:text-white font-extrabold uppercase rounded-xl transition-all duration-200">Cancel</button>
                <button type="submit" disabled={submitting} className="px-8 py-4 bg-gradient-to-r from-[#D61F2C] to-[#E53935] hover:from-[#E53935] hover:to-[#ff4d5a] text-white font-extrabold uppercase rounded-xl transition-all duration-200 shadow-md shadow-red-950/20 hover:scale-[1.01]">{submitting ? 'Saving...' : 'Save Vehicle'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Book Appointment Modal */}
      {showApptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div style={{ background: 'linear-gradient(145deg, #1f222e, #161720)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '2rem', boxShadow: '0 24px 64px rgba(0,0,0,0.85)', position: 'relative', overflow: 'hidden' }} className="max-w-2xl w-full">
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #D61F2C, #E53935)' }} />
            
            <div className="flex justify-between items-center border-b border-white/[0.05] pb-4 mb-5">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Book Service Slot</h3>
              <button onClick={() => setShowApptModal(false)} className="text-2xl text-neutral-400 hover:text-white transition-colors duration-150 leading-none">&times;</button>
            </div>
            {formError && <div className="text-xs text-[#D61F2C] bg-[#D61F2C]/10 border border-[#D61F2C]/20 p-3.5 rounded-xl mb-4 font-semibold">{formError}</div>}
 
            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div>
                <label className="text-xs font-black text-neutral-400 block mb-2 uppercase tracking-wide">Service Type *</label>
                <select 
                  value={apptServiceType} 
                  onChange={e => setApptServiceType(e.target.value)}
                  className="w-full bg-[#13141a] border border-white/[0.08] focus:border-[#D61F2C] focus:ring-1 focus:ring-[#D61F2C] rounded-xl px-5 py-4 text-white text-sm outline-none transition-all duration-200 shadow-inner"
                  required
                >
                  <option value="" className="bg-[#13141a]">Select Service...</option>
                  <option value="Engine Diagnostics" className="bg-[#13141a]">Engine Diagnostics</option>
                  <option value="Repairs & Maintenance" className="bg-[#13141a]">Repairs & Maintenance</option>
                  <option value="Brake Service" className="bg-[#13141a]">Brake Service</option>
                  <option value="Tires & Wheel Service" className="bg-[#13141a]">Tires & Wheel Service</option>
                  <option value="Performance Upgrades" className="bg-[#13141a]">Performance Upgrades</option>
                  <option value="Oil Change" className="bg-[#13141a]">Oil Change</option>
                  <option value="Other / Diagnostics" className="bg-[#13141a]">Other / Diagnostics</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-neutral-400 block mb-2 uppercase tracking-wide">Vehicle</label>
                <select 
                  value={apptVehicleId} 
                  onChange={e => setApptVehicleId(e.target.value)}
                  className="w-full bg-[#13141a] border border-white/[0.08] focus:border-[#D61F2C] focus:ring-1 focus:ring-[#D61F2C] rounded-xl px-5 py-4 text-white text-sm outline-none transition-all duration-200 shadow-inner"
                >
                  <option value="" className="bg-[#13141a]">No specific vehicle</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id} className="bg-[#13141a]">{v.make} {v.model} ({v.vehicleNumber})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-neutral-400 block mb-2 uppercase tracking-wide">Date & Time *</label>
                <input 
                  type="datetime-local" 
                  value={apptDate} 
                  onChange={e => setApptDate(e.target.value)}
                  className="w-full bg-[#13141a] border border-white/[0.08] focus:border-[#D61F2C] focus:ring-1 focus:ring-[#D61F2C] rounded-xl px-5 py-4 text-white text-sm outline-none transition-all duration-200 shadow-inner"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-black text-neutral-400 block mb-2 uppercase tracking-wide">Symptoms / Issue Notes</label>
                <textarea 
                  value={apptNotes} 
                  onChange={e => setApptNotes(e.target.value)} 
                  placeholder="Describe what issue your vehicle is facing..."
                  rows={3}
                  className="w-full bg-[#13141a] border border-white/[0.08] focus:border-[#D61F2C] focus:ring-1 focus:ring-[#D61F2C] rounded-xl px-5 py-4 text-white text-sm outline-none resize-none transition-all duration-200 shadow-inner"
                />
              </div>
              <div className="flex justify-end gap-3 pt-5 border-t border-white/[0.05]">
                <button type="button" onClick={() => setShowApptModal(false)} className="px-6 py-4 text-sm border border-white/10 hover:border-white/20 hover:bg-white/5 text-neutral-300 hover:text-white font-extrabold uppercase rounded-xl transition-all duration-200">Cancel</button>
                <button type="submit" disabled={submitting} className="px-8 py-4 bg-gradient-to-r from-[#D61F2C] to-[#E53935] hover:from-[#E53935] hover:to-[#ff4d5a] text-white font-extrabold uppercase rounded-xl transition-all duration-200 shadow-md shadow-red-950/20 hover:scale-[1.01]">{submitting ? 'Booking...' : 'Confirm Book'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Request Unavailable Part Modal */}
      {showPartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div style={{ background: 'linear-gradient(145deg, #1f222e, #161720)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '2rem', boxShadow: '0 24px 64px rgba(0,0,0,0.85)', position: 'relative', overflow: 'hidden' }} className="max-w-2xl w-full">
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #D61F2C, #E53935)' }} />
            
            <div className="flex justify-between items-center border-b border-white/[0.05] pb-4 mb-5">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Request Unavailable Part</h3>
              <button onClick={() => setShowPartModal(false)} className="text-2xl text-neutral-400 hover:text-white transition-colors duration-150 leading-none">&times;</button>
            </div>
            {formError && <div className="text-xs text-[#D61F2C] bg-[#D61F2C]/10 border border-[#D61F2C]/20 p-3 rounded-xl mb-4 font-semibold">{formError}</div>}
 
            <form onSubmit={handleRequestPart} className="space-y-4">
              <div>
                <label className="text-xs font-black text-neutral-400 block mb-2 uppercase tracking-wide">Part Name *</label>
                <input 
                  type="text" 
                  value={reqPartName} 
                  onChange={e => setReqPartName(e.target.value)} 
                  placeholder="e.g. Brembo Carbon Brake Pad Set"
                  className="w-full bg-[#13141a] border border-white/[0.08] focus:border-[#D61F2C] focus:ring-1 focus:ring-[#D61F2C] rounded-xl px-5 py-4 text-white text-sm outline-none transition-all duration-200 shadow-inner"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-black text-neutral-400 block mb-2 uppercase tracking-wide">Part Code / Catalog Number (Optional)</label>
                <input 
                  type="text" 
                  value={reqPartNumber} 
                  onChange={e => setReqPartNumber(e.target.value)} 
                  placeholder="e.g. BR-8921-X"
                  className="w-full bg-[#13141a] border border-white/[0.08] focus:border-[#D61F2C] focus:ring-1 focus:ring-[#D61F2C] rounded-xl px-5 py-4 text-white text-sm outline-none transition-all duration-200 shadow-inner"
                />
              </div>
              <div>
                <label className="text-xs font-black text-neutral-400 block mb-2 uppercase tracking-wide">Specific Description / Compatibility Specs</label>
                <textarea 
                  value={reqDescription} 
                  onChange={e => setReqDescription(e.target.value)} 
                  placeholder="Compatible with Honda Civic 1.5L Turbo, etc."
                  rows={3}
                  className="w-full bg-[#13141a] border border-white/[0.08] focus:border-[#D61F2C] focus:ring-1 focus:ring-[#D61F2C] rounded-xl px-5 py-4 text-white text-sm outline-none resize-none transition-all duration-200 shadow-inner"
                />
              </div>
              <div className="flex justify-end gap-3 pt-5 border-t border-white/[0.05]">
                <button type="button" onClick={() => setShowPartModal(false)} className="px-6 py-4 text-sm border border-white/10 hover:border-white/20 hover:bg-white/5 text-neutral-300 hover:text-white font-extrabold uppercase rounded-xl transition-all duration-200">Cancel</button>
                <button type="submit" disabled={submitting} className="px-8 py-4 bg-gradient-to-r from-[#D61F2C] to-[#E53935] hover:from-[#E53935] hover:to-[#ff4d5a] text-white font-extrabold uppercase rounded-xl transition-all duration-200 shadow-md shadow-red-950/20 hover:scale-[1.01]">{submitting ? 'Submitting...' : 'Submit Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Write Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div style={{ background: 'linear-gradient(145deg, #1f222e, #161720)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '2rem', boxShadow: '0 24px 64px rgba(0,0,0,0.85)', position: 'relative', overflow: 'hidden' }} className="max-w-2xl w-full">
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #D61F2C, #E53935)' }} />
            
            <div className="flex justify-between items-center border-b border-white/[0.05] pb-4 mb-5">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Submit Service Feedback</h3>
              <button onClick={() => setShowReviewModal(false)} className="text-2xl text-neutral-400 hover:text-white transition-colors duration-150 leading-none">&times;</button>
            </div>
            {formError && <div className="text-xs text-[#D61F2C] bg-[#D61F2C]/10 border border-[#D61F2C]/20 p-3.5 rounded-xl mb-4 font-semibold">{formError}</div>}
 
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="text-xs font-black text-neutral-400 block mb-2 uppercase tracking-wide">Select Completed Invoice (Optional)</label>
                <select 
                  value={revInvoiceId} 
                  onChange={e => setRevInvoiceId(e.target.value)}
                  className="w-full bg-[#13141a] border border-white/[0.08] focus:border-[#D61F2C] focus:ring-1 focus:ring-[#D61F2C] rounded-xl px-5 py-4 text-white text-sm outline-none transition-all duration-200 shadow-inner"
                >
                  <option value="" className="bg-[#13141a]">General Service Feedback</option>
                  {invoices.map(inv => (
                    <option key={inv.id} value={inv.id} className="bg-[#13141a]">Invoice #{inv.invoiceNumber} (${inv.totalAmount.toFixed(2)})</option>
                  ))}
                </select>
              </div>
              
              {/* Rating stars selector */}
              <div>
                <label className="text-xs font-black text-neutral-400 block mb-2 uppercase tracking-wide">Service Rating *</label>
                <div className="flex items-center gap-2.5 mt-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      size={24} 
                      onClick={() => setRevRating(star)}
                      className={`cursor-pointer transition-all duration-150 ${star <= revRating ? "text-yellow-500 fill-yellow-500 scale-110 drop-shadow-[0_0_5px_rgba(234,179,8,0.6)]" : "text-[#2E2E2E] hover:text-yellow-600"}`} 
                    />
                  ))}
                </div>
              </div>
 
              <div>
                <label className="text-xs font-black text-neutral-400 block mb-2 uppercase tracking-wide">Feedback / Comment *</label>
                <textarea 
                  value={revComment} 
                  onChange={e => setRevComment(e.target.value)} 
                  placeholder="Share your service experience..."
                  rows={4}
                  className="w-full bg-[#13141a] border border-white/[0.08] focus:border-[#D61F2C] focus:ring-1 focus:ring-[#D61F2C] rounded-xl px-5 py-4 text-white text-sm outline-none resize-none transition-all duration-200 shadow-inner"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-5 border-t border-white/[0.05]">
                <button type="button" onClick={() => setShowReviewModal(false)} className="px-6 py-4 text-sm border border-white/10 hover:border-white/20 hover:bg-white/5 text-neutral-300 hover:text-white font-extrabold uppercase rounded-xl transition-all duration-200">Cancel</button>
                <button type="submit" disabled={submitting} className="px-8 py-4 bg-gradient-to-r from-[#D61F2C] to-[#E53935] hover:from-[#E53935] hover:to-[#ff4d5a] text-white font-extrabold uppercase rounded-xl transition-all duration-200 shadow-md shadow-red-950/20 hover:scale-[1.01]">{submitting ? 'Submitting...' : 'Post Review'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Laser Garage Receipt Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto print:p-0 print:bg-white">
          <div className="bg-white text-neutral-950 border border-neutral-200 rounded-2xl max-w-2xl w-full p-8 shadow-[0_0_60px_rgba(255,255,255,0.05)] relative overflow-hidden font-mono text-xs print:border-none print:shadow-none print:p-0 print:rounded-none">
            
            {/* Stamp Overlay */}
            <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 px-6 py-2.5 rounded-xl font-sans font-black text-2xl uppercase select-none pointer-events-none opacity-15 tracking-widest ${
              selectedInvoice.status === 'Paid' ? 'border-green-600 text-green-600' : 'border-amber-600 text-amber-600'
            }`}>
              {selectedInvoice.status === 'Paid' ? 'PAID IN FULL' : 'PAYMENT PENDING'}
            </div>

            {/* Receipt Header */}
            <div className="flex justify-between items-start border-b-2 border-neutral-300 pb-5 mb-5">
              <div>
                <h2 className="text-xl font-sans font-black tracking-tighter text-[#D61F2C] mb-1">AUTOCRAFT GARAGE</h2>
                <p className="text-[10px] text-neutral-500 font-sans">HIGH PERFORMANCE CAR MAINTENANCE & PARTS</p>
                <div className="mt-2.5 text-[10px] text-neutral-600 space-y-0.5">
                  <p>123 PERFORMANCE ROAD, AUTOMOTIVE SECTOR</p>
                  <p>TEL: +1 (555) AUTOCRAFT | WORKSHOP@AUTOCRAFT.COM</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block">Receipt Record</span>
                <span className="font-bold text-sm text-neutral-900 font-sans block">INV-{selectedInvoice.invoiceNumber}</span>
                <span className="text-[10px] text-neutral-500 block mt-1">{new Date(selectedInvoice.saleDate).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Bill To & Vehicle Specs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6 bg-neutral-50 p-4 rounded-xl border border-neutral-200/60 text-[11px]">
              <div>
                <span className="text-[9px] text-neutral-400 font-black uppercase tracking-wider block mb-1">CLIENT BILLING DETAILS</span>
                <p className="font-extrabold text-neutral-950">{profile?.fullName || 'Verified Customer'}</p>
                <p className="text-neutral-600 mt-0.5">{profile?.email || 'customer@system.com'}</p>
                <p className="text-neutral-600">{profile?.phoneNumber || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[9px] text-neutral-400 font-black uppercase tracking-wider block mb-1">SERVICED VEHICLE</span>
                {selectedInvoice.vehicle ? (
                  <>
                    <p className="font-extrabold text-neutral-950">{selectedInvoice.vehicle.make} {selectedInvoice.vehicle.model}</p>
                    <p className="text-neutral-600 mt-0.5">Plate: <span className="font-bold">{selectedInvoice.vehicle.vehicleNumber}</span></p>
                    <p className="text-neutral-600">Color: {(selectedInvoice.vehicle as any).color || 'N/A'}</p>
                  </>
                ) : (
                  <p className="text-neutral-500 italic">No specific vehicle registered for purchase</p>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="border-t border-b border-neutral-300 py-3 mb-6">
              <div className="grid grid-cols-12 font-bold text-neutral-700 uppercase tracking-wider text-[10px] pb-2 border-b border-neutral-200/80 mb-2.5">
                <span className="col-span-6">Item / Service Details</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-2 text-right">Price</span>
                <span className="col-span-2 text-right">Total</span>
              </div>
              <div className="space-y-2">
                {selectedInvoice.items.map((item: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-12 text-[11px] text-neutral-800">
                    <span className="col-span-6 font-extrabold text-neutral-900">{item.partName}</span>
                    <span className="col-span-2 text-center">{item.quantity}</span>
                    <span className="col-span-2 text-right font-sans">${item.unitPrice.toFixed(2)}</span>
                    <span className="col-span-2 text-right font-sans font-bold text-neutral-950">${item.lineTotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Invoice Totals calculation */}
            <div className="flex justify-end mb-8">
              <div className="w-full sm:w-64 space-y-2 text-[11px] border-t border-neutral-200 pt-3">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-sans">${selectedInvoice.subtotal.toFixed(2)}</span>
                </div>
                {selectedInvoice.discountPercent > 0 && (
                  <div className="flex justify-between text-fuchsia-700 font-extrabold">
                    <span>Loyalty Savings ({selectedInvoice.discountPercent}%)</span>
                    <span className="font-sans">-${selectedInvoice.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t-2 border-neutral-300 pt-2 text-sm font-sans font-black text-neutral-950">
                  <span>TOTAL DUE</span>
                  <span className="text-[#D61F2C]">${selectedInvoice.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Invoice Note / Footer */}
            <div className="text-center border-t border-dashed border-neutral-300 pt-6 text-[10px] text-neutral-500">
              <p className="font-bold text-neutral-800 uppercase tracking-widest mb-1">Thank you for your business!</p>
              <p>For custom spares or loyalty tier inquiries, contact service@autocraft.com</p>
              <p className="mt-4 text-[9px] font-sans text-neutral-400 font-bold">AUTOCRAFT AUTOMOTIVE SYSTEMS | POWERED BY DOTNET & NEXT.JS</p>
            </div>

            {/* Print & Close Control Buttons */}
            <div className="mt-8 flex justify-end gap-3 pt-5 border-t border-neutral-200 print:hidden">
              <button 
                type="button" 
                onClick={() => setSelectedInvoice(null)} 
                className="px-4.5 py-2 border border-neutral-300 hover:border-neutral-800 bg-transparent text-neutral-700 hover:text-neutral-950 text-xs font-bold uppercase rounded-lg transition-colors font-sans"
              >
                Close Receipt
              </button>
              <button 
                type="button" 
                onClick={() => window.print()} 
                className="px-5 py-2 bg-[#D61F2C] hover:bg-[#F22635] text-white text-xs font-bold uppercase rounded-lg transition-colors shadow-md font-sans"
              >
                Print Invoice
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
