# Supabase Deployment & Integration Guide for SAINT GLOBAL SOLAR

This guide outlines the exact steps to configure your new Supabase project on [supabase.com](https://supabase.com) and deploy the edge functions.

---

## 📂 Step 1: Database Setup
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Create a new project (e.g., `SAINT GLOBAL SOLAR ECOM`).
3. Navigate to **SQL Editor** on the left menu.
4. Click **New Query**, and copy/paste the entire contents of the master database script:
   👉 [supabase_master_setup.sql](file:///c:/Users/Admin/Downloads/SAINT GLOBAL SOLAR%20ECOM/supabase_master_setup.sql)
5. Click **Run**. This will build all 28 tables, triggers, helper functions, register storage buckets, apply RLS security policies, and seed default brand parameters.

---

## 🪣 Step 2: Storage Buckets Verification
The SQL script automatically registers the following storage buckets. You can verify them by going to **Storage** in the dashboard:
1. `avatars` (Public): Used for user/admin profile images.
2. `course-assets` (Public): Used for learning module downloads or design resources.
3. `payment-receipts` (Public): Used to store bank transfer proof uploads.

*Note: RLS policies have been pre-applied so that anonymous buyers can upload receipts, and only authenticated admins can manage them.*

---

## ⚡ Step 3: Deploying the Edge Function
We use Supabase Edge Functions to securely trigger transactional emails using the Resend API without exposing credentials on the client.

### 1. Install Supabase CLI Locally
If you do not have the Supabase CLI installed, run one of the following commands on your system:
* **macOS / Linux**: `brew install supabase/tap/supabase`
* **Windows (via Scoop)**: `scoop bucket add supabase https://github.com/supabase/scoop-bucket.git; scoop install supabase`
* **Windows (via NPM)**: `npm install -g supabase`

### 2. Login & Link CLI
Run the following in the project root:
```bash
supabase login
supabase link --project-ref <your-supabase-project-reference-id>
```
*(You can find your project reference ID in your Supabase dashboard URL: `https://supabase.com/dashboard/project/your-project-ref`)*

### 3. Set Edge Function Secrets
Set the secure variables on Supabase so the email system can connect to your custom domain and mail server:
```bash
supabase secrets set RESEND_API_KEY=re_your_api_key
supabase secrets set ADMIN_EMAIL=admin@saintglobalsolar.com
supabase secrets set FROM_EMAIL="SAINT GLOBAL SOLAR <orders@saintglobalsolar.com>"
supabase secrets set STORE_URL=https://saintglobalsolar.com
```

### 4. Deploy the Function
Run the deployment command:
```bash
supabase functions deploy send-email
```

---

## 📧 Step 4: Resend Mail Server Setup (Custom Domain)
To ensure emails send from `orders@saintglobalsolar.com` instead of a generic domain, follow these steps in your [Resend](https://resend.com) account:
1. Register on [Resend.com](https://resend.com).
2. Go to **Domains** → **Add Domain** → Enter `saintglobalsolar.com`.
3. Add the generated **DKIM**, **SPF**, and **MX** DNS records in your domain registrar's panel (e.g. Namecheap, GoDaddy).
4. Verify the domain inside Resend.
5. Generate an **API Key** and set it in your Supabase secrets (from **Step 3.3** above).

---

## 💻 Step 5: Update Your Web App Environment Configuration
Once the Supabase database and functions are live, update your React e-commerce application variables:
1. Open the local [.env](file:///c:/Users/Admin/Downloads/SAINT GLOBAL SOLAR%20ECOM/.env) file.
2. Replace the variables with your new Supabase endpoints:
   ```env
   VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-new-public-anon-key>
   ```
3. Run `npm run build` or `npm run dev` to verify the application successfully connects to the new database.
