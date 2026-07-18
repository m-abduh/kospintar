# PRD — Kospintar

## Ringkasan

SaaS manajemen kos terintegrasi WhatsApp. Satu dashboard untuk tagihan, komplain, dan laporan.

## Arsitektur

```
Next.js (pages + API)
  ├── PostgreSQL
  ├── Evolution API (WA QR)
  └── Midtrans (payment)
```

## Tech Stack

- **Next.js** — frontend + API routes
- **PostgreSQL** — database
- **Evolution API** — WhatsApp multi-instance + QR
- **Midtrans** — pembayaran
- **Vercel** — hosting Next.js
- **VPS** — hosting Evolution API

## Struktur

```
kospintar/
├── prisma/schema.prisma       # DB model
├── src/
│   ├── app/
│   │   ├── page.js            # Landing
│   │   ├── login/page.js
│   │   ├── register/page.js
│   │   └── dashboard/
│   │       ├── page.js
│   │       ├── properties/
│   │       ├── tenants/
│   │       ├── bills/
│   │       ├── tickets/
│   │       └── wa/
│   └── api/
│       ├── auth/route.js
│       ├── properties/route.js
│       ├── tenants/route.js
│       ├── bills/route.js
│       ├── tickets/route.js
│       └── wa/
│           ├── connect/route.js
│           ├── qr/route.js
│           ├── webhook/route.js
│           └── send/route.js
├── lib/
│   ├── prisma.js
│   ├── auth.js
│   ├── evolution.js
│   └── midtrans.js
└── components/
    ├── Sidebar.js
    └── QRModal.js
```

## Fitur MVP

1. Register/login owner
2. CRUD properti + penghuni
3. Tagihan + reminder WA
4. Komplain → tiket otomatis via WA
5. Koneksi WA via QR code (Evolution API)
6. Pembayaran Midtrans
7. Dashboard rekap

## Alur WA

Owner klik "Hubungkan WA" → QR muncul di dashboard → scan dari HP → selesai. Semua pesan masuk otomatis jadi tiket.
