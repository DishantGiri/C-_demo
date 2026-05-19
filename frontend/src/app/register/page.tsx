'use client';
import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthLayout from '../../components/AuthLayout';

export default function Register() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = (val: string) => {
    if (!val) return '';
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{6,}$/;
    return regex.test(val) ? '' : 'Must be 6+ chars with uppercase, lowercase, digit & special character.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const pwdErr = validatePassword(password);
    if (pwdErr) { setPasswordError(pwdErr); return; }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      setError('Phone number must be exactly 10 digits.');
      return;
    }

    setLoading(true);

    try {
      // Send phoneNumber to the backend now that the attribute exists
      const response = await fetch('http://localhost:5215/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: fullName, email, phoneNumber: phone, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        router.push('/');
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          setError('A server error occurred. Please try again.');
        } else {
          const errText = await response.text();
          setError(errText || 'Registration failed');
        }
      }
    } catch (err) {
      setError('Failed to connect to the server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout isRegister={true}>
      <div className="auth-header">
        <h1>Create Account</h1>
        <p>Join us and get your car serviced</p>
      </div>

      {error && <div style={{ color: '#F22635', marginBottom: '1rem', textAlign: 'center', fontSize: '0.85rem' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Full Name</label>
            <div className="input-wrapper">
              <User className="input-icon" />
              <input 
                type="text" 
                placeholder="Enter your full name" 
                className="auth-input" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" />
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="auth-input" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <div className="input-wrapper">
            <Phone className="input-icon" />
            <input 
              type="tel" 
              placeholder="Enter your 10-digit phone number" 
              className="auth-input" 
              value={phone}
              onChange={(e) => {
                // Only allow numbers to be typed
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 10) setPhone(value);
              }}
              required
              pattern="\d{10}"
              title="Phone number must be exactly 10 digits"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Password</label>
          <div className="input-wrapper">
            <Lock className="input-icon" />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Create a password" 
              className={`auth-input${passwordError ? ' input-error' : ''}`}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(validatePassword(e.target.value)); }}
              required
            />
            {showPassword ? 
              <EyeOff className="input-icon-right" onClick={() => setShowPassword(false)} /> : 
              <Eye className="input-icon-right" onClick={() => setShowPassword(true)} />
            }
          </div>
          {passwordError && <p className="field-error-msg">{passwordError}</p>}
        </div>

        <div className="form-group">
          <label>Confirm Password</label>
          <div className="input-wrapper">
            <Lock className="input-icon" />
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              placeholder="Confirm your password" 
              className={`auth-input${confirmPasswordError ? ' input-error' : ''}`}
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setConfirmPasswordError(e.target.value !== password ? 'Passwords do not match.' : ''); }}
              required
            />
            {showConfirmPassword ? 
              <EyeOff className="input-icon-right" onClick={() => setShowConfirmPassword(false)} /> : 
              <Eye className="input-icon-right" onClick={() => setShowConfirmPassword(true)} />
            }
          </div>
          {confirmPasswordError && <p className="field-error-msg">{confirmPasswordError}</p>}
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? 'Creating Account...' : <>Create Account <ArrowRight size={20} /></>}
        </button>

        <div className="auth-footer-text">
          Already have an account? <Link href="/login">Log In</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
