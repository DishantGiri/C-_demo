'use client';
import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthLayout from '../../components/AuthLayout';

export default function Login() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5215/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        router.push('/');
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          setError('A server error occurred. Please check credentials or try again.');
        } else {
          const errText = await response.text();
          setError(errText || 'Invalid credentials');
        }
      }
    } catch (err) {
      setError('Failed to connect to the server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-header">
        <h1>Welcome Back</h1>
        <p>Login to your account</p>
      </div>

      {error && <div style={{ color: '#F22635', marginBottom: '1rem', textAlign: 'center', fontSize: '0.85rem' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
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

        <div className="form-group">
          <label>Password</label>
          <div className="input-wrapper">
            <Lock className="input-icon" />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Enter your password" 
              className="auth-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {showPassword ? 
              <EyeOff className="input-icon-right" onClick={() => setShowPassword(false)} /> : 
              <Eye className="input-icon-right" onClick={() => setShowPassword(true)} />
            }
          </div>
        </div>

        <div className="auth-options">
          <Link href="#" className="forgot-password">Forgot Password?</Link>
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? 'Logging in...' : <>Log In <ArrowRight size={20} /></>}
        </button>

        <div className="auth-footer-text">
          Don't have an account? <Link href="/register">Sign Up</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
