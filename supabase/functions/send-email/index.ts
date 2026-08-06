// SAINT GLOBAL SOLAR E-Commerce Email System — Supabase Edge Function
// Handles all transactional emails via Resend API
//
// Deploy: supabase functions deploy send-email
// Secrets: supabase secrets set RESEND_API_KEY=re_xxxxx
//
// Email types handled:
//   order_confirmed    — Paystack payment success
//   bank_transfer      — Bank transfer order placed (pending review)
//   payment_verified   — Bank transfer approved by admin
//   order_shipped      — Admin marks order as shipped
//   order_delivered    — Admin marks order as delivered
//   welcome            — New user account created
//   admin_new_order    — Internal alert to admin on new order

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || ""
const ADMIN_EMAIL    = Deno.env.get("ADMIN_EMAIL") || "info@saintglobalsolar.com"
const FROM_EMAIL     = Deno.env.get("FROM_EMAIL") || "SAINT GLOBAL SOLAR <orders@saintglobalsolar.com>"
const STORE_URL      = Deno.env.get("STORE_URL") || "https://saintglobalsolar.com"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// ─── BRAND CONSTANTS ──────────────────────────────────────────────────────────
const BRAND = {
  primary:   "#0b0f19",
  secondary: "#1a202c",
  accent:    "#f97316",
  gold:      "#ea580c",
  light:     "#fff7ed",
  white:     "#ffffff",
  grey:      "#f8fafc",
  textDark:  "#0f172a",
  textMid:   "#475569",
  textLight: "#94a3b8",
}

// ─── EMAIL BASE TEMPLATE ──────────────────────────────────────────────────────
function baseTemplate(content: string, previewText = "") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>SAINT GLOBAL SOLAR</title>
  <!--[if mso]><style>* { font-family: Arial, sans-serif !important; }</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#fffcf8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;color:${BRAND.textDark};">
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#fffcf8;">${previewText}</div>` : ""}
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fffcf8;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px 60px;">

        <!-- Email Card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);border:1px solid #fed7aa;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.primary} 0%,${BRAND.secondary} 100%);padding:36px 40px 32px;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="${STORE_URL}" target="_blank" style="text-decoration:none;">
                      <img src="https://saintglobalsolar.com/logo.svg" alt="SAINT GLOBAL SOLAR" width="180" style="max-width:220px;height:auto;display:block;margin:0 auto 12px;border:0;filter:brightness(0) invert(1);-webkit-filter:brightness(0) invert(1);" />
                    </a>
                    <p style="color:rgba(255,255,255,0.75);margin:0;font-size:12.5px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;">Premium Solar Solutions & Installations</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CONTENT -->
          ${content}

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #fed7aa;padding:32px 40px;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <p style="color:${BRAND.textMid};font-size:13px;margin:0 0 8px;line-height:1.6;">
                      Questions? Reply to this email or contact us at
                      <a href="mailto:${ADMIN_EMAIL}" style="color:${BRAND.gold};text-decoration:none;font-weight:600;">${ADMIN_EMAIL}</a>
                    </p>
                    <p style="color:${BRAND.textLight};font-size:11px;margin:0 0 16px;">
                      SAINT GLOBAL SOLAR · Kano, Nigeria<br/>
                      <a href="${STORE_URL}" style="color:${BRAND.textLight};text-decoration:none;">${STORE_URL}</a>
                    </p>
                    <div style="border-top:1px solid #e2e8f0;padding-top:16px;">
                      <p style="color:#cbd5e1;font-size:10px;margin:0;letter-spacing:0.5px;">
                        © ${new Date().getFullYear()} SAINT GLOBAL SOLAR. All rights reserved.<br/>
                        You received this email because of a transaction or account on our platform.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── PRODUCT IMAGE BLOCK ──────────────────────────────────────────────────────
