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
| **Auto-billing + due_date logic** | Tagihan terbit tiap tgl 25 untuk bulan depan. Jatuh tempo tgl 10. Prorata otomatis kalau checkout tengah bulan. |
| **WA Reminder H-7/H-3/H-1/H+1** | Penghuni diingatkan otomatis via WA. Template bisa diedit. |
| **Bayar via Midtrans** | Link signed token dari WA — klik & bayar pake QRIS/VA. Gak perlu login. |
| **Komplain WA → Tiket** | Penghuni chat WA → auto jadi tiket + auto-reply. Priority detection keyword darurat. |
| **Laporan Keuangan** | Rekap pemasukan, okupansi, grafik 6 bulan. |
| **Chat dari Dashboard** | Kirim pesan, reply tiket, histori percakapan. |

## Arsitektur

```
Proxmox → LXC (unprivileged) → Docker Compose
  ├── Caddy        (reverse proxy + SSL)
  ├── API          (Express.js — HTTP)
  ├── Worker       (Bull queue — WA send async)
  ├── Scheduler    (node-cron — billing, reminder)
  ├── PostgreSQL   + PgBouncer
  ├── Redis        (queue + cache + lock)
  └── Evolution    (WA API, Chromium)
```

## Target Persona

**Rina** (30-50th) — punya 1-3 kosan. Pake WA tiap hari. HP Android utama.

## Tech Stack

Next.js (TS) → Caddy → Express.js (TS) → PostgreSQL + PgBouncer → Redis → S3-compatible

## Pricing (MVP)

**Gratis** — max 3 properti, 50 tenant/properti, 500 WA pesan/bulan.

## Status

🚧 Pre-launch. PRD final. Siap implementasi.

---

*Built for owner kos. Not for tech bros.*
