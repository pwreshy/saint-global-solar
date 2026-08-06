import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { compressImage } from '../lib/imageCompressor'

export default function AdminLandingPages() {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingPage, setEditingPage] = useState(null) // null means list view
  const [isEditing, setIsEditing] = useState(false) // true = editing existing, false = creating new

  // Form states
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [productCount, setProductCount] = useState(3)
  const [formProducts, setFormProducts] = useState([]) // array of { id_number, image_url, price, colors }
  const [headline, setHeadline] = useState('')
  const [subheadline, setSubheadline] = useState('')
  const [highlights, setHighlights] = useState(['', '', ''])
  const [showDisclaimer, setShowDisclaimer] = useState(true)
  const [disclaimerText, setDisclaimerText] = useState('')
  const [urgencyText, setUrgencyText] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploadingIndex, setUploadingIndex] = useState(null)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth < 768

  const loadPages = async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await supabase
        .from('landing_pages')
        .select('*')
        .order('created_at', { ascending: false })
      if (err) throw err
      if (data) setPages(data)
    } catch (err) {
      console.error(err)
      setError('Failed to fetch landing pages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPages()
  }, [])

  // Monitor product count changes to resize the products array
  useEffect(() => {
    const count = parseInt(productCount) || 0
    if (count <= 0) {
      setFormProducts([])
      return
    }
    setFormProducts(prev => {
      const result = [...prev]
      if (result.length < count) {
        // Expand array with blank objects
        const diff = count - result.length
        for (let i = 0; i < diff; i++) {
          const nextIndex = result.length
          result.push({ 
            id_number: `SGS-${101 + nextIndex}`, 
            image_url: '', 
            price: '', 
            colors: '', 
            available_sizes: ['40', '41', '42', '43', '44', '45', '46'] 
          })
        }
      } else if (result.length > count) {
        // Truncate array
        return result.slice(0, count)
      }
      return result
    })
  }, [productCount])

  const handleNameChange = (val) => {
    setTitle(val)
    if (!isEditing) {
      const generatedSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setSlug(generatedSlug)
    }
  }

  const handleOpenAdd = () => {
    setTitle('')
    setSlug('')
    setProductCount(3)
    setFormProducts([
      { id_number: 'SGS-101', image_url: '', price: '', colors: 'blue, red, brown', available_sizes: ['40', '41', '42', '43', '44', '45', '46'] },
      { id_number: 'SGS-102', image_url: '', price: '', colors: 'black, white', available_sizes: ['40', '41', '42', '43', '44', '45', '46'] },
      { id_number: 'SGS-103', image_url: '', price: '', colors: 'brown, tan', available_sizes: ['40', '41', '42', '43', '44', '45', '46'] }
    ])
    setHeadline('Handcrafted Luxury For The Modern Gentleman')
    setSubheadline('Experience unmatched comfort and style with our premium bespoke collection, tailored to perfection.')
    setHighlights([
      'Bespoke craftsmanship with 100% genuine calfskin leather',
      'Ergonomic inner lining designed for all-day comfort',
      'Durable Italian outsoles crafted for stability and longevity'
    ])
    setShowDisclaimer(true)
    setDisclaimerText('Please only submit an order if you have the cash fully ready and will be available to receive the delivery in 2 to 5 days. Every delivery attempt costs our business money for logistics and verification. Time-wasters, window shoppers, and unserious orders are strictly prohibited.')
    setUrgencyText('High Demand - Limited Quantities Left')
    setIsEditing(false)
    setEditingPage(true)
  }

  const handleOpenEdit = (p) => {
    setTitle(p.title || '')
    setSlug(p.slug || '')
    setProductCount(p.products ? p.products.length : 0)
    setFormProducts(p.products || [])
    setHeadline(p.headline || '')
    setSubheadline(p.subheadline || '')
    setHighlights(p.highlights || ['', '', ''])
    setShowDisclaimer(p.show_disclaimer !== false)
    setDisclaimerText(p.disclaimer_text || 'Please only submit an order if you have the cash fully ready and will be available to receive the delivery in 2 to 5 days. Every delivery attempt costs our business money for logistics and verification. Time-wasters, window shoppers, and unserious orders are strictly prohibited.')
    setUrgencyText(p.urgency_text || 'High Demand - Limited Quantities Left')
    setIsEditing(true)
    setEditingPage(p) // Hold the object reference to update
  }

  const handleDuplicate = async (p) => {
    if (!window.confirm(`Duplicate landing page "${p.title}"?`)) return
    try {
      const randomSuffix = Math.random().toString(36).substring(2, 6)
      const newPayload = {
        title: `${p.title} (Copy)`,
        slug: `${p.slug}-copy-${randomSuffix}`,
        products: p.products || [],
        headline: p.headline || null,
        subheadline: p.subheadline || null,
        highlights: p.highlights || null,
        show_disclaimer: p.show_disclaimer !== false,
        disclaimer_text: p.disclaimer_text || null,
        urgency_text: p.urgency_text || null
      }
      const { error: insErr } = await supabase
        .from('landing_pages')
        .insert(newPayload)
      if (insErr) throw insErr
      await loadPages()
      setSuccess('Landing page duplicated successfully!')
    } catch (err) {
      console.error(err)
      alert('Failed to duplicate: ' + err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this landing page? This action cannot be undone.')) return
    try {
      const { error: delErr } = await supabase
        .from('landing_pages')
        .delete()
        .eq('id', id)
      if (delErr) throw delErr
      await loadPages()
      setSuccess('Landing page deleted!')
    } catch (err) {
      console.error(err)
      alert('Failed to delete: ' + err.message)
    }
  }

  const handleFileUpload = async (index, file) => {
    if (!file) return
    setUploadingIndex(index)
    try {
      const compressedFile = await compressImage(file)
      const fileExt = compressedFile.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 10)}.${fileExt}`
      const filePath = `landing/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('landing_pages')
        .upload(filePath, compressedFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('landing_pages')
        .getPublicUrl(filePath)

      const updated = [...formProducts]
      updated[index] = {
        ...updated[index],
        image_url: publicUrl
      }
      setFormProducts(updated)
    } catch (err) {
      console.error(err)
      alert('Upload failed: ' + err.message)
    } finally {
      setUploadingIndex(null)
    }
  }

  const handleProductFieldChange = (index, field, value) => {
    const updated = [...formProducts]
    updated[index] = {
      ...updated[index],
      [field]: value
    }
    setFormProducts(updated)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !slug.trim()) return

    setSubmitting(true)
    setError('')
    setSuccess('')

    const payload = {
      title: title.trim(),
      slug: slug.trim().toLowerCase().replace(/\s+/g, '-'),
      products: formProducts,
      headline: headline.trim() || null,
      subheadline: subheadline.trim() || null,
      highlights: highlights.map(h => h.trim()).filter(Boolean),
      show_disclaimer: showDisclaimer,
      disclaimer_text: disclaimerText.trim() || null,
      urgency_text: urgencyText.trim() || null
    }

    try {
      if (isEditing && editingPage?.id) {
        const { error: updErr } = await supabase
          .from('landing_pages')
          .update(payload)
          .eq('id', editingPage.id)
        if (updErr) throw updErr
        setSuccess('Landing page updated successfully!')
      } else {
        const { error: insErr } = await supabase
          .from('landing_pages')
          .insert(payload)
        if (insErr) throw insErr
        setSuccess('Landing page created successfully!')
      }

      setEditingPage(null)
      await loadPages()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to save landing page')
    } finally {
      setSubmitting(false)
    }
  }

  // Styles
  const cardStyle = {
    background: '#ffffff',
    border: '1px solid #e3e8ee',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
    marginBottom: '24px',
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '16px',
    fontFamily: 'inherit'
  }

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  }

  return (
    <div style={{ fontFamily: 'var(--font, sans-serif)', color: '#0f0d0a' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1a1f36', margin: 0 }}>Custom Landing Pages</h2>
          <p style={{ color: '#697386', marginTop: 4, fontSize: 14 }}>Create and duplicate fast-loading product templates linked to email orders.</p>
        </div>
        {!editingPage && (
          <button
            onClick={handleOpenAdd}
            style={{ background: 'var(--g600, #0f0d0a)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span style={{ fontSize: 18 }}>+</span> Create Landing Page
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 8, color: '#991b1b', fontSize: 14, marginBottom: 16 }}>
          Error: {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, color: '#166534', fontSize: 14, marginBottom: 16 }}>
          Success: {success}
        </div>
      )}

      {/* LIST VIEW */}
      {!editingPage && (
        <div style={cardStyle}>
          {loading ? (
            <div style={{ color: '#64748b', fontSize: 14, padding: '20px 0' }}>Loading landing pages...</div>
          ) : pages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>No landing pages built yet.</p>
              <button onClick={handleOpenAdd} style={{ marginTop: 12, background: 'none', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 16px', color: '#0f0d0a', fontWeight: 600, cursor: 'pointer' }}>Create your first page</button>
            </div>
          ) : isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pages.map(page => (
                <div key={page.id} style={{ border: '1px solid #f1f5f9', borderRadius: '12px', padding: '16px', background: '#fafbfc' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f0d0a', marginBottom: '4px' }}>
                    {page.title}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <a href={`/l/${page.slug}`} target="_blank" rel="noreferrer" style={{ color: 'var(--gold)', fontWeight: 600, textDecoration: 'none', fontSize: '13px' }}>
                      /l/{page.slug}
                    </a>
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                    {page.products ? page.products.length : 0} items
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => handleOpenEdit(page)} style={{ flex: 1, minWidth: '60px', background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '8px', fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => handleDuplicate(page)} style={{ flex: 1, minWidth: '80px', background: '#fef3c7', border: 'none', borderRadius: 6, padding: '8px', fontSize: 13, fontWeight: 600, color: '#b45309', cursor: 'pointer' }}>Duplicate</button>
                    <button onClick={() => handleDelete(page.id)} style={{ flex: 1, minWidth: '70px', background: '#fee2e2', border: 'none', borderRadius: 6, padding: '8px', fontSize: 13, fontWeight: 600, color: '#991b1b', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    <th style={{ padding: '12px 16px', fontSize: 13, color: '#475569', fontWeight: 600 }}>Page Title</th>
                    <th style={{ padding: '12px 16px', fontSize: 13, color: '#475569', fontWeight: 600 }}>URL Path</th>
                    <th style={{ padding: '12px 16px', fontSize: 13, color: '#475569', fontWeight: 600 }}>Product Grid</th>
                    <th style={{ padding: '12px 16px', fontSize: 13, color: '#475569', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map(page => (
                    <tr key={page.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px', fontWeight: 600, color: '#0f0d0a' }}>{page.title}</td>
                      <td style={{ padding: '16px' }}>
                        <a href={`/l/${page.slug}`} target="_blank" rel="noreferrer" style={{ color: 'var(--gold)', fontWeight: 600, textDecoration: 'none' }}>
                          /l/{page.slug}
                        </a>
                      </td>
                      <td style={{ padding: '16px', fontSize: 13, color: '#64748b' }}>
                        {page.products ? page.products.length : 0} items (3-cols grid)
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button onClick={() => handleOpenEdit(page)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>Edit</button>
                          <button onClick={() => handleDuplicate(page)} style={{ background: '#fef3c7', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 13, fontWeight: 600, color: '#b45309', cursor: 'pointer' }}>Duplicate</button>
                          <button onClick={() => handleDelete(page.id)} style={{ background: '#fee2e2', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 13, fontWeight: 600, color: '#991b1b', cursor: 'pointer' }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT VIEW */}
      {editingPage && (
        <form onSubmit={handleSubmit} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: 16, marginBottom: 24 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
              {isEditing ? `Edit Landing Page: ${title}` : 'Create New Landing Page'}
            </h3>
            <button
              type="button"
              onClick={() => setEditingPage(null)}
              style={{ background: 'none', border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              Cancel
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Landing Page Title</label>
              <input
                type="text"
                value={title}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. Premium Italian Leather Mules"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Page URL Slug</label>
              <input
                type="text"
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="e.g. premium-mules"
                style={inputStyle}
                required
              />
            </div>
          </div>

          {/* Sales Copy Customization */}
          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: '#0f0d0a', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              Sales Copy Customization
            </h4>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Headline</label>
              <input
                type="text"
                value={headline}
                onChange={e => setHeadline(e.target.value)}
                placeholder="e.g. Handcrafted Luxury For The Modern Gentleman"
                style={{ ...inputStyle, marginBottom: 0 }}
                required
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Subheadline / Description</label>
              <textarea
                value={subheadline}
                onChange={e => setSubheadline(e.target.value)}
                placeholder="Write a brief, high-converting paragraph explaining why customers should buy..."
                style={{ ...inputStyle, height: '80px', resize: 'vertical', marginBottom: 0 }}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Selling Points / Highlights (Up to 3)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {highlights.map((hl, hlIdx) => (
                  <input
                    key={hlIdx}
                    type="text"
                    value={hl}
                    onChange={e => {
                      const updated = [...highlights]
                      updated[hlIdx] = e.target.value
                      setHighlights(updated)
                    }}
                    placeholder={`Highlight #${hlIdx + 1} (e.g. Bespoke craftsmanship with calfskin leather)`}
                    style={{ ...inputStyle, marginBottom: 0 }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Disclaimer & Urgency Settings */}
          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: '#0f0d0a', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              Disclaimer & Urgency Card
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: showDisclaimer ? '16px' : 0 }}>
              <input
                type="checkbox"
                id="showDisclaimer"
                checked={showDisclaimer}
                onChange={e => setShowDisclaimer(e.target.checked)}
                style={{ cursor: 'pointer', margin: 0 }}
              />
              <label htmlFor="showDisclaimer" style={{ fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
                SHOW SERIOUS BUYER DISCLAIMER & URGENCY CARD ON LANDING PAGE
              </label>
            </div>
            {showDisclaimer && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Disclaimer Warning Text</label>
                  <textarea
                    value={disclaimerText}
                    onChange={e => setDisclaimerText(e.target.value)}
                    placeholder="Enter the disclaimer warning text..."
                    style={{ ...inputStyle, height: '80px', resize: 'vertical', marginBottom: 0 }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Urgency Warning Text</label>
                  <input
                    type="text"
                    value={urgencyText}
                    onChange={e => setUrgencyText(e.target.value)}
                    placeholder="e.g. High Demand - Limited Quantities Left"
                    style={{ ...inputStyle, marginBottom: 0 }}
                  />
                </div>
              </>
            )}
          </div>

          <div style={{ marginBottom: 30, maxWidth: 300 }}>
            <label style={labelStyle}>Number of Images (Auto-calculates 3-Column Grid)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={productCount}
              onChange={e => setProductCount(Math.max(1, parseInt(e.target.value) || 1))}
              style={inputStyle}
              required
            />
          </div>

          <h4 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
            Grid Images Settings ({formProducts.length} Items total)
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: 30 }}>
            {formProducts.map((prod, idx) => (
              <div
                key={idx}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: 10,
                  padding: 16,
                  background: '#f8fafc',
                  position: 'relative'
                }}
              >
                <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                  {idx + 1}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ ...labelStyle, fontSize: 11 }}>Image Upload</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleFileUpload(idx, e.target.files[0])}
                    style={{ fontSize: 12, marginBottom: 8 }}
                  />
                  {prod.image_url ? (
                    <div style={{ width: 80, height: 80, borderRadius: 6, border: '1px solid #e2e8f0', overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={prod.image_url} alt={`product ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                      {uploadingIndex === idx ? 'Uploading image...' : 'No image uploaded yet'}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ ...labelStyle, fontSize: 11 }}>Product ID Number</label>
                  <input
                    type="text"
                    value={prod.id_number}
                    onChange={e => handleProductFieldChange(idx, 'id_number', e.target.value)}
                    placeholder="e.g. SGS-101"
                    style={{ ...inputStyle, padding: '8px 10px', fontSize: 12, marginBottom: 12 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ ...labelStyle, fontSize: 11 }}>Price (₦)</label>
                  <input
                    type="number"
                    value={prod.price}
                    onChange={e => handleProductFieldChange(idx, 'price', e.target.value)}
                    placeholder="e.g. 45000"
                    style={{ ...inputStyle, padding: '8px 10px', fontSize: 12, marginBottom: 12 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ ...labelStyle, fontSize: 11 }}>Colors (Comma Separated)</label>
                  <input
                    type="text"
                    value={prod.colors}
                    onChange={e => handleProductFieldChange(idx, 'colors', e.target.value)}
                    placeholder="e.g. blue, red, brown"
                    style={{ ...inputStyle, padding: '8px 10px', fontSize: 12, marginBottom: 12 }}
                  />
                </div>

                <div>
                  <label style={{ ...labelStyle, fontSize: 11 }}>Available Sizes (40-46)</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {['40', '41', '42', '43', '44', '45', '46'].map(sz => {
                      const isChecked = (prod.available_sizes || ['40', '41', '42', '43', '44', '45', '46']).includes(sz)
                      return (
                        <label key={sz} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', cursor: 'pointer', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px 6px' }}>
                          <input 
                            type="checkbox" 
                            checked={isChecked} 
                            onChange={() => {
                              const currentSizes = prod.available_sizes || ['40', '41', '42', '43', '44', '45', '46']
                              const updatedSizes = currentSizes.includes(sz)
                                ? currentSizes.filter(s => s !== sz)
                                : [...currentSizes, sz].sort()
                              handleProductFieldChange(idx, 'available_sizes', updatedSizes)
                            }}
                            style={{ margin: 0 }}
                          />
                          <span>{sz}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setEditingPage(null)}
              style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 600, color: '#475569', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ background: 'var(--g600, #0f0d0a)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 32px', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? 'Saving...' : 'Save Landing Page'}
            </button>
          </div>
        </form>
      )}

    </div>
  )
}
