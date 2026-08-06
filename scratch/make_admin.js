import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manually parse .env file
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    env[key] = value.trim();
  }
});

const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your env.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const targetEmail = 'admin@saintglobalsolar.com';

async function makeAdmin() {
  console.log(`Setting admin role for: ${targetEmail}`);

  // 1. Find user in auth.users by email using Admin API
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError.message);
    process.exit(1);
  }

  const targetUser = users.find(u => u.email === targetEmail);
  if (!targetUser) {
    console.error(`User with email ${targetEmail} not found in auth.users. Please make sure they have signed up first.`);
    process.exit(1);
  }

  const userId = targetUser.id;
  console.log(`Found User ID: ${userId}`);

  // 2. Update user metadata in auth.users
  console.log('Updating auth.users app_metadata...');
  const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { role: 'admin' }
  });

  if (authError) {
    console.error('Failed to update auth.users metadata:', authError.message);
  } else {
    console.log('✅ Successfully updated auth.users app_metadata to admin.');
  }

  // 3. Update public.profiles table
  console.log('Updating public.profiles table role...');
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', userId);

  if (profileError) {
    console.error('Failed to update public.profiles table:', profileError.message);
  } else {
    console.log('✅ Successfully updated public.profiles table role to admin.');
  }
}

makeAdmin().catch(console.error);
