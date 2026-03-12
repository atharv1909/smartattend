# SmartAttend

A smart QR-based attendance tracking system built with Next.js 14 and Supabase.

## Features

- **Teacher Flow**: Create sessions, generate QR codes, track attendance in real-time
- **Student Flow**: Scan QR codes or enter session codes to mark attendance
- **Anti-Proxy**: Device fingerprinting prevents duplicate attendance
- **Live Updates**: Real-time attendance list with 4-second polling
- **Export**: Download attendance as CSV
- **Mobile-First**: Optimized for mobile devices

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **QR Codes**: qrcode.react (display), jsQR (scan)

## Database Schema

Run this SQL in your Supabase SQL Editor:

```sql
create table sessions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  subject text not null,
  teacher_id text not null,
  created_at timestamptz default now(),
  expires_at timestamptz not null
);

create table attendance (
  id uuid primary key default gen_random_uuid(),
  session_code text references sessions(code) on delete cascade,
  student_name text not null,
  roll_number text not null,
  device_id text not null,
  marked_at timestamptz default now(),
  unique(session_code, roll_number),
  unique(session_code, device_id)
);
```

## Deployment Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Open the SQL Editor
3. Run the database schema above
4. Go to Settings → API
5. Copy the `Project URL` and `anon public` API key

### 2. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/smartattend.git
git push -u origin main
```

### 3. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and import your GitHub repository
2. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
3. Click Deploy

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Local Development

```bash
# Install dependencies
npm install

# Add environment variables to .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=your-url" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key" >> .env.local

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

### Device Fingerprinting

On first page load, a UUID is generated and stored in localStorage as `smartattend_device_id`. This device ID is sent with every attendance submission. The database has unique constraints on:
- `(session_code, roll_number)` - one roll number per session
- `(session_code, device_id)` - one device per session

This prevents students from marking attendance multiple times, even if they change their name or roll number.

### Session Flow

1. **Teacher** creates a session → 6-character code generated → expires in 1 hour
2. **Students** scan QR or enter code → submit with name and roll number
3. **Teacher** sees live attendance list → can export CSV or end session early

## API Routes

- `POST /api/sessions` - Create new session
- `GET /api/sessions?teacher_id=xxx` - Get teacher's past sessions
- `POST /api/sessions/end` - End session early
- `GET /api/attendance?code=XXX` - Get attendance list
- `POST /api/mark` - Mark attendance
- `GET /api/export?code=XXX` - Download CSV

## License

MIT
