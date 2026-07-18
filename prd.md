# PRD — Kospintar

## 1. Ringkasan

Kospintar adalah platform SaaS manajemen kos terintegrasi via WhatsApp. Memberdayakan pemilik kos untuk kelola tagihan, komplain, pemasaran, dan laporan keuangan dari satu dashboard — tanpa perlu setup teknis.

## 2. Target Pengguna

- **Pemilik kos** (primary) — punya 1-10 properti, melek WA, nggak melek teknis
- **Admin kos** — bantuin operasional harian
- **Penghuni** — terima tagihan, kirim komplain, lihat status via WA

## 3. Masalah & Solusi

| # | Masalah | Solusi |
|---|---------|--------|
| 1 | Nagih bayaran manual, door-to-door, cash flow kacau | Auto-billing + WA reminder H-7/H-3/H-1 + link QRIS/VA |
| 2 | Kamar kosong lama, okupansi rendah | AI Leasing Agent — balas leads 24/7 via WA, jadwal tour |
| 3 | Komplain campur aduk di WA, kelewat, gak ada track record | Ticket management — komplain jadi tiket otomatis via WA |
| 4 | Report keuangan berantakan, uang campur pribadi | Financial dashboard — rekap pemasukan, laba-rugi per properti |
| 5 | Promosi terbatas, cuma spanduk & grup FB | Auto-posting ke WA Status tiap hari |
| 6 | Punya >1 properti, tiap tempat beda admin & catatan | Multi-Property Command Center — satu dashboard semua properti |

## 4. Arsitektur

```
┌──────────────┐     ┌──────────────┐     ┌──────────┐
│   Frontend   │────▶│  PostgreSQL  │◀────│  Midtrans│
│  (EJS/React) │     │              │     │(Payment) │
└──────┬───────┘     └──────┬───────┘     └──────────┘
       │                    │
       │            ┌───────▼───────┐
       │            │   Express.js  │
       └────────────│  Backend API  │
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │ Evolution API  │
                    │   (Docker)     │
                    │ QR Code Scan   │
                    │ Webhooks       │
                    └───────────────┘
```

## 5. Fitur

### 5.1 Manajemen Properti
- CRUD properti (nama kos, alamat, jumlah kamar, foto)
- View per properti + consolidated dashboard
- Role-based access: owner lihat semua, admin lihat properti tertentu

### 5.2 Manajemen Penghuni
- Data penghuni (nama, nomor WA, kamar, kontrak)
- Digital contract & upload KTP
- Check-in / check-out digital

### 5.3 Auto-billing & Pembayaran
- Generate tagihan otomatis tiap bulan
- WA reminder H-7, H-3, H-1 via Evolution API
- Link pembayaran QRIS/VA via Midtrans
- Auto-denda telat bayar
- Webhook otomatis update status bayar

### 5.4 Ticket Management (Komplain)
- Penghuni kirim pesan WA → webhook Evolution API → auto-create tiket
- Status: open → in progress → resolved
- Auto-assign ke teknisi/admin
- History komplain per kamar/per penghuni

### 5.5 AI Leasing Agent
- Auto-reply leads 24/7 via WA
- Qualify calon penghuni (anggaran, durasi, dll)
- Jadwalkan tour
- Kirim penawaran otomatis

### 5.6 Promosi WA Status
- Auto-posting foto + deskripsi kamar kosong ke Status WA
- Jadwal posting (tiap hari / tiap 2 hari)
- Template posting otomatis

### 5.7 Financial Dashboard
- Rekap pemasukan otomatis
- Laporan laba-rugi per properti
- Grafik cash flow
- Export laporan

### 5.8 Koneksi WhatsApp via Evolution API
- Tiap owner kos punya instance WhatsApp sendiri di Evolution API
- QR Code muncul di dashboard — scan dari HP langsung connect
- Auto-reconnect jika disconnect
- Webhook tiap pesan masuk → otomatis masuk ke sistem

## 6. Tech Stack

| Layer | Teknologi | Biaya |
|-------|-----------|-------|
| Frontend | EJS / React | Gratis |
| Backend | Express.js | Gratis |
| Database | PostgreSQL | Gratis (Neon) / VPS |
| Auth | JWT | Gratis |
| WA API | Evolution API (Docker) | Gratis (open source) |
| QR Code | Evolution API `/instance/connect` | Native REST API |
| Payment | Midtrans | Fee per transaksi 1-2% |
| Hosting | VPS (Railway/DO) | ~Rp150k/bln |

## 7. Alur Koneksi WhatsApp (QR Evolution API)

1. Owner daftar → login dashboard
2. Klik "Hubungkan WhatsApp"
3. Backend panggil Evolution API `POST /instance/create` → instance baru terbuat
4. Backend panggil `GET /instance/connect/{name}` → QR code muncul di dashboard
5. Owner scan QR dari HP WhatsApp
6. Webhook Evolution `connection.update` → status "open" → dashboard otomatis update
7. Selesai — semua pesan WA masuk otomatis ke sistem

## 8. Monetisasi

- **Monthly subscription** per properti
- **Freemium** — 1 properti gratis, upgrade untuk >1
- Atau **one-time setup fee** + monthly kecil

## 9. Metrik Sukses

- Okupansi rata-rata naik >80%
- Waktu nagih turun 90%
- Response komplain <1 jam
- 50+ owner kos onboard bulan pertama

## 10. Struktur Project

```
kospintar/
├── src/
│   ├── index.js                    # Entry point Express
│   ├── config/
│   │   └── db.js                   # Koneksi PostgreSQL
│   ├── middleware/
│   │   └── auth.js                 # JWT middleware
│   ├── routes/
│   │   ├── auth.js                 # Register / Login
│   │   ├── properties.js           # CRUD properti
│   │   ├── tenants.js              # CRUD penghuni
│   │   ├── bills.js                # Tagihan + Midtrans
│   │   ├── tickets.js              # Tiket komplain
│   │   └── wa.js                   # QR, send, webhook Evolution
│   ├── services/
│   │   ├── evolution.js            # Client Evolution API
│   │   └── midtrans.js             # Client Midtrans
│   └── schema.sql                  # Database schema
├── views/                          # EJS templates
│   ├── layout.ejs
│   ├── login.ejs
│   ├── dashboard.ejs
│   ├── properties.ejs
│   ├── tenants.ejs
│   ├── bills.ejs
│   ├── tickets.ejs
│   └── wa.ejs
├── public/                         # Static files
├── .env
├── package.json
└── README.md
```

## 11. Next Steps

1. Init Express.js project
2. Setup PostgreSQL + schema
3. Build auth (register/login)
4. CRUD properti + penghuni
5. Deploy Evolution API (Docker)
6. Integrasi QR code Evolution API
7. Integrasi Midtrans
8. Webhook incoming WA → auto ticket
9. Billing reminder otomatis
10. Testing dengan 1-2 owner kos
