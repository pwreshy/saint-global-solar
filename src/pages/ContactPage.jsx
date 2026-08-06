import React, { useState } from 'react';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error'

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const tempErrors = {};
        if (!formData.name.trim()) tempErrors.name = 'Full name is required';
        if (!formData.email.trim()) {
            tempErrors.email = 'Email address is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            tempErrors.email = 'Please enter a valid email address';
        }
        if (!formData.subject.trim()) tempErrors.subject = 'Subject is required';
        if (!formData.message.trim()) tempErrors.message = 'Message content cannot be empty';
        
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const honeypot = document.getElementById('website_verify')?.value || '';
            const response = await fetch('/contact.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    subject: formData.subject,
                    message: formData.message,
                    website_verify: honeypot
                })
            });
            const result = await response.json();
            if (response.ok && result.success) {
                setSubmitStatus('success');
            } else {
                setErrors({ submit: result.error || 'Unable to send message. Please try again.' });
            }
        } catch (err) {
            console.error('[ContactPage] Submission failed:', err);
            // Local developer mode fallback simulation
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                setSubmitStatus('success');
            } else {
                setErrors({ submit: 'Unable to connect to the mail server. Please email directly or try again later.' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData({
            name: '',
            email: '',
            subject: '',
            message: ''
        });
        setSubmitStatus(null);
        setErrors({});
    };

    return (
        <div className="business-contact-layout" style={{ background: '#ffffff', fontFamily: 'var(--font)', color: '#1e293b' }}>
            {/* Top section with gradient hero */}
            {/* Top section with gradient hero */}
            <section className="contact-hero" style={{ 
                position: 'relative',
                background: 'linear-gradient(rgba(11, 15, 25, 0.85), rgba(26, 32, 44, 0.85)), url("/nigeria_solar_hero.jpg") no-repeat center center / cover', 
                color: '#ffffff', 
                padding: '100px 24px', 
                textAlign: 'center' 
            }}>
                <div className="contact-container text-center" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '2px' }}>Client Support</span>
                    <h1 className="hero-title" style={{ fontSize: '40px', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading)', color: '#ffffff' }}>Get in Touch</h1>
                    <p className="hero-subtitle" style={{ fontSize: '16px', color: '#f4eee3', lineHeight: '1.6', margin: 0 }}>
                        Have questions about solar equipment capacity, battery installations, quote requests, or contracting options? Reach out to our engineering support team.
                    </p>
                </div>
            </section>

            {/* Main content body with information and form */}
            <section className="contact-body-sec">
                <div className="contact-container">
                    <div className="contact-grid">
                        
                        {/* LEFT COLUMN: QUICK ASSISTANCE CARDS */}
                        <div className="contact-info-col">
                            
                            {/* Email Card */}
                            <div className="info-card">
                                <div className="card-header-flex">
                                    <div className="icon-wrapper email-icon" style={{ background: 'rgba(249,115,22,0.08)', color: 'var(--gold)' }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                            <polyline points="22,6 12,13 2,6"></polyline>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="card-title">Email Support</h3>
                                        <p className="card-tagline">Equipment sales & system inquiries</p>
                                    </div>
                                </div>
                                <p className="card-desc">
                                    Drop us an email if you need assistance with equipment sales, installation quotes, or contracting proposals.
                                </p>
                                <div className="card-action-bar" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <a href="mailto:info@saintglobalsolar.com" className="action-btn email-btn" style={{ justifyContent: 'space-between' }}>
                                        info@saintglobalsolar.com
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14M12 5l7 7-7 7"/>
                                        </svg>
                                    </a>
                                    <a href="mailto:sales@saintglobalsolar.com" className="action-btn email-btn" style={{ justifyContent: 'space-between' }}>
                                        sales@saintglobalsolar.com
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14M12 5l7 7-7 7"/>
                                        </svg>
                                    </a>
                                </div>
                            </div>

                            {/* WhatsApp Card */}
                            <div className="info-card">
                                <div className="card-header-flex">
                                    <div className="icon-wrapper whatsapp-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="card-title">WhatsApp Support</h3>
                                        <p className="card-tagline">Direct chat for pricing & setups</p>
                                    </div>
                                </div>
                                <p className="card-desc">
                                    Need a quick sizing check or want to chat with an installer? Message a SAINT GLOBAL SOLAR representative.
                                </p>
                                <div className="card-action-bar">
                                    <a href="https://wa.me/2349110019990?text=Hi%20SAINT%20GLOBAL%20SOLAR%20Support,%20I%20have%20an%20inquiry%20about%20your%20solar%20products..." target="_blank" rel="noopener noreferrer" className="action-btn whatsapp-btn">
                                        Chat on WhatsApp
                                        <span className="live-indicator">
                                            <span className="live-dot"></span>
                                        </span>
                                    </a>
                                </div>
                            </div>

                            {/* Call Support Card */}
                            <div className="info-card">
                                <div className="card-header-flex">
                                    <div className="icon-wrapper clock-icon" style={{ background: 'rgba(249,115,22,0.08)', color: 'var(--gold)' }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="card-title">Call Support</h3>
                                        <p className="card-tagline">Call us directly</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '14px', color: '#475569', fontWeight: 600 }}>
                                    <a href="tel:09110019990" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#334155' }}>
                                        <span>09110019990 (Primary)</span>
                                    </a>
                                    <a href="tel:08142943188" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#334155' }}>
                                        <span>08142943188 (Secondary)</span>
                                    </a>
                                </div>
                            </div>


                        </div>

                        {/* RIGHT COLUMN: INTERACTIVE FORM CARD */}
                        <div className="contact-form-col">
                            <div className="form-container-card">
                                {submitStatus === 'success' ? (
                                    <div className="success-state text-center">
                                        <div className="success-icon-container">
                                            <div className="success-icon-checkmark">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                            </div>
                                        </div>
                                        <h2 className="success-title">Message Sent!</h2>
                                        <p className="success-message">
                                            Thank you, <strong>{formData.name}</strong>. Your message has been received.
                                        </p>
                                        <p className="success-meta">
                                            We've sent a confirmation details ticket copy to <strong>{formData.email}</strong> and will get back to you shortly.
                                        </p>
                                        <button onClick={handleReset} className="reset-btn">
                                            Send Another Message
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="business-form">
                                        {/* Honeypot anti-spam input */}
                                        <input 
                                            type="text" 
                                            id="website_verify" 
                                            name="website_verify" 
                                            style={{ display: 'none' }} 
                                            tabIndex={-1} 
                                            autoComplete="off" 
                                        />

                                        <div className="form-head">
                                            <h3>Send us a Message</h3>
                                            <p>Fill out the form below and our response team will review it.</p>
                                        </div>

                                        {errors.submit && (
                                            <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', padding: '12px 14px', borderRadius: '10px', marginBottom: '20px', fontSize: '13.5px', fontWeight: 500 }}>
                                                {errors.submit}
                                            </div>
                                        )}

                                        {/* Name & Email Group */}
                                        <div className="form-group-grid">
                                            <div className="form-group">
                                                <label className="form-label">Full Name</label>
                                                <input 
                                                    type="text" 
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    placeholder="Your name" 
                                                    className={`form-input ${errors.name ? 'input-error' : ''}`}
                                                    disabled={isSubmitting}
                                                />
                                                {errors.name && <span className="error-text">{errors.name}</span>}
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">Email Address</label>
                                                <input 
                                                    type="email" 
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    placeholder="you@example.com" 
                                                    className={`form-input ${errors.email ? 'input-error' : ''}`}
                                                    disabled={isSubmitting}
                                                />
                                                {errors.email && <span className="error-text">{errors.email}</span>}
                                            </div>
                                        </div>

                                        {/* Subject */}
                                        <div className="form-group">
                                            <label className="form-label">Subject</label>
                                            <input 
                                                type="text" 
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                placeholder="What is your message about?" 
                                                className={`form-input ${errors.subject ? 'input-error' : ''}`}
                                                disabled={isSubmitting}
                                            />
                                            {errors.subject && <span className="error-text">{errors.subject}</span>}
                                        </div>

                                        {/* Message */}
                                        <div className="form-group">
                                            <label className="form-label">Message</label>
                                            <textarea 
                                                name="message"
                                                rows="5"
                                                value={formData.message}
                                                onChange={handleChange}
                                                placeholder="Write your request details here..." 
                                                className={`form-input form-textarea ${errors.message ? 'input-error' : ''}`}
                                                disabled={isSubmitting}
                                            ></textarea>
                                            {errors.message && <span className="error-text">{errors.message}</span>}
                                        </div>

                                        <button type="submit" className="submit-btn" disabled={isSubmitting}>
                                            {isSubmitting ? (
                                                <span className="submit-loading-wrapper">
                                                    <span className="spinner"></span>
                                                    Sending message...
                                                </span>
                                            ) : (
                                                <span className="submit-text-wrapper">
                                                    Send Message
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="22" y1="2" x2="11" y2="13"></line>
                                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                                    </svg>
                                                </span>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Google Map Section */}
                    <div style={{ marginTop: '48px', width: '100%', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
                        <iframe 
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3902.6687483669145!2d8.537577311749652!3d12.00366668817684!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x11ae7b2ffaaaaaaf%3A0x6b6bbbbb2d30ba!2sFrance%20Rd%2C%20Sabon%20Gari%2C%20Kano%20700223%2C%20Kano!5e0!3m2!1sen!2sng!4v1723000000000!5m2!1sen!2sng"
                            width="100%" 
                            height="450" 
                            style={{ border: 0, display: 'block' }} 
                            allowFullScreen="" 
                            loading="lazy" 
                            referrerPolicy="no-referrer-when-downgrade"
                            title="SAINT GLOBAL SOLAR Location Map"
                        ></iframe>
                    </div>
                </div>
            </section>

            <style dangerouslySetInnerHTML={{__html: `
                .business-contact-layout {
                    background-color: #f8fafc;
                    min-height: 100vh;
                    color: #1e293b;
                    font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
                    padding-bottom: 80px;
                }

                .contact-container {
                    max-width: 1120px;
                    margin: 0 auto;
                    padding: 0 24px;
                }

                .text-center {
                    text-align: center;
                }

                /* Hero styling */
                .contact-hero {
                    padding: 80px 0 48px;
                    background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%);
                    border-bottom: 1px solid #e2e8f0;
                }
                .contact-hero .contact-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }
                .contact-badge {
                    display: inline-block;
                    background: rgba(37, 99, 235, 0.06);
                    color: #2563eb;
                    border: 1px solid rgba(37, 99, 235, 0.15);
                    padding: 6px 14px;
                    border-radius: 100px;
                    font-size: 11.5px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1.2px;
                    margin-bottom: 16px;
                }
                .hero-title {
                    font-size: 44px;
                    font-weight: 850;
                    letter-spacing: -1px;
                    margin: 0 0 16px;
                    color: #0f172a;
                }
                .hero-subtitle {
                    font-size: 17px;
                    color: #475569;
                    max-width: 620px;
                    margin: 0 auto;
                    line-height: 1.6;
                }

                /* Body Grid Section */
                .contact-body-sec {
                    padding: 60px 0;
                }
                .contact-grid {
                    display: grid;
                    grid-template-columns: 1fr 1.25fr;
                    gap: 40px;
                    align-items: start;
                }

                /* Info cards styling (white background, subtle borders, brand accent) */
                .contact-info-col {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }
                .info-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 28px;
                    box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.04);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .info-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 20px -4px rgba(15, 23, 42, 0.08);
                }

                .card-header-flex {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 16px;
                }
                .icon-wrapper {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .icon-wrapper svg {
                    width: 22px;
                    height: 22px;
                }

                .email-icon {
                    background: rgba(37, 99, 235, 0.08);
                    color: #2563eb;
                }
                .whatsapp-icon {
                    background: rgba(34, 197, 94, 0.08);
                    color: #16a34a;
                }
                .clock-icon {
                    background: rgba(79, 70, 229, 0.08);
                    color: #4f46e5;
                }

                .card-title {
                    font-size: 18px;
                    font-weight: 750;
                    margin: 0;
                    color: #0f172a;
                }
                .card-tagline {
                    font-size: 12px;
                    color: #64748b;
                    margin: 2px 0 0;
                }
                .card-desc {
                    color: #475569;
                    font-size: 14px;
                    line-height: 1.55;
                    margin: 0 0 20px;
                }

                /* Buttons inside info cards */
                .action-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                    font-size: 13.5px;
                    text-decoration: none;
                    padding: 10px 20px;
                    border-radius: 10px;
                    transition: all 0.2s;
                }

                .email-btn {
                    background: #f1f5f9;
                    color: #334155;
                    border: 1px solid #e2e8f0;
                }
                .email-btn:hover {
                    background: #e2e8f0;
                    color: #2563eb;
                    border-color: #cbd5e1;
                }
                .email-btn svg {
                    transition: transform 0.2s;
                }
                .email-btn:hover svg {
                    transform: translateX(3px);
                }

                .whatsapp-btn {
                    background: #25d366;
                    color: #ffffff;
                    border: none;
                    box-shadow: 0 2px 10px rgba(37, 211, 102, 0.15);
                }
                .whatsapp-btn:hover {
                    background: #22c55e;
                    box-shadow: 0 4px 14px rgba(37, 211, 102, 0.3);
                }
                .live-indicator {
                    display: inline-flex;
                    align-items: center;
                }
                .live-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #ffffff;
                    display: inline-block;
                    animation: pulseLive 1.4s infinite;
                }

                @keyframes pulseLive {
                    0% { transform: scale(0.95); opacity: 0.6; }
                    50% { transform: scale(1.25); opacity: 1; }
                    100% { transform: scale(0.95); opacity: 0.6; }
                }

                /* Support Hours styling */
                .hours-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    background: #f8fafc;
                    border-radius: 10px;
                    padding: 14px;
                    border: 1px solid #f1f5f9;
                }
                .hour-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 13.5px;
                }
                .hour-row .day {
                    font-weight: 600;
                    color: #334155;
                }
                .hour-row .time {
                    color: #64748b;
                }
                .hour-row.weekend .day {
                    color: #64748b;
                }
                .hour-row.weekend .time {
                    color: #94a3b8;
                }

                /* Form Container Card */
                .form-container-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 20px;
                    padding: 36px;
                    box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.04);
                }
                .form-head {
                    margin-bottom: 24px;
                }
                .form-head h3 {
                    font-size: 22px;
                    font-weight: 800;
                    color: #0f172a;
                    margin: 0 0 4px;
                }
                .form-head p {
                    color: #64748b;
                    font-size: 13.5px;
                    margin: 0;
                }

                .form-group-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }
                .form-group {
                    margin-bottom: 20px;
                    display: flex;
                    flex-direction: column;
                }
                .form-label {
                    font-size: 13px;
                    font-weight: 600;
                    color: #475569;
                    margin-bottom: 6px;
                }
                .form-input {
                    background: #ffffff;
                    border: 1.5px solid #cbd5e1;
                    border-radius: 10px;
                    padding: 12px 14px;
                    color: #0f172a;
                    font-family: inherit;
                    font-size: 14.5px;
                    transition: border-color 0.15s, box-shadow 0.15s;
                }
                .form-input::placeholder {
                    color: #94a3b8;
                }
                .form-input:focus {
                    border-color: #2563eb;
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
                    outline: none;
                }
                .form-textarea {
                    resize: vertical;
                    min-height: 110px;
                }
                .input-error {
                    border-color: #ef4444 !important;
                    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08) !important;
                }
                .error-text {
                    color: #dc2626;
                    font-size: 12px;
                    font-weight: 500;
                    margin-top: 4px;
                }

                /* Form submit button */
                .submit-btn {
                    width: 100%;
                    background: #2563eb;
                    color: #ffffff;
                    border: none;
                    border-radius: 10px;
                    padding: 14px;
                    font-size: 15px;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
                    transition: all 0.2s;
                }
                .submit-btn:hover:not(:disabled) {
                    background: #1d4ed8;
                    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
                }
                .submit-btn:disabled {
                    background: #cbd5e1;
                    color: #94a3b8;
                    box-shadow: none;
                    cursor: not-allowed;
                }
                
                .submit-text-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .submit-text-wrapper svg {
                    transition: transform 0.2s;
                }
                .submit-btn:hover:not(:disabled) .submit-text-wrapper svg {
                    transform: translate(2px, -2px);
                }

                .submit-loading-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255,255,255,0.25);
                    border-top: 2px solid #ffffff;
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* Success state styles */
                .success-state {
                    padding: 24px 0;
                    animation: fadeIn 0.4s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .success-icon-container {
                    width: 60px;
                    height: 60px;
                    margin: 0 auto 20px;
                }
                .success-icon-checkmark {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: #10b981;
                    color: #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);
                }
                .success-icon-checkmark svg {
                    width: 28px;
                    height: 28px;
                }

                .success-title {
                    font-size: 24px;
                    font-weight: 800;
                    color: #0f172a;
                    margin: 0 0 12px;
                }
                .success-message {
                    font-size: 14.5px;
                    color: #475569;
                    line-height: 1.5;
                    margin: 0 0 10px;
                }
                .success-meta {
                    font-size: 13px;
                    color: #64748b;
                    margin: 0 0 24px;
                }
                
                .reset-btn {
                    background: #f1f5f9;
                    color: #334155;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 10px 24px;
                    font-weight: 600;
                    font-size: 13.5px;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .reset-btn:hover {
                    background: #e2e8f0;
                    color: #2563eb;
                }

                /* Responsiveness */
                @media (max-width: 900px) {
                    .contact-grid {
                        grid-template-columns: 1fr;
                        gap: 32px;
                    }
                    .hero-title {
                        font-size: 36px;
                    }
                }

                @media (max-width: 600px) {
                    .contact-hero {
                        padding: 60px 0 36px;
                    }
                    .hero-title {
                        font-size: 30px;
                    }
                    .info-card {
                        padding: 20px;
                    }
                    .form-container-card {
                        padding: 24px;
                    }
                    .form-group-grid {
                        grid-template-columns: 1fr;
                        gap: 0;
                    }
                }
            `}} />
        </div>
    );
}
