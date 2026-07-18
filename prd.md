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

## Fitur

1. Register/login owner
2. CRUD properti + penghuni
3. Tagihan + reminder WA otomatis
4. Komplain WA → tiket otomatis
5. Koneksi WA via QR (Evolution API)
6. Pembayaran Midtrans
7. Dashboard rekap keuangan
