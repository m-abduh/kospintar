# PRD — Kospintar

## Ringkasan

SaaS manajemen kos terintegrasi WhatsApp. Satu dashboard untuk tagihan, komplain, dan laporan.

## Arsitektur

```
Next.js ──▶ Express API ──▶ PostgreSQL
                │
          Evolution API (WA QR)
                │
            Midtrans (payment)
```

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js |
| Backend | Express.js |
| Database | PostgreSQL |
| WA | Evolution API (Docker) |
| Payment | Midtrans |

## Tools & Libraries

### Backend (Express.js)

| Package | Fungsi |
|---------|--------|
| `express` | Web framework |
| `cors` | CORS header |
| `pg` | PostgreSQL driver |
| `bcryptjs` | Hash password |
| `jsonwebtoken` | JWT auth |
| `dotenv` | Environment config |
| `uuid` | Generate ID |
| `morgan` | HTTP request logger |
| `axios` | HTTP client (panggil Evolution API & Midtrans) |
| `lodash` | Utility helpers |
| `node-cron` | Jadwal auto-billing & reminder |
| `multer` | Upload file (foto/KTP) |

### Frontend (Next.js)

| Package | Fungsi |
|---------|--------|
| `next` `react` `react-dom` | Framework |
| `axios` | HTTP client ke backend |
| `zustand` | State management |
| `react-hook-form` | Form handling + validasi |
| `@tanstack/react-query` | Data fetching & cache |
| `lodash` | Utility helpers |
| `date-fns` | Format tanggal |
| `recharts` | Grafik & chart dashboard |
| `sonner` | Toast notifikasi |
| `tailwindcss` | CSS styling |
| `lucide-react` | Ikon |
| `next-auth` | Auth (opsional, bisa JWT manual) |

## Struktur

```
kospintar/
├── backend/
│   ├── src/
│   │   ├── index.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── properties.js
│   │   │   ├── tenants.js
│   │   │   ├── bills.js
│   │   │   ├── tickets.js
│   │   │   └── wa.js
│   │   ├── services/
│   │   │   ├── evolution.js
│   │   │   └── midtrans.js
│   │   └── schema.sql
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.js
│   │   │   ├── login/page.js
│   │   │   └── dashboard/
│   │   │       ├── page.js
│   │   │       ├── properties/
│   │   │       ├── tenants/
│   │   │       ├── bills/
│   │   │       ├── tickets/
│   │   │       └── wa/
│   │   ├── components/
│   │   └── lib/api.js
│   ├── .env.local
│   └── package.json
└── docker-compose.yml
```

## Database Schema

```
users         → id, email, password_hash, name, phone, role (owner/admin)
properties    → id, owner_id, name, address, total_rooms, photo_url
tenants       → id, property_id, name, phone, room_number, rent_amount, deposit, contract_start/end, status
bills         → id, tenant_id, property_id, amount, due_date, period_label, status, paid_at, midtrans_id
tickets       → id, property_id, tenant_id, title, description, status, priority, wa_message_id
wa_instances  → id, property_id, evolution_instance_name, phone_number, qr_code, connection_status
payment_logs  → id, bill_id, midtrans_transaction_id, status, raw_response
```

## API Endpoints

### Backend (Express.js)

| Method | Path | Fungsi |
|--------|------|--------|
| POST | /api/auth/register | Daftar owner |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Profil user |
| GET | /api/properties | List properti user |
| POST | /api/properties | Tambah properti |
| PUT | /api/properties/:id | Edit properti |
| DELETE | /api/properties/:id | Hapus properti |
| GET | /api/tenants | List penghuni |
| POST | /api/tenants | Tambah penghuni |
| PUT | /api/tenants/:id | Edit penghuni |
| DELETE | /api/tenants/:id | Hapus penghuni |
| GET | /api/bills | List tagihan |
| POST | /api/bills | Buat tagihan (trigger WA reminder) |
| POST | /api/bills/:id/pay | Generate link Midtrans |
| POST | /api/bills/webhook/midtrans | Webhook notifikasi bayar |
| GET | /api/tickets | List tiket komplain |
| POST | /api/tickets | Buat tiket manual |
| PUT | /api/tickets/:id | Update status tiket |
| POST | /api/wa/connect | Create instance + QR |
| GET | /api/wa/qr/:propertyId | Ambil QR code |
| GET | /api/wa/status/:propertyId | Status koneksi WA |
| POST | /api/wa/send | Kirim pesan WA |
| POST | /api/wa/webhook/:instanceName | Webhook dari Evolution API |
| POST | /api/wa/status/:propertyId | Posting ke Status WA |

## Alur

### Onboarding Owner
```
Daftar email → Login → Tambah properti → 
Input nomor HP → Klik "Hubungkan WA" → 
QR muncul di dashboard → Scan dari HP → Selesai
```

### Tagihan & Pembayaran
```
Buat tagihan otomatis (node-cron tiap bulan) → 
Kirim WA reminder H-7/H-3/H-1 → 
Penghuni klik link → Bayar via Midtrans → 
Webhook masuk → Status lunas otomatis
```

### Komplain WA → Tiket
```
Penghuni kirim WA ke nomor kos → 
Webhook Evolution API → 
Backend auto-create tiket → 
Auto-reply "keluhan diterima" → 
Owner tinggal reply dari dashboard
```

## Environment Variables

### Backend `.env`
```
PORT=3001
DATABASE_URL=postgresql://user:pass@host:5432/kospintar
JWT_SECRET=random-string
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your-key
MIDTRANS_SERVER_KEY=your-key
MIDTRANS_IS_PRODUCTION=false
SERVER_URL=https://api.kospintar.com
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your-key
```

## Fitur

1. Register/login owner
2. CRUD properti + penghuni
3. Tagihan + reminder WA otomatis
4. Komplain WA → tiket otomatis
5. Koneksi WA via QR (Evolution API)
6. Pembayaran Midtrans
7. Dashboard rekap keuangan
