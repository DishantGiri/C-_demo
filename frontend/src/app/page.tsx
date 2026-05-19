'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [isCustomer, setIsCustomer] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
        if (role === 'Admin') setIsAdmin(true);
        if (role === 'Staff') setIsStaff(true);
        if (role === 'Customer') setIsCustomer(true);
        setUsername(payload.email ? payload.email.split('@')[0] : role);
      } catch (e) {
        setIsLoggedIn(false);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setIsStaff(false);
    setIsCustomer(false);
    router.push('/');
  };

  const handleBookClick = () => {
    if (isLoggedIn) {
      if (isCustomer) {
        router.push('/customer/dashboard');
      } else if (isAdmin) {
        router.push('/admin/parts');
      } else {
        router.push('/staff/sales');
      }
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="var(--primary-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="38" height="38" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" strokeWidth="2"></circle>
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"></path>
            <circle cx="12" cy="12" r="4" fill="var(--primary-accent)"></circle>
          </svg>
          <div className="logo-text-wrapper">
            <span className="logo-main">RED<span className="white-text">LINE</span></span>
            <span className="logo-sub">AUTO GARAGE</span>
          </div>
        </div>
        <div className="navbar-links">
          <Link href="/" className="active">Home</Link>
          <Link href="#services">Services</Link>
          <Link href="#about">About Us</Link>
          {isAdmin && (
            <>
              <Link href="/admin/users" style={{ color: 'var(--primary-accent)', fontWeight: 800, textShadow: '0 0 10px rgba(214, 31, 44, 0.4)' }}>Users</Link>
              <Link href="/admin/parts" style={{ color: 'var(--primary-accent)', fontWeight: 800, textShadow: '0 0 10px rgba(214, 31, 44, 0.4)' }}>Parts</Link>
              <Link href="/admin/vendors" style={{ color: 'var(--primary-accent)', fontWeight: 800, textShadow: '0 0 10px rgba(214, 31, 44, 0.4)' }}>Vendors</Link>
              <Link href="/admin/reports" style={{ color: 'var(--primary-accent)', fontWeight: 800, textShadow: '0 0 10px rgba(214, 31, 44, 0.4)' }}>Financials</Link>
              <Link href="/staff/customers" style={{ color: 'var(--primary-accent)', fontWeight: 800, textShadow: '0 0 10px rgba(214, 31, 44, 0.4)' }}>Customers</Link>
              <Link href="/staff/sales" style={{ color: 'var(--primary-accent)', fontWeight: 800, textShadow: '0 0 10px rgba(214, 31, 44, 0.4)' }}>Sales</Link>
            </>
          )}
          {isStaff && (
            <>
              <Link href="/staff/customers" style={{ color: 'var(--primary-accent)', fontWeight: 800, textShadow: '0 0 10px rgba(214, 31, 44, 0.4)' }}>Customers</Link>
              <Link href="/staff/sales" style={{ color: 'var(--primary-accent)', fontWeight: 800, textShadow: '0 0 10px rgba(214, 31, 44, 0.4)' }}>Sales</Link>
              <Link href="/staff/reports" style={{ color: 'var(--primary-accent)', fontWeight: 800, textShadow: '0 0 10px rgba(214, 31, 44, 0.4)' }}>Reports</Link>
            </>
          )}
          {isCustomer && (
            <Link href="/customer/dashboard" style={{ color: 'var(--primary-accent)', fontWeight: 800, textShadow: '0 0 10px rgba(214, 31, 44, 0.4)' }}>My Portal</Link>
          )}
        </div>
        <div className="navbar-cta-group" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          {isLoggedIn ? (
            <>
              <span className="user-welcome-text" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Welcome, <strong style={{ color: '#fff' }}>{username}</strong>
              </span>
              <button className="navbar-cta-btn" onClick={handleLogout} style={{ background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '0.6rem 1.2rem' }}>
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', textDecoration: 'none', transition: 'color 0.2s' }}>
                Log In
              </Link>
              <Link href="/register" className="navbar-cta-btn" style={{ textDecoration: 'none', padding: '0.6rem 1.2rem' }}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <span className="hero-tagline">PERFORMANCE. PRECISION. PASSION.</span>
            <h1>DRIVEN BY PASSION <br /><span className="red-text">BUILT TO PERFORM</span></h1>
            <p>Expert care for your car. Unmatched performance for your journey.</p>
            <div className="hero-btn-group">
              <button className="hero-cta-btn" onClick={handleBookClick}>
                BOOK APPOINTMENT <span className="btn-arrow">→</span>
              </button>
            </div>
          </div>
          <div className="hero-image-wrapper">
            <div className="hero-bg-glow"></div>
            <img 
              src="/hero-car.png" 
              alt="Sleek black sports car with red stripes" 
              className="hero-car-img"
            />
          </div>
        </div>
      </header>

      {/* Services Section */}
      <section id="services" className="services-section">
        <div className="section-header">
          <span className="section-subtitle">OUR SERVICES</span>
          <h2>WHAT WE DO BEST</h2>
          <div className="section-underline"></div>
        </div>

        <div className="services-grid">
          {/* Card 1: Engine Diagnostics */}
          <div className="service-card">
            <div className="service-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="44" height="44" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2v4h6M3 10h4l3 9 4-15 3 9h4" />
                <rect x="2" y="6" width="20" height="14" rx="2" />
              </svg>
            </div>
            <h3>ENGINE DIAGNOSTICS</h3>
            <p>Advanced diagnostics to identify and fix issues quickly and accurately.</p>
            <Link href="#" className="service-link">
              LEARN MORE <span className="link-arrow">→</span>
            </Link>
          </div>

          {/* Card 2: Repairs & Maintenance */}
          <div className="service-card">
            <div className="service-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="44" height="44" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                <path d="M8 16l-4-4M16 8l4 4" />
              </svg>
            </div>
            <h3>REPAIRS & MAINTENANCE</h3>
            <p>Expert repairs and routine maintenance for all vehicle types.</p>
            <Link href="#" className="service-link">
              LEARN MORE <span className="link-arrow">→</span>
            </Link>
          </div>

          {/* Card 3: Brake Service */}
          <div className="service-card">
            <div className="service-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="44" height="44" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              </svg>
            </div>
            <h3>BRAKE SERVICE</h3>
            <p>Ensure your safety with our professional brake inspection and repair.</p>
            <Link href="#" className="service-link">
              LEARN MORE <span className="link-arrow">→</span>
            </Link>
          </div>

          {/* Card 4: Tires & Wheel Service */}
          <div className="service-card">
            <div className="service-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="44" height="44" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="5" />
                <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M5.6 18.4L18.4 5.6" />
              </svg>
            </div>
            <h3>TIRES & WHEEL SERVICE</h3>
            <p>High-quality tires and precision wheel services for optimal performance.</p>
            <Link href="#" className="service-link">
              LEARN MORE <span className="link-arrow">→</span>
            </Link>
          </div>

          {/* Card 5: Performance Upgrades */}
          <div className="service-card">
            <div className="service-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="44" height="44" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 12a9 9 0 0 1 15-6.7L12 12" />
                <circle cx="12" cy="12" r="2" />
                <path d="M12 2v2M2 12h2M12 20v2M20 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4" />
              </svg>
            </div>
            <h3>PERFORMANCE UPGRADES</h3>
            <p>Upgrade your ride with performance parts and tuning solutions.</p>
            <Link href="#" className="service-link">
              LEARN MORE <span className="link-arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="about-section">
        <div className="about-container">
          {/* Col 1: Image wrap */}
          <div className="about-image-column">
            <div className="about-image-card">
              <img 
                src="/about-car.png" 
                alt="Sports car rear styling inside a dimly lit garage" 
                className="about-car-img"
              />
              <div className="about-neon-border"></div>
            </div>
          </div>

          {/* Col 2: About Text Column */}
          <div className="about-content-column">
            <span className="about-subtitle">ABOUT US</span>
            <h2>MORE THAN A GARAGE.<br /><span className="red-text">WE'RE CAR PEOPLE.</span></h2>
            <div className="about-underline"></div>
            <p>
              At Redline Auto Garage, we're more than just a repair shop. We're car enthusiasts dedicated to delivering top-notch service, honest advice, and unbeatable results.
            </p>
            <button className="about-cta-btn">
              LEARN MORE ABOUT US <span className="arrow-right-inline">→</span>
            </button>
          </div>

          {/* Col 3: Features List Column */}
          <div className="about-features-column">
            <div className="feature-item">
              <div className="feature-icon-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="feature-info">
                <h3>EXPERT TEAM</h3>
                <p>Certified mechanics with years of hands-on experience.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </div>
              <div className="feature-info">
                <h3>PREMIUM EQUIPMENT</h3>
                <p>We use the latest tools and technology for the best results.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="7" />
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                </svg>
              </div>
              <div className="feature-info">
                <h3>CUSTOMER FIRST</h3>
                <p>Your satisfaction is our priority. Always.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Stripe Section */}
      <section className="cta-stripe">
        <div className="cta-stripe-container">
          <div className="cta-stripe-left">
            <div className="cta-circle-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div className="cta-stripe-text">
              <span className="cta-stripe-tagline">KEEP YOUR CAR</span>
              <h2>PERFORMING AT ITS BEST</h2>
              <p>Schedule your service today and experience the Redline difference.</p>
            </div>
          </div>
          <div className="cta-stripe-right">
            <button className="cta-stripe-btn">
              BOOK APPOINTMENT NOW <span className="btn-arrow">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-section">
        <div className="footer-container">
          {/* Col 1: About */}
          <div className="footer-column footer-about">
            <div className="footer-logo">
              <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="var(--primary-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" strokeWidth="2"></circle>
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                <circle cx="12" cy="12" r="4" fill="var(--primary-accent)"></circle>
              </svg>
              <div className="logo-text-wrapper">
                <span className="logo-main">RED<span className="white-text">LINE</span></span>
                <span className="logo-sub">AUTO GARAGE</span>
              </div>
            </div>
            <p>We provide professional car repair and maintenance services with honesty, quality, and precision.</p>
            <div className="social-links">
              <Link href="#" className="social-icon-btn">
                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="16" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </Link>
              <Link href="#" className="social-icon-btn">
                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="16" width="16" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </Link>
              <Link href="#" className="social-icon-btn">
                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="16" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
              </Link>
              <Link href="#" className="social-icon-btn">
                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="16" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
              </Link>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="footer-column">
            <h3>QUICK LINKS</h3>
            <ul className="footer-links-list">
              <li><Link href="/"><span className="red-arrow">&gt;</span> Home</Link></li>
              <li><Link href="#services"><span className="red-arrow">&gt;</span> Services</Link></li>
              <li><Link href="#about"><span className="red-arrow">&gt;</span> About Us</Link></li>
              <li><Link href="#"><span className="red-arrow">&gt;</span> Gallery</Link></li>
              <li><Link href="#"><span className="red-arrow">&gt;</span> Blog</Link></li>
              <li><Link href="#"><span className="red-arrow">&gt;</span> Contact</Link></li>
            </ul>
          </div>

          {/* Col 3: Our Services */}
          <div className="footer-column">
            <h3>OUR SERVICES</h3>
            <ul className="footer-links-list">
              <li><Link href="#services"><span className="red-arrow">&gt;</span> Engine Diagnostics</Link></li>
              <li><Link href="#services"><span className="red-arrow">&gt;</span> Repairs & Maintenance</Link></li>
              <li><Link href="#services"><span className="red-arrow">&gt;</span> Brake Service</Link></li>
              <li><Link href="#services"><span className="red-arrow">&gt;</span> Tires & Wheel Service</Link></li>
              <li><Link href="#services"><span className="red-arrow">&gt;</span> Performance Upgrades</Link></li>
              <li><Link href="#services"><span className="red-arrow">&gt;</span> Oil Change</Link></li>
            </ul>
          </div>

          {/* Col 4: Contact Us */}
          <div className="footer-column footer-contact">
            <h3>CONTACT US</h3>
            <ul className="contact-details-list">
              <li>
                <span className="contact-icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" xmlns="http://www.w3.org/2000/svg"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </span>
                <span>123 Garage Street, Auto City, AC 12345</span>
              </li>
              <li>
                <span className="contact-icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </span>
                <span>(123) 456-7890</span>
              </li>
              <li>
                <span className="contact-icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </span>
                <span>info@redlinegarage.com</span>
              </li>
              <li>
                <span className="contact-icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </span>
                <span>Mon - Sat: 8:00 AM - 6:00 PM</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Redline Auto Garage. All Rights Reserved.</p>
          <div className="footer-bottom-links">
            <Link href="#" className="red-link">Privacy Policy</Link>
            <span className="divider">|</span>
            <Link href="#" className="red-link">Terms & Conditions</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
