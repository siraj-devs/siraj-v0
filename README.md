# siraj

## 42 0Auth API

### 1. Create 42 OAuth Application

1. Go to [42 Intranet](https://profile.intra.42.fr/)
2. Navigate to **Settings** → **API** → **Applications**
3. Click **"New application"**
4. Fill in the details:
   - **Name**: `Siraj Club`
   - **Redirect URI**: `http://localhost:3000/api/auth/callback/42` (for development)
   - **Redirect URI**: `https://siraj.club/api/auth/callback/42` (for production)
5. Click **"Create application"**
6. Copy the **Client ID** and **Client Secret**

### 2. Environment Variables

Add these to your `.env.local` file:

```env
# 42 OAuth Configuration
FT_CLIENT_ID=your_42_client_id_here
FT_CLIENT_SECRET=your_42_client_secret_here  
```

## Supabase Setup

### 1. Create a Supabase Project
1. Go to [Supabase](https://supabase.com/) and log in.
2. Click on **"New Project"**.
3. Fill in the project details:
   - **Project Name**: `siraj-club`
   - **Organization**: Select your organization.
   - **Database Password**: Set a strong password.
4. Click **"Create new project"**.
5. Wait for the project to be created.

### 2. Get Supabase Credentials
1. Once the project is ready, go to the **Settings** tab.
2. Navigate to **API**.
3. Copy the following:
    - **URL**: This is your Supabase URL.
    - **publishable key**: This is your Supabase Anon Key.
    - **secret key**: This is your Supabase Service Role Key.

### 3. Update Environment Variables

Add these to your `.env.local` file:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_SECRET_KEY=your_supabase_service_role_key
```

## Email Setup

### 1. Generate App Password for Gmail
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not enabled
3. Find **App Passwords** section
4. Select app: **Mail** and device: **Other (Custom name)**
5. Enter: `Siraj Club`
6. Click **Generate**
7. Save the 16-character code

### 2. Update .env.local
Open `.env.local` and update:
```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_char_app_password
```
