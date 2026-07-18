# Kospintar

> SaaS manajemen kos all-in-one via dashboard + WhatsApp.
> Karena ngurus kos itu ribet — kami bikin simpel.

## Masalah

- Nagih sewa satu-satu manual via WA — buang waktu
- Pembayaran cash/setor tunai — repot tracking
- Komplain penghuni tercecer di chat WA — gak terpantau
- Laporan keuangan? Ngitung sendiri pake notes HP

## Solusi (MVP)

| Fitur | Manfaat |
|-------|---------|
| **CRUD Properti & Penghuni** | Data rapi di satu tempat. Room number otomatis unique. |
| **Auto-billing + due_date logic** | Tagihan terbit tiap tgl 25 untuk bulan depan. Jatuh tempo tiap tgl 10. Prorata otomatis kalau checkout tengah bulan. |
| **WA Reminder H-7/H-3/H-1/H+1** | Penghuni diingatkan otomatis via WA. Bisa diedit template-nya. |
| **Bayar via Midtrans** | Link signed token dari WA — klik & bayar pake QRIS/VA. Gak perlu login. |
| **Komplain WA → Tiket** | Penghuni chat WA → auto jadi tiket + auto-reply. Priority detection keyword darurat. |
| **Laporan Keuangan** | Rekap pemasukan, okupansi, grafik 6 bulan. |
| **Chat dari Dashboard** | Kirim pesan, reply tiket, histori percakapan. |

## Kenapa Ini Production-Ready?

- **Semua nominal pake INTEGER (sen)** — gak ada floating point error
- **WA queue via Redis Bull** — rate limited, retry, dead letter queue
- **Signed token untuk payment** — tenant bayar tanpa login
- **Midtrans webhook signature only** — no IP whitelist
- **Graceful shutdown + health check** — deployment aman
- **Audit log + PDP compliance** — hapus akun, anonimisasi data
- **Backup harian ke S3** — RPO <24 jam, RTO <4 jam
- **PgBouncer dari awal** — gak kena max_connection bottleneck
- **TypeScript + Zod validation** — zero runtime surprises

## Target Persona

**Rina** (30-50th) — punya 1-3 kosan. Pake WA tiap hari. Gaptek software. Pengen "set & forget".

## Tech Stack

Next.js (TS) → Nginx → Express.js (TS) → PostgreSQL + PgBouncer → Redis (WA queue) → S3 (files) → Docker

## Pricing (MVP)

**Gratis** — max 3 properti, 50 tenant/properti, 500 WA pesan/bulan.

v2: Subscription mulai Rp49k/bulan.

## Status

🚧 Pre-launch. PRD final. Siap implementasi.

---

*Built for owner kos. Not for tech bros.*