function productBlock(d: Record<string, string>) {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border:1px solid #e3d5c1;border-radius:12px;overflow:hidden;background:#faf8f5;">
    <tr>
      ${d.product_image ? `<td style="width:80px;padding:16px 0 16px 16px;vertical-align:middle;">
        <img src="${d.product_image}" alt="${d.product_title || "Product"}" width="64" height="64" style="border-radius:10px;object-fit:cover;display:block;border:1px solid #c5a880;"/>
      </td>` : ""}
      <td style="padding:16px 20px;vertical-align:middle;">
        <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:${BRAND.textDark};">${d.product_title || "Solar Product"}</p>
        <p style="margin:0;font-size:12px;color:${BRAND.textMid};text-transform:capitalize;">Type: ${d.product_type || "Physical Product"}</p>
      </td>
      <td style="padding:16px 20px;text-align:right;vertical-align:middle;white-space:nowrap;">
        <p style="margin:0 0 2px;font-size:16px;font-weight:800;color:${BRAND.primary};">₦${Number(d.amount || 0).toLocaleString()}</p>
        <p style="margin:0;font-size:11px;color:${BRAND.textLight};">Qty: 1</p>
      </td>
    </tr>
  </table>`
}

// ─── ORDER META TABLE ─────────────────────────────────────────────────────────
function orderMeta(d: Record<string, string>) {
  const rows = [
    ["Order Reference", d.ref ? `#${String(d.ref).slice(-8).toUpperCase()}` : "—"],
    d.shipping_street ? ["Shipping To", `${d.shipping_street}, ${d.shipping_city || ""}, ${d.shipping_state || ""}`] : null,
    ["Payment Method", d.payment_method === "bank_transfer" ? "Direct Bank Transfer" : (d.payment_method === "cash_on_delivery" ? "Cash on Delivery" : "Paystack (Card / Transfer)")],
  ].filter(Boolean) as [string, string][]

  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    ${rows.map(([label, value], i) => `
    <tr style="background:${i % 2 === 0 ? "#f8fafc" : "#ffffff"};">
      <td style="padding:12px 20px;font-size:12px;font-weight:700;color:${BRAND.textLight};text-transform:uppercase;letter-spacing:0.5px;width:160px;">${label}</td>
      <td style="padding:12px 20px;font-size:13.5px;color:${BRAND.textDark};font-weight:500;">${value}</td>
    </tr>`).join("")}
  </table>`
}

// ─── CTA BUTTON ───────────────────────────────────────────────────────────────
function ctaButton(text: string, url: string, secondary = false) {
  return `
  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
    <tr>
      <td style="border-radius:10px;overflow:hidden;">
        <a href="${url}" style="display:inline-block;padding:16px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;background:${secondary ? BRAND.secondary : BRAND.primary};letter-spacing:0.3px;">${text}</a>
      </td>
    </tr>
  </table>`
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function statusBadge(text: string, color: string, bg: string) {
  return `<span style="display:inline-block;padding:6px 16px;border-radius:100px;background:${bg};color:${color};font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">${text}</span>`
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL TEMPLATE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// 1. ORDER CONFIRMED (Paystack payment)
function emailOrderConfirmed(d: Record<string, string>) {
  const content = `
  <tr>
    <td style="padding:40px 40px 0;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="display:inline-flex;width:64px;height:64px;border-radius:50%;background:${BRAND.light};margin-bottom:16px;align-items:center;justify-content:center;">
          <span style="font-size:32px;">✅</span>
        </div>
        <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:${BRAND.primary};">Order Confirmed!</h1>
        <p style="margin:0;font-size:15px;color:${BRAND.textMid};">Thank you for your purchase, ${d.name?.split(" ")[0] || "Valued Customer"}. We're preparing your order.</p>
      </div>

      ${productBlock(d)}

      <div style="background:${BRAND.light};border-radius:12px;padding:20px 24px;margin-bottom:24px;border-left:4px solid ${BRAND.accent};">
        <p style="margin:0;font-size:14px;color:${BRAND.secondary};font-weight:600;">📦 What happens next?</p>
        <p style="margin:8px 0 0;font-size:13.5px;color:${BRAND.textMid};line-height:1.6;">
          Your order is confirmed and being prepared for dispatch. You'll receive a shipping notification with tracking details shortly.
          Delivery typically takes 3–7 business days within Nigeria.
        </p>
      </div>

      ${orderMeta(d)}

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
        <tr>
          <td style="border:1px solid #d1fae5;border-radius:12px;padding:20px 24px;background:#f0fdf4;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-size:14px;color:${BRAND.textMid};">Subtotal</td>
                <td align="right" style="font-size:14px;font-weight:600;color:${BRAND.textDark};">₦${Number(d.amount || 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td style="font-size:14px;color:${BRAND.textMid};padding-top:8px;">Shipping</td>
                <td align="right" style="font-size:14px;font-weight:600;color:${BRAND.accent};padding-top:8px;">Free</td>
              </tr>
              <tr>
                <td colspan="2" style="padding:12px 0 0;border-top:1px dashed #bbf7d0;"></td>
              </tr>
              <tr>
                <td style="font-size:16px;font-weight:800;color:${BRAND.primary};">Total Paid</td>
                <td align="right" style="font-size:18px;font-weight:900;color:${BRAND.primary};">₦${Number(d.amount || 0).toLocaleString()}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <div style="text-align:center;margin-bottom:40px;">
        ${ctaButton("View My Orders →", `${STORE_URL}/dashboard`)}
        <p style="margin:16px 0 0;font-size:12px;color:${BRAND.textLight};">Track your order, download invoices, and more from your dashboard.</p>
      </div>
    </td>
  </tr>`
  return baseTemplate(content, `Order confirmed! Your SAINT GLOBAL SOLAR order is being prepared.`)
}

// 2. BANK TRANSFER PENDING
function emailBankTransfer(d: Record<string, string>) {
  const content = `
  <tr>
    <td style="padding:40px 40px 0;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="display:inline-flex;width:64px;height:64px;border-radius:50%;background:#fffbeb;margin-bottom:16px;align-items:center;justify-content:center;">
          <span style="font-size:32px;">⏳</span>
        </div>
        <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:${BRAND.primary};">Order Received!</h1>
        ${statusBadge("Pending Payment Review", BRAND.gold, "#fffbeb")}
        <p style="margin:16px 0 0;font-size:15px;color:${BRAND.textMid};">Hi ${d.name?.split(" ")[0] || "there"}, we have your order. Please complete your bank transfer to process it.</p>
      </div>

      ${productBlock(d)}

      <div style="background:#fffbeb;border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #fde68a;">
        <p style="margin:0 0 16px;font-size:14px;font-weight:800;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;">🏦 Bank Transfer Details</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-size:13px;color:#78350f;padding-bottom:8px;width:140px;">Bank</td>
            <td style="font-size:13.5px;color:#1c1917;font-weight:700;padding-bottom:8px;">${d.bank_name || "Access Bank"}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#78350f;padding-bottom:8px;">Account Number</td>
            <td style="font-size:13.5px;color:#1c1917;font-weight:700;padding-bottom:8px;">${d.account_number || "0123456789"}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#78350f;padding-bottom:8px;">Account Name</td>
            <td style="font-size:13.5px;color:#1c1917;font-weight:700;padding-bottom:8px;">${d.account_name || "SAINT GLOBAL SOLAR"}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#78350f;">Amount to Transfer</td>
            <td style="font-size:16px;color:#b45309;font-weight:900;">₦${Number(d.amount || 0).toLocaleString()}</td>
          </tr>
        </table>
        <div style="margin-top:16px;padding-top:16px;border-top:1px dashed #fcd34d;">
          <p style="margin:0;font-size:12px;color:#92400e;line-height:1.6;">
            ⚠️ After transferring, please upload your payment receipt on our website or reply to this email with the receipt attached.
            Orders are processed within <strong>24 hours</strong> of payment confirmation.
          </p>
        </div>
      </div>

      ${orderMeta(d)}

      <div style="text-align:center;margin-bottom:40px;">
        ${ctaButton("Upload Payment Receipt →", `${STORE_URL}/dashboard`)}
      </div>
    </td>
  </tr>`
  return baseTemplate(content, `Your SAINT GLOBAL SOLAR order is awaiting payment confirmation.`)
}

// 3. PAYMENT VERIFIED (bank transfer approved)
function emailPaymentVerified(d: Record<string, string>) {
  const content = `
  <tr>
    <td style="padding:40px 40px 0;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="display:inline-flex;width:64px;height:64px;border-radius:50%;background:${BRAND.light};margin-bottom:16px;align-items:center;justify-content:center;">
          <span style="font-size:32px;">🎉</span>
        </div>
        <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:${BRAND.primary};">Payment Confirmed!</h1>
        ${statusBadge("Payment Verified", "#166534", "#dcfce7")}
        <p style="margin:16px 0 0;font-size:15px;color:${BRAND.textMid};">
          Great news, ${d.name?.split(" ")[0] || "there"}! We've received and confirmed your bank transfer. Your order is now being processed.
        </p>
      </div>

      ${productBlock(d)}

      <div style="background:${BRAND.light};border-radius:12px;padding:20px 24px;margin-bottom:24px;border-left:4px solid ${BRAND.accent};">
        <p style="margin:0;font-size:14px;color:${BRAND.secondary};font-weight:600;">📦 Your order is being packed</p>
        <p style="margin:8px 0 0;font-size:13.5px;color:${BRAND.textMid};line-height:1.6;">
          We're now preparing your order for dispatch. You'll receive another email when your item ships, complete with tracking information.
          Expected delivery: <strong>3–7 business days</strong>.
        </p>
      </div>

      ${orderMeta(d)}

      <div style="text-align:center;margin-bottom:40px;">
        ${ctaButton("Track My Order →", `${STORE_URL}/dashboard`)}
      </div>
    </td>
  </tr>`
  return baseTemplate(content, `Your payment has been verified! Order is on its way.`)
}

// 4. ORDER SHIPPED
function emailOrderShipped(d: Record<string, string>) {
  const content = `
  <tr>
    <td style="padding:40px 40px 0;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="display:inline-flex;width:64px;height:64px;border-radius:50%;background:#eff6ff;margin-bottom:16px;align-items:center;justify-content:center;">
          <span style="font-size:32px;">🚚</span>
        </div>
        <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:${BRAND.primary};">Your Order is On Its Way!</h1>
        ${statusBadge("Shipped", "#1e40af", "#dbeafe")}
        <p style="margin:16px 0 0;font-size:15px;color:${BRAND.textMid};">
          Hi ${d.name?.split(" ")[0] || "there"}! Your SAINT GLOBAL SOLAR order has been handed over to our delivery partner.
        </p>
      </div>

      ${productBlock(d)}

      ${d.tracking_number ? `
      <div style="background:#eff6ff;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;border:1px solid #bfdbfe;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:1px;">Tracking Number</p>
        <p style="margin:0;font-size:24px;font-weight:900;color:#1e3a8a;letter-spacing:2px;">${d.tracking_number}</p>
        ${d.tracking_url ? `<p style="margin:12px 0 0;font-size:13px;"><a href="${d.tracking_url}" style="color:#2563eb;text-decoration:none;font-weight:600;">Track Package →</a></p>` : ""}
      </div>` : ""}

      <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:${BRAND.textMid};line-height:1.6;">
          📍 <strong>Delivering to:</strong><br/>
          ${d.shipping_street ? `${d.shipping_street}, ${d.shipping_city || ""}, ${d.shipping_state || ""}` : "Your registered address"}
        </p>
        ${d.estimated_delivery ? `<p style="margin:12px 0 0;font-size:13px;color:${BRAND.textMid};">📅 Estimated delivery: <strong>${d.estimated_delivery}</strong></p>` : ""}
      </div>

      ${orderMeta(d)}

      <div style="text-align:center;margin-bottom:40px;">
        ${ctaButton("View Order Details →", `${STORE_URL}/dashboard`)}
      </div>
    </td>
  </tr>`
  return baseTemplate(content, `Your SAINT GLOBAL SOLAR order is on its way! Track your shipment now.`)
}

// 5. ORDER DELIVERED
function emailOrderDelivered(d: Record<string, string>) {
  const content = `
  <tr>
    <td style="padding:40px 40px 0;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="display:inline-flex;width:64px;height:64px;border-radius:50%;background:${BRAND.light};margin-bottom:16px;align-items:center;justify-content:center;">
          <span style="font-size:32px;">🌿</span>
        </div>
        <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:${BRAND.primary};">Order Delivered!</h1>
        ${statusBadge("Delivered", "#166534", "#dcfce7")}
        <p style="margin:16px 0 0;font-size:15px;color:${BRAND.textMid};">
          Your order has been delivered, ${d.name?.split(" ")[0] || "there"}! We hope you're enjoying your premium SAINT GLOBAL SOLAR products.
        </p>
      </div>

      ${productBlock(d)}

      <div style="background:${BRAND.light};border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;border:1px solid #bbf7d0;">
        <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:${BRAND.primary};">⭐ Enjoying your products?</p>
        <p style="margin:0 0 20px;font-size:14px;color:${BRAND.textMid};line-height:1.6;">
          Your feedback helps us maintain our premium quality standards and helps other buyers make informed decisions. 
          Share your experience in just 60 seconds.
        </p>
        ${ctaButton("Leave a Review →", `${STORE_URL}/products`, true)}
      </div>

      <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:${BRAND.textDark};">Shop Solar Products</p>
        <p style="margin:0;font-size:13px;color:${BRAND.textMid};">Explore our full range of premium solar panels, hybrid inverters, backup batteries, and solar accessories.</p>
        <div style="margin-top:16px;">
          ${ctaButton("Browse Products →", `${STORE_URL}/products`)}
        </div>
      </div>

      <div style="text-align:center;margin-bottom:40px;">
        <p style="font-size:13px;color:${BRAND.textLight};line-height:1.6;">
          If you have any issues with your delivery, please contact us within 48 hours.<br/>
          <a href="mailto:${ADMIN_EMAIL}" style="color:${BRAND.secondary};text-decoration:none;font-weight:600;">${ADMIN_EMAIL}</a>
        </p>
      </div>
    </td>
  </tr>`
  return baseTemplate(content, `Your SAINT GLOBAL SOLAR order has been delivered! We'd love to hear from you.`)
}

// 6. WELCOME EMAIL
function emailWelcome(d: Record<string, string>) {
  const content = `
  <tr>
    <td style="padding:40px 40px 0;">
      <div style="text-align:center;margin-bottom:36px;">
        <div style="display:inline-flex;width:64px;height:64px;border-radius:50%;background:${BRAND.light};margin-bottom:16px;align-items:center;justify-content:center;">
          <span style="font-size:32px;">🌱</span>
        </div>
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:900;color:${BRAND.primary};">Welcome to SAINT GLOBAL SOLAR!</h1>
        <p style="margin:0;font-size:15px;color:${BRAND.textMid};line-height:1.6;">
          Hello ${d.name?.split(" ")[0] || "there"}, your account is ready. You now have access to premium solar energy solutions and high-efficiency backup systems.
        </p>
      </div>

      <div style="margin-bottom:32px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:16px;background:${BRAND.light};border-radius:12px;border:1px solid #bbf7d0;text-align:center;margin-bottom:12px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="48" style="vertical-align:top;padding-top:4px;font-size:24px;">🛒</td>
                  <td style="vertical-align:top;padding-left:12px;">
                    <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:${BRAND.primary};">Shop Solar Products</p>
                    <p style="margin:0;font-size:13px;color:${BRAND.textMid};">Browse our curated selection of premium solar systems, inverters, and accessories.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="height:12px;"></td></tr>
          <tr>
            <td style="padding:16px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="48" style="vertical-align:top;padding-top:4px;font-size:24px;">📦</td>
                  <td style="vertical-align:top;padding-left:12px;">
                    <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:${BRAND.primary};">Track Your Orders</p>
                    <p style="margin:0;font-size:13px;color:${BRAND.textMid};">View order history, download invoices, and track real-time delivery status from your dashboard.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>

      <div style="text-align:center;margin-bottom:40px;">
        ${ctaButton("Start Shopping →", `${STORE_URL}/products`)}
        <p style="margin:16px 0 0;font-size:12px;color:${BRAND.textLight};">
          Or <a href="${STORE_URL}/dashboard" style="color:${BRAND.secondary};text-decoration:none;font-weight:600;">visit your dashboard</a>
        </p>
      </div>

      <div style="border-top:1px dashed #d1fae5;padding-top:24px;margin-bottom:40px;">
        <p style="text-align:center;font-size:13px;color:${BRAND.textLight};">
          Your account email: <strong style="color:${BRAND.textDark};">${d.email}</strong>
        </p>
      </div>
    </td>
  </tr>`
  return baseTemplate(content, `Welcome to SAINT GLOBAL SOLAR! Your account is ready. Start exploring premium solar energy solutions and accessories.`)
}

// 7. ADMIN NEW ORDER NOTIFICATION
function emailAdminNewOrder(d: Record<string, string>) {
  const isPending = d.payment_method === "bank_transfer" || d.payment_method === "cash_on_delivery"
  const content = `
  <tr>
    <td style="padding:32px 40px 0;">
      <div style="margin-bottom:24px;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:${BRAND.primary};">
          ${d.payment_method === "bank_transfer" ? "⏳ New Bank Transfer Order" : (d.payment_method === "cash_on_delivery" ? "📦 New Cash on Delivery Order" : "💰 New Order Paid!")}
        </h1>
        ${statusBadge(isPending ? (d.payment_method === "cash_on_delivery" ? "COD Pending Dispatch" : "Pending Review") : "Payment Confirmed", isPending ? BRAND.gold : "#166534", isPending ? "#fffbeb" : "#dcfce7")}
        <p style="margin:12px 0 0;font-size:14px;color:${BRAND.textMid};">
          A new order has been placed on SAINT GLOBAL SOLAR Store. See details below.
        </p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        ${[
          ["Customer", d.name || "—"],
          ["Email", d.email || "—"],
          ["Phone", d.phone || "—"],
          ["Product", d.product_title || "—"],
          ["Amount", `₦${Number(d.amount || 0).toLocaleString()}`],
          ["Payment", d.payment_method === "bank_transfer" ? "Bank Transfer (Pending)" : (d.payment_method === "cash_on_delivery" ? "Cash on Delivery (Pending)" : "Paystack ✅")],
          ["Reference", d.ref ? `#${String(d.ref).slice(-8).toUpperCase()}` : "—"],
          d.shipping_street ? ["Shipping", `${d.shipping_street}, ${d.shipping_city}, ${d.shipping_state}`] : ["", ""],
        ].filter(([, v]) => v).map(([label, value], i) => `
        <tr style="background:${i % 2 === 0 ? "#f8fafc" : "#ffffff"};">
          <td style="padding:11px 20px;font-size:12px;font-weight:700;color:${BRAND.textLight};text-transform:uppercase;letter-spacing:0.5px;width:140px;">${label}</td>
          <td style="padding:11px 20px;font-size:13.5px;color:${BRAND.textDark};font-weight:500;">${value}</td>
        </tr>`).join("")}
      </table>

      <div style="text-align:center;margin-bottom:40px;">
        ${ctaButton("View in Admin Dashboard →", `${STORE_URL}/admin/orders`)}
        ${isPending ? '<p style="margin:12px 0 0;font-size:13px;color:' + BRAND.gold + ';font-weight:600;">⚠️ This order requires payment receipt review before processing.</p>' : ''}
      </div>
    </td>
  </tr>`
  return baseTemplate(content, `New SAINT GLOBAL SOLAR order from ${d.name}`)
}

// 8. CASH ON DELIVERY PENDING
function emailCodOrder(d: Record<string, string>) {
  const content = `
  <tr>
    <td style="padding:40px 40px 0;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="display:inline-flex;width:64px;height:64px;border-radius:50%;background:#e0f2fe;margin-bottom:16px;align-items:center;justify-content:center;">
          <span style="font-size:32px;">📦</span>
        </div>
        <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:${BRAND.primary};">Order Received!</h1>
        ${statusBadge("Cash on Delivery — Pending Dispatch", BRAND.primary, "#f0fdf4")}
        <p style="margin:16px 0 0;font-size:15px;color:${BRAND.textMid};">Hi ${d.name?.split(" ")[0] || "there"}, your Cash on Delivery order has been received and is pending dispatch. Please prepare the cash or card transfer upon delivery.</p>
      </div>

      ${productBlock(d)}

      <div style="background:#f0fdf4;border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #bbf7d0;">
        <p style="margin:0 0 8px;font-size:14px;font-weight:800;color:${BRAND.primary};text-transform:uppercase;letter-spacing:0.5px;">ℹ️ Cash on Delivery Terms</p>
        <p style="margin:0;font-size:13.5px;color:#166534;line-height:1.5;">Please inspect the package upon arrival and pay the delivery driver the total amount of <strong>₦${Number(d.amount || 0).toLocaleString()}</strong>. Standard shipping terms apply.</p>
      </div>

      ${orderMeta(d)}
    </td>
  </tr>
  `
  return baseTemplate(content, `Order Received (Cash on Delivery) — SAINT GLOBAL SOLAR Store`)
}

// 9. CONTACT MESSAGE (Admin alert)
function emailContactMessage(d: Record<string, string>) {
  const content = `
  <tr>
    <td style="padding:40px 40px 0;">
      <div style="margin-bottom:32px;">
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:900;color:${BRAND.primary};">New Inquiry Received</h1>
        <p style="margin:0;font-size:15px;color:${BRAND.textMid};">A customer has sent a message from the website contact form.</p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <tr style="background:#f8fafc;">
          <td style="padding:12px 20px;font-size:12px;font-weight:700;color:${BRAND.textLight};text-transform:uppercase;width:120px;">Name</td>
          <td style="padding:12px 20px;font-size:13.5px;color:${BRAND.textDark};font-weight:600;">${d.name || "—"}</td>
        </tr>
        <tr>
          <td style="padding:12px 20px;font-size:12px;font-weight:700;color:${BRAND.textLight};text-transform:uppercase;width:120px;">Email</td>
          <td style="padding:12px 20px;font-size:13.5px;color:${BRAND.textDark};font-weight:600;"><a href="mailto:${d.email}" style="color:${BRAND.gold};text-decoration:none;">${d.email || "—"}</a></td>
        </tr>
        <tr style="background:#f8fafc;">
          <td style="padding:12px 20px;font-size:12px;font-weight:700;color:${BRAND.textLight};text-transform:uppercase;width:120px;">Subject</td>
          <td style="padding:12px 20px;font-size:13.5px;color:${BRAND.textDark};font-weight:600;">${d.subject || "—"}</td>
        </tr>
        <tr>
          <td style="padding:12px 20px;font-size:12px;font-weight:700;color:${BRAND.textLight};text-transform:uppercase;vertical-align:top;width:120px;padding-top:16px;">Message</td>
          <td style="padding:16px 20px;font-size:13.5px;color:${BRAND.textDark};line-height:1.6;white-space:pre-wrap;">${d.message || "—"}</td>
        </tr>
      </table>
    </td>
  </tr>
  `
  return baseTemplate(content, `New Website Message: ${d.subject || "No Subject"}`)
}

// 10. CONTACT AUTO REPLY (Customer confirmation)
function emailContactAutoReply(d: Record<string, string>) {
  const content = `
  <tr>
    <td style="padding:40px 40px 0;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="display:inline-flex;width:64px;height:64px;border-radius:50%;background:${BRAND.light};margin-bottom:16px;align-items:center;justify-content:center;">
          <span style="font-size:32px;">✉️</span>
        </div>
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:900;color:${BRAND.primary};">Message Received</h1>
        <p style="margin:0;font-size:15px;color:${BRAND.textMid};">Hi ${d.name?.split(" ")[0] || "there"}, thank you for reaching out to SAINT GLOBAL SOLAR.</p>
      </div>

      <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin-bottom:24px;border:1px solid #e2e8f0;line-height:1.6;color:${BRAND.textMid};font-size:14px;">
        <p style="margin:0 0 12px;font-weight:700;color:${BRAND.textDark};">Summary of your message:</p>
        <p style="margin:0 0 8px;"><strong>Subject:</strong> ${d.subject || "No Subject"}</p>
        <p style="margin:0;font-style:italic;">"${d.message}"</p>
      </div>

      <div style="background:${BRAND.light};border-radius:12px;padding:20px 24px;margin-bottom:24px;border-left:4px solid ${BRAND.accent};">
        <p style="margin:0;font-size:13.5px;color:${BRAND.textMid};line-height:1.6;">
          Our technical engineering and customer support team has received your message and will review your request.
          We typically respond within 12–24 business hours.
        </p>
      </div>
    </td>
  </tr>
  `
  return baseTemplate(content, `We've received your message — SAINT GLOBAL SOLAR`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTE HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { type, to, data = {} } = body

    if (!type || !to) {
      return new Response(JSON.stringify({ error: "Missing required fields: type, to" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      })
    }

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      })
    }

    type EmailType = "order_confirmed" | "bank_transfer" | "payment_verified" | "order_shipped" | "order_delivered" | "welcome" | "admin_new_order" | "cod_order_placed" | "contact_message" | "contact_auto_reply"

    const emails: Record<EmailType, { subject: string; html: (d: Record<string, string>) => string }> = {
      order_confirmed:  { subject: "✅ Order Confirmed — SAINT GLOBAL SOLAR",             html: emailOrderConfirmed },
      bank_transfer:    { subject: "⏳ Order Received (Awaiting Payment) — SAINT GLOBAL SOLAR",     html: emailBankTransfer },
      payment_verified: { subject: "🎉 Payment Confirmed — Your Solar Order is Being Packed",       html: emailPaymentVerified },
      order_shipped:    { subject: "🚚 Your SAINT GLOBAL SOLAR Order Has Shipped!",                        html: emailOrderShipped },
      order_delivered:  { subject: "🌿 Delivered! How Was Your SAINT GLOBAL SOLAR Experience?",            html: emailOrderDelivered },
      welcome:          { subject: "✨ Welcome to SAINT GLOBAL SOLAR — Your Account is Ready", html: emailWelcome },
      admin_new_order:  { subject: `🔔 New Order${data.name ? ` from ${data.name}` : ""} — SAINT GLOBAL SOLAR`, html: emailAdminNewOrder },
      cod_order_placed: { subject: "📦 Order Received (Cash on Delivery) — SAINT GLOBAL SOLAR",     html: emailCodOrder },
      contact_message:  { subject: `📩 New Website Inquiry: ${data.subject || "No Subject"}`, html: emailContactMessage },
      contact_auto_reply: { subject: "✉️ Message Received — SAINT GLOBAL SOLAR", html: emailContactAutoReply },
    }

    const emailConfig = emails[type as EmailType]
    if (!emailConfig) {
      return new Response(JSON.stringify({ error: `Unknown email type: ${type}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      })
    }

    // Map "admin" to the ADMIN_EMAIL environment variable
    const recipients = to === "admin" ? [ADMIN_EMAIL] : (Array.isArray(to) ? to : [to])

    let res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: recipients,
        reply_to: ADMIN_EMAIL,
        subject: emailConfig.subject,
        html: emailConfig.html(data as Record<string, string>),
      }),
    })

    let result = await res.json()

    // ── AUTOMATIC RESEND SANDBOX FALLBACK FOR UNVERIFIED DOMAINS ────────────────
    // If the domain is unverified, Resend returns a 403 Forbidden.
    // We catch this and send it from onboarding@resend.dev to the Admin Email
    // so that the web checkout flow completes successfully and alerts the admin.
    if (res.status === 403) {
      console.warn("[send-email] Sending failed with 403 (Domain unverified). Falling back to onboarding@resend.dev to Admin Email...");
      res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: [ADMIN_EMAIL],
          reply_to: ADMIN_EMAIL,
          subject: `[Sandbox Mode] ${emailConfig.subject}`,
          html: emailConfig.html(data as Record<string, string>),
        }),
      })
      result = await res.json()
    }

    if (!res.ok) {
      console.error("[send-email] Resend error:", result)
      return new Response(JSON.stringify({ error: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: res.status,
      })
    }

    console.log(`[send-email] Sent '${type}' to ${recipients.join(", ")}`)
    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })

  } catch (err) {
    const error = err as Error
    console.error("[send-email] Exception:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})
