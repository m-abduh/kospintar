# PRD — Kospintar MVP v1.0

| Metadata | |
|----------|-|
| **Status** | Final v1 |
| **Penulis** | — |
| **Tanggal** | 2026-07-18 |
| **Target Rilis** | TBD |

---

## 1. Vision & Product Goals

### Vision
Menjadi platform manajemen kos No. 1 di Indonesia yang menghilangkan sakit kepala operasional kos harian — dari tagihan, pembayaran, komunikasi, sampai laporan keuangan — semuanya dari satu dashboard + WhatsApp.

### Product Goals (MVP)
1. Owner bisa daftar, login, dan manage >1 properti dari satu akun.
2. Tagihan bulanan terbit otomatis + reminder WA tanpa campur tangan manual.
3. Penghuni bisa bayar via QRIS/VA Midtrans tanpa perlu ketemu owner.
4. Komplain WA langsung jadi tiket yang terlacak.
5. Owner lihat rekap pemasukan real-time per properti.

### OKRs MVP
| Objective | Key Result |
|-----------|------------|
| Owner menghemat 10+ jam/bulan | 80% tagihan terbit otomatis tanpa sentuhan manual |
| Penghuni bayar tepat waktu | Penagihan berhasil via WA >90%, pembayaran via Midtrans >70% |
| Komplain tidak terlewat | 100% komplain WA terkonversi jadi tiket dalam <1 menit |

### MVP Non-Goals (sadar tidak dikerjakan)
- AI Leasing Agent
- Auto-posting WA Status
- Denda otomatis
- Role management / multi-user
- Mobile app native
- Consolidated multi-property report advanced
- PWA (progressive web app — cukup responsive web)

---

## 2. Target Persona

### Persona 1 — Rina (Owner Skala Kecil)
| Atribut | Detail |
|---------|--------|
| Usia | 30–50 tahun |
| Properti | 1–3 rumah kos (@5–20 kamar) |
| Tech savvy | Medium — pake WA tiap hari, agak gaptek soal software |
| Pain point | Pegang bon kertas, nagih satu-satu via WA manual, nyatet pembayaran di notes HP, pusing ngitung keuangan |
| Behavior | Pengen "set & forget" — sekali set, bulanan jalan sendiri |
| Device | HP Android — jarang buka laptop |

### Persona 2 — Alex (Owner Skala Menengah)
| Atribut | Detail |
|---------|--------|
| Usia | 25–40 tahun |
| Properti | 4–10 properti (bisa punya partner) |
| Tech savvy | Tinggi — familiar dengan dashboard, SaaS, mobile app |
| Pain point | Susah pantau semua properti sekaligus, arus kas tidak transparan, komplain penghuni sering terlewat |
| Behavior | Butuh consolidated report, multi-property view, role management untuk admin/koki |
| Device | Laptop + HP |

### MVP Target Utama: **Rina** (Owner skala kecil).
Alex baru fully served di v2.

---

## 3. Success Metrics (KPI)

| Metrik | Target MVP | Cara Ukur |
|--------|-----------|-----------|
| **DAU / MAU** | >70% owner aktif mingguan | Firebase / custom analytics |
| **Billing success rate** | >85% tagihan terbayar ≤ H+7 | DB (`bills.status`) |
| **WA delivery rate** | >95% pesan WA terkirim | Evolution API callback + `notification_logs` |
| **Ticket response time** | <6 jam respon pertama owner | DB (`tickets.created_at` → `updated_at`) |
| **Midtrans conversion** | >70% click-to-pay berhasil | Midtrans dashboard + `payment_logs` |
| **NPS (post-launch)** | >40 | Survey in-app bulan 3 |
| **Active user retention** | >60% owner masih aktif di bulan 2 | Hitung login unik per minggu |

---

## 4. Fitur — Prioritas MVP

### LEGEND
- **P0** — Blocker, MVP gak bisa rilis tanpa ini
- **P1** — Important, usahakan masuk MVP
- **P2** — Nice to have, geser ke v1.1 kalau darurat

| ID | Fitur | Prioritas | Estimasi |
|----|-------|-----------|----------|
| F-01 | Register & Login (email + password) | P0 | 3 hari |
| F-02 | CRUD Properti | P0 | 3 hari |
| F-03 | CRUD Penghuni | P0 | 3 hari |
| F-04 | Hubungkan WhatsApp (QR) | P0 | 3 hari |
| F-05 | Auto-billing bulanan + due_date logic + prorata sederhana | P1 | 5 hari |
| F-06 | WA reminder otomatis (H-7, H-3, H-1, H+1) | P1 | 3 hari |
| F-07 | Generate link bayar Midtrans (tanpa auth — signed token) | P1 | 4 hari |
| F-08 | Webhook Midtrans → update status (signature only) | P0 | 3 hari |
| F-09 | Komplain WA → tiket otomatis | P1 | 4 hari |
| F-10 | Dashboard keuangan sederhana | P1 | 3 hari |
| F-11 | Kirim pesan WA dari dashboard | P2 | 2 hari |
| F-12 | Filter & search properti/penghuni/tagihan | P2 | 2 hari |

### WILL NOT DO (untuk MVP)
- AI Leasing Agent → v3
- Auto-posting WA Status → v2
- Consolidated multi-property report → v2
- Role management / multi-user → v2
- Mobile app (native) → v2
- Denda otomatis → v1.1
- PWA → v2
- Export laporan (CSV/PDF) → v1.1

---

## 5. User Stories & Acceptance Criteria

### F-01: Register & Login
```
Sebagai owner, saya ingin daftar dengan email & password agar 
bisa akses dashboard.
```

**AC:**
- Register: input nama, email, password, nomor HP → sukses → redirect ke dashboard
- Validasi: email unik, password min 8 karakter (huruf + angka), nomor HP valid (62xx, min 10 digit)
- Login: input email + password → return JWT
- Session: JWT access token, expire 7 hari
- Lupa password: kirim link reset via email (opsional MVP — bisa skip, ganti via WA support sementara)
- Logout: hapus JWT dari client
- Rate limit: 5x gagal login dalam 15 menit → lockout 15 menit. Hitungan per IP + email.

### F-02: CRUD Properti
```
Sebagai owner, saya ingin tambah/edit/hapus properti agar 
bisa manage semua kos saya.
```

**AC:**
- List properti: card view, tiap card: nama, alamat, jumlah kamar, status (aktif/nonaktif)
- Tambah: nama, alamat, jumlah kamar, foto (opsional)
- Edit: semua field bisa diubah
- Hapus: soft delete (`deleted_at`). Hanya bisa jika tidak ada penghuni aktif **dan** tidak ada tagihan unpaid.
- List pagination (10 per page) + search by nama
- Free tier enforcement: max 3 properti per akun. Tampilkan error + upsell saat mencapai limit.

### F-03: CRUD Penghuni
```
Sebagai owner, saya ingin data penghuni tercatat agar 
tagihan bisa diterbitkan otomatis.
```

**AC:**
- Tambah: nama, nomor HP (valid 62xx), nomor kamar, harga sewa, deposit, tanggal kontrak mulai & selesai, upload foto KTP (opsional)
- Nomor kamar **UNIQUE per properti** — validated via `UNIQUE(property_id, room_number)` di DB
- Edit: ubah kamar, harga sewa (berlaku bulan berikutnya), perpanjang kontrak
- Check-out: set status `checkout`, kamar tersedia kembali. Generate tagihan prorata untuk bulan berjalan jika sudah lewat tgl 10.
- List: filter properti, search nama, filter status (aktif/checkout)
- Deposit tracking: simpan nilai deposit awal. Saat checkout, admin input potongan → hitung sisa deposit yang dikembalikan.
- Free tier enforcement: max 50 tenant per properti.

### F-04: Hubungkan WhatsApp
```
Sebagai owner, saya ingin menghubungkan nomor WA kos saya 
agar bisa kirim reminder & terima komplain otomatis.
```

**AC:**
- Tiap properti punya koneksi WA sendiri
- Flow: input nomor HP properti → klik "Hubungkan WA" → QR code muncul di dashboard
- QR code: refresh tiap 30 detik, auto-close setelah connect
- Status: connecting, connected, disconnected, expired
- Disconnect handling: notifikasi ke dashboard (bell icon + badge). Auto-reconnect 3x dengan exponential backoff (30s, 2m, 5m).
- Reconnect: klik "Hubungkan Ulang" → QR baru
- Hanya 1 instance WA per properti
- Retry otomatis max 3x. Kalau gagal semua → status `disconnected`, tunggu manual.

### F-05: Auto-billing Bulanan
```
Sebagai owner, saya ingin tagihan terbit otomatis setiap 
bulan tanpa harus entry manual.
```

**AC:**
- Cron job: tiap tanggal 25 jam 08:00 WIB generate tagihan **bulan depan**
- `due_date` = tanggal 10 setiap bulan (default). Bisa override per tenant via `tenants.due_date_override`.
- Yang dibuatkan tagihan: penghuni status `active`, `contract_end` >= bulan depan
- Nominal: `rent_amount` dari tabel tenants. **Dalam satuan sen (INTEGER)** — simpan 50000000 = Rp500.000.
- Prorata sederhana (jika tenant checkout di tengah bulan):
  - Jika checkout sebelum tgl 10 → tagihan prorata = `rent_amount × sisa_hari / total_hari_bulan`
  - Jika checkout setelah tgl 10 → tagihan full month
- Jika tagihan (tenant_id, period_label) sudah ada → skip (idempotent via UNIQUE constraint)
- Status awal bill: `pending`
- Batch log: catat jumlah berhasil, gagal, skip tiap siklus di tabel `cron_logs`
- Jika cron gagal total → retry 3x (interval 5 menit). Jika masih gagal → alert via **email + dashboard notification** (jangan via WA — chicken-and-egg).

### F-06: WA Reminder Otomatis
```
Sebagai owner, saya ingin penghuni otomatis diingatkan via 
WA agar bayar tepat waktu.
```

**AC:**
- Timeline reminder (relative ke `due_date`):
  - H-7 → "Tagihan kos kamu bulan [bulan] udah terbit ya, Rp [amount]. Yuk segera bayar: [link]"
  - H-3 → "Kak [nama], tagihan [bulan] Rp [amount] masih nunggak nih. Yuk bayar: [link]"
  - H-1 → "Besok deadline tagihan [bulan]. Jangan lupa bayar ya: [link]"
  - H+1 → "Kak, tagihan sudah jatuh tempo. Segera bayar biar gak kendala: [link]"
- Jika status `paid` sebelum H-7 → skip semua reminder
- Link di WA: signed payment URL (bukan JWT) `https://app.kospintar.com/pay/{signed_token}`
- Setiap reminder tercatat di `notification_logs`
- Gagal kirim WA → retry 2x (interval 30s). Jika gagal semua, catat status=failed + error_message.
- Templates disimpan di table `message_templates` — bisa diedit owner nantinya (v1.1).
- **Tidak ada mention "denda"** di template — fitur denda belum aktif.

### F-07: Generate Link Bayar Midtrans
```
Sebagai penghuni, saya ingin klik link dari WA dan bayar 
langsung via QRIS/VA tanpa ribet.
```

**AC:**
- Endpoint: `POST /api/pay/:signed_token`
  - `signed_token` = JWT yang ditandatangani dengan secret khusus pay, berisi `{bill_id, tenant_phone, exp}`
  - Expiry: 7 hari (sampai due_date+7 lewat)
  - **Tidak perlu auth** — token sudah cukup untuk verifikasi
- Response: `redirect_url` (Midtrans Snap page)
- Payment methods: QRIS (utama), Virtual Account (BCA, Mandiri, BNI, BRI, CIMB)
- Status Midtrans: `pending`, `settlement` (lunas), `expire`, `deny`, `cancel`
- `midtrans_order_id` format: `KSP-{bill_id}-{random_4digit}` — pastikan unique
- Midtrans transaction_id disimpan di `payment_logs`
- Snap page: redirect (lebih reliable daripada embed untuk HP)

### F-08: Webhook Midtrans → Update Status
```
Sebagai system, saya ingin notifikasi pembayaran dari Midtrans 
otomatis update status tagihan.
```

**AC:**
- Endpoint: `POST /api/bills/webhook/midtrans`
- **Hanya** signature validation — **jangan IP whitelist** (Midtrans dynamic IP)
  - Signature: `sha512(order_id + status_code + gross_amount + server_key)`
  - Bandingkan dengan signature dari header Midtrans
- Status mapping:
  - `settlement` / `capture` → `bills.status = 'paid'`, `paid_at = now()`
  - `expire` → `bills.status = 'expired'` (hanya jika status sebelumnya `pending`)
  - `deny` / `cancel` / `failure` → no status change, catat di log
  - `pending` → upsert `payment_logs`, jangan ubah bill status
- Idempotent: jika `midtrans_transaction_id` sudah ada di `payment_logs` → skip with 200 OK
- Jika status jadi `paid`:
  - update `bills.paid_at = now()`
  - kirim WA notifikasi lunas: "Pembayaran Rp [amount] untuk tagihan [bulan] sudah kami terima. Terima kasih!"
- Log semua raw response di `payment_logs.raw_response`
- **Transaction**: update bill status + insert payment_logs dalam 1 DB transaction. Gagal kirim WA jangan rollback payment — cukup catat di `notification_logs.status=failed`.

### F-09: Komplain WA → Tiket
```
Sebagai penghuni, saya ingin kirim komplain via WA dan 
tercatat otomatis tanpa perlu nelpon owner.
```

**AC:**
- Webhook Evolution API → backend auto-create ticket
- Validasi webhook: cocokkan `X-Evolution-Key` header dengan API key yang disimpan
- Incoming message dideteksi sebagai komplain jika:
  - Nomor pengirim terdaftar sebagai penghuni aktif
  - Bukan nomor owner/admin properti terkait
- Auto-reply: "Laporan kamu udah kami terima ya, sebentar lagi kami cek. Kode tiket: #TKT{id_6digit}"
- Ticket fields: `title` (ambil dari 100 karakter pertama pesan), `description` (full message), `status=open`, `source=wa`
- Priority detection: jika pesan mengandung keyword `darurat|mendesak|kebakaran|banjir|kunci` → `priority=high`, sisanya `medium`
- Jika nomor tidak dikenal → auto-reply: "Halo, untuk informasi lebih lanjut silakan hubungi pengelola."
- Auto-close: ticket dengan status `resolved` dan tidak ada reply dari tenant >7 hari → auto `closed`
- Ticket muncul di dashboard owner secara real-time (polling tiap 30 detik)

### F-10: Dashboard Keuangan
```
Sebagai owner, saya ingin lihat rekap pemasukan properti 
tanpa harus hitung manual.
```

**AC:**
- Ringkasan per properti:
  - Total penghuni aktif
  - Total kamar terisi / total kamar (% okupansi)
  - Pemasukan bulan ini (total tagihan `paid` bulan berjalan)
  - Pemasukan bulan lalu (perbandingan: naik/turun %)
  - Tagihan outstanding (total `pending` yang sudah lewat due_date)
  - Rata-rata pembayaran per hari (30 hari terakhir)
- Grafik: line chart pemasukan 6 bulan terakhir
- Tabel tagihan: filter berdasarkan status, properti, bulan
- Loading state: skeleton loading. Error state: "Gagal memuat data" + tombol reload.
- Nominal ditampilkan dalam format Rupiah (frontend konversi dari sen ke rupiah)

### F-11: Kirim Pesan WA dari Dashboard
```
Sebagai owner, saya ingin kirim pesan ke penghuni langsung 
dari dashboard tanpa buka WA.
```

**AC:**
- Pilih penghuni → tulis pesan → kirim
- Template cepat: "Tagihan [bulan]", "Pengingat kontrak berakhir", "Pemberitahuan perbaikan" (diambil dari `message_templates`)
- Riwayat chat: list pesan terkirim per penghuni, diambil dari `chat_messages`
- Forward reply tiket: owner reply dari dashboard → pesan terkirim ke WA tenant

---

## 6. Functional Requirements

### 6.1 Autentikasi & Authorisasi
- JWT access token (7 hari expire). JWT_SECRET min 32 karakter, dirotasi tiap 6 bulan.
- Refresh token: skip MVP (cukup re-login)
- Middleware `verifyJWT` di semua endpoint kecuali:
  - `POST /api/auth/*`
  - `POST /api/bills/webhook/midtrans`
  - `POST /api/wa/webhook/*`
  - `POST /api/pay/*` (signed token)
  - `GET /api/health`, `GET /api/ready`
- Rate limit global: 100 request/menit per IP (naikkan ke 300 untuk authenticated). Via express-rate-limit.
- Rate limit auth: 5x gagal dalam 15 menit → lockout 15 menit (per IP + email).
- Password: min 8 karakter, wajib kombinasi huruf + angka. Hash bcrypt (cost factor 10).
- Input validation: zod/schema validation di semua input. Strip XSS.

### 6.2 Multi-property
- Semua resource (tenants, bills, tickets, chat) terikat ke `property_id`
- Owner hanya bisa akses resource milik propertinya sendiri — dicek di setiap query via WHERE `owner_id = req.user.id`
- Filter global di UI: pilih properti → tampilkan data untuk properti itu

### 6.3 WhatsApp (Evolution API)
- 1 instance per properti
- QR: `POST /instance/create` → `GET /instance/qr/{name}` → return base64
- Cek status: `GET /instance/connectionState/{name}`
- Kirim pesan via **queue** (Redis Bull). Jangan blocking.
  - Queue worker: proses 50 pesan/menit (sesuai rate limit Evolution)
  - Retry failed: 2x dengan delay 30s
  - Dead letter: setelah 3x gagal, masuk DLQ + notifikasi admin
- Webhook incoming: `POST /webhook/{instanceName}` → validasi header → proses
- Validasi webhook: cocokkan `X-Evolution-Key` atau IP server Evolution (jika statis)
- Delivery report: Evolution callback → update `notification_logs.status`

### 6.4 Midtrans
- Snap transaction: `POST /transactions/v1/charge` via Midtrans Snap API
- `midtrans_order_id` format: `KSP-{bill_id_last8}-{random_4digit}` — contoh: `KSP-a1b2c3d4-8721`
- Payment channel: QRIS (utama), Virtual Account (BCA, Mandiri, BNI, BRI, CIMB)
- Webhook: validasi signature `sha512(order_id + status_code + gross_amount + server_key)`. **Jangan IP whitelist**.
- Expire payment link: 24 jam dari generate. Kalau lewat, tenant minta link baru dari owner.
- Idempotent: duplicate callback → cek `midtrans_transaction_id` di `payment_logs` → skip.
- Handle unsettled payment: cron tiap 6 jam cek transaksi `pending` yang >24 jam → update status via Midtrans API `/transactions/{order_id}/status`

### 6.5 Billing Engine
- Cron: `0 8 25 * *` (tgl 25 jam 08:00 WIB) → generate billing bulan depan
- `due_date` logic:
  - Default: tanggal 10 setiap bulan
  - Bisa override per tenant via `tenants.due_date_override` (1–28)
  - Kalau due_date override > 28 → batasi ke 28 (hindari error tanggal invalid)
- Prorata checkout: `amount = ROUND(rent_amount × sisa_hari / total_hari_bulan)`
- Idempotent: UNIQUE `(tenant_id, period_label)`
- Cron job lock: pastikan hanya 1 instance yang jalan (advisory lock PostgreSQL: `pg_try_advisory_lock()`)
- Semua nominal dalam **sen (INTEGER)**. Tampilkan di UI dengan format Rupiah (`Rp 500.000`).

### 6.6 Notification Log
Setiap notifikasi WA tercatat di `notification_logs`:
- `id, bill_id, ticket_id, chat_message_id, type, recipient_phone, message_body, status, error_message, sent_at`

### 6.7 File Storage
- Penyimpanan: **S3-compatible** (AWS S3 / DigitalOcean Spaces / Cloudinary)
  - Jangan simpan file di local server — tidak scalable, risk data loss
- KTP upload: bucket private, akses via signed URL (expire 1 jam)
- Properti foto: bucket public-read, cache CDN
- Security: scan virus (ClamAV) opsional — bisa skip MVP
- PDP compliance: file KTP dihapus otomatis 30 hari setelah tenant checkout

### 6.8 Graceful Shutdown
- Handler SIGTERM, SIGINT:
  1. Hentikan cron jobs (node-cron destroy)
  2. Stop HTTP server (stop accepting new requests)
  3. Drain pending Redis queue jobs (wait max 10 detik)
  4. Tutup koneksi DB (pg pool end)
  5. Exit process (exit code 0)
- Timeout: force exit setelah 30 detik

### 6.9 Rate Limiting & Security
| Endpoint | Rate Limit | Notes |
|----------|-----------|-------|
| Semua endpoint (unauthenticated) | 100 req/menit/IP | express-rate-limit |
| Semua endpoint (authenticated) | 300 req/menit/user | based on user_id |
| Auth login | 5 req/15 menit/IP+email | lockout 15 menit |
| Webhook Midtrans | 200 req/menit/IP | allowance for burst |
| Webhook Evolution | 100 req/menit/IP | |
| WA send | 50 req/menit/property | sesuai limit Evolution API |

### 6.10 Free Tier Enforcement
- Middleware per-property: cek jumlah properti owner (max 3)
- Middleware per-tenant: cek jumlah tenant per properti (max 50)
- WA pesan gratis: 500 pesan/bulan. Counter di `usage_logs`. Lewat → WA send ditolak, notifikasi owner "Tier gratis sudah mencapai batas WA bulan ini."

---

## 7. Non-Functional Requirements

| Area | Requirement |
|------|------------|
| **Availability** | Uptime 99.5% (max ~3.5 jam down/bulan). Cron billing wajib jalan meskipun server sibuk. |
| **Performance** | API response <500ms (P95). Dashboard load <3 detik. Query bills >100k row harus <2 detik. |
| **Security** | JWT secret min 32 char, rotasi 6 bulan. Password bcrypt cost 10. HTTPS redirect. CORS restrict ke frontend domain + development domain. CSP headers. Helmet middleware. |
| **Data** | Backup DB harian (pg_dump) jam 03:00 WIB, retensi 14 hari. Backup ke S3-compatible storage. |
| **Logging** | Winston/Pino structured logging (JSON format). Correlation ID di tiap request (middleware `express-request-id`). Log level: debug (dev), info (prod). |
| **Monitoring** | Health dashboard internal (status tiap service). Sentry error tracking. better-uptime / uptimerobot untuk endpoint. Cron job failure → email alert via SMTP. |
| **Scalability** | 50 properti per server (MVP cukup single instance). PostgreSQL + PgBouncer connection pooling dari awal. Query siap pakai index. |
| **Mobile** | Web responsive (mobile-first). Breakpoints: 640/768/1024/1280. Target: persona Rina — layar HP 6 inch. |
| **Audit** | Semua perubahan data critical (tenant, bill, property) tercatat di `audit_logs`. Retention: 1 tahun. |
| **Testing** | Minimal: integration test untuk payment flow, billing cron, WA send. E2E test untuk critical path: register → add property → add tenant → pay bill. Coverage target >70%. |
| **Type Safety** | TypeScript di frontend & backend. Shared types package untuk API request/response. Zod validation di runtime. |
| **CI/CD** | GitHub Actions: lint (ESLint) → typecheck (tsc) → test (vitest/jest) → build (Docker) → deploy. Auto-rollback on test failure. Staging environment mirror production. |

---

## 8. Arsitektur

### 8.1 Diagram

```
Proxmox Host
   └── LXC Debian (unprivileged, nesting enabled)
       └── Docker Compose

            ┌──────────┐
            │  Caddy   │ ← reverse proxy + SSL (Let's Encrypt)
            └────┬─────┘
                 │
          ┌──────▼──────┐
          │   API (:80)  │ ← Express.js, TypeScript, Zod
          │  (REST)      │
          └──────┬───────┘
                 │
     ┌───────────┼──────────────┐
     │           │              │
┌────▼────┐ ┌────▼────┐  ┌─────▼──────┐
│  Worker │ │Scheduler│  │  Redis     │
│ (queue) │ │ (cron)  │  │ (Bull+     │
│ async   │ │ billing │  │  cache)    │
│ WA send │ │ reminder│  └────────────┘
└─────────┘ └─────────┘
     │           │              │
     └───────────┼──────────────┘
                 │
          ┌──────▼──────┐
          │ PostgreSQL   │
          │ + PgBouncer  │
          └─────────────┘

External:
  Evolution API (WA)  →  localhost:8080
  Midtrans API        →  outbound HTTPS
  SMTP/Resend         →  outbound
```

### 8.2 Service Breakdown

| Container | Role | Dependency |
|-----------|------|------------|
| **caddy** | Reverse proxy, SSL termination, static cache | — |
| **api** | Express.js — serving HTTP requests (REST) | postgres, redis |
| **worker** | Bull queue consumer — kirim WA, process webhook | redis, postgres |
| **scheduler** | node-cron — auto-billing, WA reminder, expire payment | postgres, redis |
| **postgres** | Database utama + PgBouncer sidecar | — |
| **redis** | Queue (Bull) + cache + cron lock | — |
| **evolution** | WhatsApp API (Chromium) | — |

### 8.3 Kenapa Worker dan Scheduler Dipisah?

| Proses | Tugas | Kenapa Terpisah |
|--------|-------|-----------------|
| **API** | Menangani request HTTP (CRUD, auth, payment) | Harus responsif <500ms. WA send blocking akan memperlambat. |
| **Worker** | Konsumsi queue: kirim WA, hitung billing, process webhook | Jalan di background, bisa antri + rate limit + retry. Scaling independen. |
| **Scheduler** | Cron: trigger billing tgl 25, reminder H-7/H-3/H-1, expire payment | Dedicated process, gak rebutan resource dengan API. Cron lock via Redis. |

### 8.4 Catatan Arsitektur

- **Redis**: **WAJIB**. Bull queue untuk WA sending. Rate limit 50/menit sesuai limit Evolution. Cron lock via Redis (advisory lock).
- **PgBouncer**: Transaction pooling dari awal. Mencegah PostgreSQL max_connections habis.
- **Caddy**: Reverse proxy + SSL auto (Let's Encrypt). Lebih sederhana dari Nginx.
- **Static assets**: Caddy cache. Next.js SSG/ISR. CDN opsional (Cloudflare).
- **Health check**: Tiap service punya endpoint health. Caddy routing: `GET /health` → aggregator.
- **Shared types**: Monorepo `shared/` package untuk tipe TypeScript + validasi Zod. Dipake bareng API + Worker + Scheduler.
- **ORM**: Prisma + Prisma Migrate. Type-safe, otomatis generate tipe dari schema. Pake raw SQL untuk query kompleks (dashboard aggregation).
- **Monorepo**: pnpm workspaces. Struktur: `packages/{api,worker,scheduler,shared,frontend}`.

---

## 9. Data Model

### 9.1 Entity Relationship (MVP)

```
users 1──N properties
properties 1──N tenants
properties 1──N wa_instances
properties 1──N tickets
tenants 1──N bills
tenants 1──N chat_messages
bills 1──N payment_logs
tickets N──1 tenants (optional)
```

### 9.2 Schema Detail

**Catatan: semua nominal uang dalam INTEGER (sen).** 50.000 rupiah = 5000000 sen.

#### `users`
| Kolom | Tipe | Notes |
|-------|------|-------|
| id | UUID | PK |
| name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(255) | UNIQUE, NOT NULL, lowercase |
| password_hash | VARCHAR(255) | bcrypt |
| phone | VARCHAR(20) | Format 62xx, NOT NULL |
| role | VARCHAR(20) | `owner` saja untuk MVP |
| is_active | BOOLEAN | Default true. False jika akun dihapus. |
| deleted_at | TIMESTAMPTZ | Soft delete |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `properties`
| Kolom | Tipe | Notes |
|-------|------|-------|
| id | UUID | PK |
| owner_id | UUID | FK → users.id, NOT NULL |
| name | VARCHAR(200) | NOT NULL |
| address | TEXT | |
| total_rooms | INTEGER | |
| photo_url | VARCHAR(500) | S3 URL |
| is_active | BOOLEAN | Default true |
| deleted_at | TIMESTAMPTZ | Soft delete |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `tenants`
| Kolom | Tipe | Notes |
|-------|------|-------|
| id | UUID | PK |
| property_id | UUID | FK → properties.id, NOT NULL |
| name | VARCHAR(100) | NOT NULL |
| phone | VARCHAR(20) | Format 62xx, NOT NULL |
| room_number | VARCHAR(20) | NOT NULL |
| rent_amount | INTEGER | Dalam sen. 50000000 = Rp500.000 |
| deposit | INTEGER | Dalam sen |
| due_date_override | SMALLINT | 1–28, nullable. Default NULL = tanggal 10. |
| contract_start | DATE | NOT NULL |
| contract_end | DATE | NOT NULL |
| status | VARCHAR(20) | `active`, `checkout`, default `active` |
| ktp_url | VARCHAR(500) | S3 signed URL |
| notes | TEXT | Catatan internal owner |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| UNIQUE | (property_id, room_number) | |

#### `bills`
| Kolom | Tipe | Notes |
|-------|------|-------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants.id, NOT NULL |
| property_id | UUID | FK → properties.id, NOT NULL |
| amount | INTEGER | Dalam sen. |
| due_date | DATE | NOT NULL. Default tgl 10. |
| period_label | VARCHAR(7) | e.g. `2026-08` |
| status | VARCHAR(20) | `pending`, `paid`, `expired`, `void`. Default `pending` |
| paid_at | TIMESTAMPTZ | Null jika belum bayar |
| midtrans_order_id | VARCHAR(50) | Format: `KSP-{bill_id_last8}-{random4}` |
| void_reason | VARCHAR(200) | Alasan void (jika manual) |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| UNIQUE | (tenant_id, period_label) | |

#### `payment_logs`
| Kolom | Tipe | Notes |
|-------|------|-------|
| id | UUID | PK |
| bill_id | UUID | FK → bills.id, NOT NULL |
| midtrans_transaction_id | VARCHAR(100) | UNIQUE, source of truth transaksi |
| midtrans_order_id | VARCHAR(50) | Denormalized untuk lookup cepat |
| status | VARCHAR(30) | `pending`, `settlement`, `expire`, `deny`, `cancel`, `failure` |
| gross_amount | INTEGER | Dari Midtrans response |
| raw_response | JSONB | Full response dari Midtrans |
| created_at | TIMESTAMPTZ | |

#### `tickets`
| Kolom | Tipe | Notes |
|-------|------|-------|
| id | UUID | PK |
| property_id | UUID | FK → properties.id, NOT NULL |
| tenant_id | UUID | FK → tenants.id (nullable — bisa dari non-tenant) |
| ticket_number | VARCHAR(20) | e.g. `TKT-000001` — auto increment |
| title | VARCHAR(200) | NOT NULL |
| description | TEXT | |
| status | VARCHAR(20) | `open`, `in_progress`, `resolved`, `closed`. Default `open` |
| priority | VARCHAR(10) | `low`, `medium`, `high`. Default `medium` |
| source | VARCHAR(20) | `wa`, `manual` |
| wa_message_id | VARCHAR(100) | Dari Evolution API |
| closed_at | TIMESTAMPTZ | Auto-close setelah 7 hari resolved |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `chat_messages`
| Kolom | Tipe | Notes |
|-------|------|-------|
| id | UUID | PK |
| ticket_id | UUID | FK → tickets.id (nullable — pesan non-tiket) |
| tenant_id | UUID | FK → tenants.id |
| property_id | UUID | FK → properties.id |
| direction | VARCHAR(10) | `outgoing` (owner→tenant), `incoming` (tenant→owner) |
| message_body | TEXT | NOT NULL |
| wa_message_id | VARCHAR(100) | Dari Evolution API |
| status | VARCHAR(20) | `sent`, `delivered`, `read`, `failed` |
| created_at | TIMESTAMPTZ | |

#### `message_templates`
| Kolom | Tipe | Notes |
|-------|------|-------|
| id | UUID | PK |
| property_id | UUID | FK → properties.id (nullable — template global jika null) |
| name | VARCHAR(50) | `reminder_h7`, `reminder_h3`, `reminder_h1`, `payment_confirmation`, dll |
| body | TEXT | Template dengan variable: `{name}`, `{amount}`, `{due_date}`, `{period}`, `{link}` |
| is_active | BOOLEAN | Default true |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| UNIQUE | (property_id, name) | Nullable property_id → composite unique conditional |

#### `wa_instances`
| Kolom | Tipe | Notes |
|-------|------|-------|
| id | UUID | PK |
| property_id | UUID | FK → properties.id, UNIQUE |
| instance_name | VARCHAR(100) | Nama instance di Evolution |
| phone_number | VARCHAR(20) | Nomor WA properti |
| connection_status | VARCHAR(20) | `connected`, `disconnected`, `connecting`, `expired` |
| last_connected_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `notification_logs`
| Kolom | Tipe | Notes |
|-------|------|-------|
| id | UUID | PK |
| bill_id | UUID | FK → bills.id (nullable) |
| ticket_id | UUID | FK → tickets.id (nullable) |
| chat_message_id | UUID | FK → chat_messages.id (nullable) |
| type | VARCHAR(20) | `reminder`, `payment_confirmation`, `ticket_reply`, `ticket_created` |
| recipient_phone | VARCHAR(20) | Nomor tujuan |
| message_body | TEXT | |
| status | VARCHAR(20) | `sent`, `delivered`, `failed` |
| error_message | TEXT | |
| sent_at | TIMESTAMPTZ | |

#### `audit_logs`
| Kolom | Tipe | Notes |
|-------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| action | VARCHAR(50) | `create_tenant`, `update_bill_status`, dll |
| entity_type | VARCHAR(50) | `tenant`, `bill`, `property`, `ticket` |
| entity_id | UUID | |
| old_data | JSONB | |
| new_data | JSONB | |
| ip_address | VARCHAR(50) | |
| created_at | TIMESTAMPTZ | |

#### `cron_logs`
| Kolom | Tipe | Notes |
|-------|------|-------|
| id | UUID | PK |
| job_name | VARCHAR(50) | `auto_billing`, `wa_reminder`, `expire_stale_payments` |
| status | VARCHAR(20) | `running`, `completed`, `failed` |
| started_at | TIMESTAMPTZ | |
| finished_at | TIMESTAMPTZ | |
| summary | JSONB | `{total: 50, success: 48, failed: 2}` |
| error_message | TEXT | |

### 9.3 Indexes

```sql
-- Bills: query by tenant + period, filter by property + due_date, unpaid filtering
CREATE INDEX idx_bills_tenant_period ON bills(tenant_id, period_label);
CREATE INDEX idx_bills_property_due_date ON bills(property_id, due_date);
CREATE INDEX idx_bills_property_status ON bills(property_id, status) WHERE status = 'pending';

-- Tenants: filter by property, search by name
CREATE INDEX idx_tenants_property_status ON tenants(property_id, status);
CREATE INDEX idx_tenants_property_phone ON tenants(property_id, phone);
CREATE INDEX idx_tenants_name_trgm ON tenants USING gin(name gin_trgm_ops); -- untuk search fuzzy

-- Tickets: filter by property + status
CREATE INDEX idx_tickets_property_status ON tickets(property_id, status);
CREATE INDEX idx_tickets_property_priority ON tickets(property_id, priority, status);

-- Payment logs: lookup by order_id, filter by bill
CREATE INDEX idx_payment_logs_order ON payment_logs(midtrans_order_id);
CREATE INDEX idx_payment_logs_bill ON payment_logs(bill_id);

-- Audit: lookup by entity
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id, created_at DESC);

-- Chat: history per tenant
CREATE INDEX idx_chat_tenant ON chat_messages(tenant_id, created_at DESC);
```

---

## 10. API Endpoints

### 10.1 Auth
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | /api/auth/register | No | Register owner |
| POST | /api/auth/login | No | Login, return JWT |
| GET | /api/auth/me | Yes | Profil owner |
| DELETE | /api/auth/account | Yes | Hapus akun + anonimisasi data (PDP) |

### 10.2 Properties
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /api/properties | Yes | List milik owner |
| GET | /api/properties/:id | Yes | Detail + stats (penghuni aktif, okupansi) |
| POST | /api/properties | Yes | Tambah properti. Cek free tier limit (max 3). |
| PUT | /api/properties/:id | Yes | Edit properti |
| DELETE | /api/properties/:id | Yes | Soft delete. Cek: no active tenants AND no unpaid bills. |

### 10.3 Tenants
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /api/tenants | Yes | List, filter by property_id & status, search by name |
| GET | /api/tenants/:id | Yes | Detail + history tagihan |
| POST | /api/tenants | Yes | Tambah. Cek free tier limit (max 50). Cek UNIQUE room_number. |
| PUT | /api/tenants/:id | Yes | Edit. Room number change = validate UNIQUE. |
| DELETE | /api/tenants/:id | Yes | Set status=checkout. Generate prorata bill jika perlu. |

### 10.4 Bills
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /api/bills | Yes | List, filter property_id & status & period_label |
| GET | /api/bills/:id | Yes | Detail + payment_logs |
| POST | /api/bills | Yes | Manual override — buat tagihan di luar cron |
| PUT | /api/bills/:id/void | Yes | Void bill (hanya jika status pending). Wajib alasan. |
| POST | /api/bills/webhook/midtrans | No (signature only) | Webhook dari Midtrans. Jangan IP whitelist. |

### 10.5 Payment (Public)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | /api/pay/:signed_token | No (token) | Generate Midtrans Snap URL. Token = JWT signed with PAY_SECRET. |
| GET | /api/pay/:signed_token/status | No (token) | Cek status pembayaran tanpa auth |

### 10.6 Tickets
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /api/tickets | Yes | List, filter property_id & status & priority |
| GET | /api/tickets/:id | Yes | Detail + chat messages |
| POST | /api/tickets | Yes | Buat manual dari dashboard |
| PUT | /api/tickets/:id | Yes | Update status (open → in_progress → resolved → closed) |
| POST | /api/tickets/:id/reply | Yes | Reply owner → forward ke WA tenant |

### 10.7 WhatsApp
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | /api/wa/connect | Yes | Init instance Evolution, return QR |
| GET | /api/wa/qr/:propertyId | Yes | QR code terbaru (base64) |
| GET | /api/wa/status/:propertyId | Yes | Status koneksi |
| POST | /api/wa/send | Yes | Kirim pesan manual (masuk queue) |
| POST | /api/wa/webhook/:instanceName | No | Webhook Evolution: validasi key header. Incoming message + delivery report. |
| POST | /api/wa/disconnect/:propertyId | Yes | Putus koneksi WA |

### 10.8 Dashboard
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /api/dashboard/summary | Yes | Ringkasan keuangan per properti + okupansi |
| GET | /api/dashboard/revenue | Yes | Data grafik 6 bulan, filter property_id |

### 10.9 Chat
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /api/chat/:tenantId | Yes | Riwayat chat dengan tenant tertentu |
| POST | /api/chat/send | Yes | Kirim pesan ke tenant (masuk WA queue) |

### 10.10 System
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /api/health | No | Cek: server up, DB reachable, Redis reachable |
| GET | /api/ready | No | Cek: health + migration up-to-date + cron not stuck |

---

## 11. UI / Page Specs (MVP)

### 11.1 Halaman
| Route | Halaman | Notes |
|-------|---------|-------|
| `/login` | Login page | Email + password, link daftar |
| `/register` | Register page | Nama, email, password, nomor HP |
| `/dashboard` | Dashboard utama | Summary cards + grafik 6 bulan |
| `/properties` | List properti | Card grid + search |
| `/properties/new` | Tambah properti | Form |
| `/properties/[id]` | Detail properti | Info + list tenant + stats |
| `/properties/[id]/edit` | Edit properti | Form |
| `/tenants` | List penghuni | Table + filter properti & status |
| `/tenants/new` | Tambah penghuni | Form |
| `/tenants/[id]` | Detail penghuni | Info + riwayat tagihan + chat |
| `/tenants/[id]/edit` | Edit penghuni | Form |
| `/bills` | List tagihan | Table + filter status, properti, periode |
| `/bills/[id]` | Detail tagihan | Info + link bayar + payment logs |
| `/tickets` | List tiket | Table + filter status & prioritas |
| `/tickets/[id]` | Detail tiket | Info + reply form (chat style) |
| `/wa/[propertyId]` | Halaman koneksi WA | QR code + status + tombol disconnect |
| `/settings` | Profil owner | Edit nama, email, password |

### 11.2 Mobile-first Design
- Navigasi: bottom tab bar di mobile (4 tab: Dashboard, Properti, Tagihan, Tiket), sidebar di desktop
- Cards bukan tables di mobile view (≥768px baru tampilkan tabel)
- Touch targets min 44x44px
- WA-style chat bubble untuk reply tiket (kanan: owner, kiri: tenant)
- Bottom sheet untuk filter (bukan dropdown)
- Pull-to-refresh untuk list data
- Loading: skeleton screens (bukan spinner)

### 11.3 States
| State | Behavior |
|-------|----------|
| **Loading** | Skeleton cards/tables. Jangan spinner. |
| **Empty** | Ilustrasi + CTA action. Contoh: "Belum ada properti → Tambah Properti Pertama" |
| **Error** | Toast + inline error + tombol "Coba Lagi". Jangan blank page. |
| **Offline** | Deteksi navigator.onLine. Tampilkan banner "Kamu sedang offline". Data cache dari React Query. |
| **Success** | Toast notifikasi (sonner). Redirect ke halaman terkait. |

---

## 12. Error Handling & Edge Cases

| Skenario | Penanganan |
|----------|-----------|
| Midtrans webhook duplikat | Idempotent key: `midtrans_transaction_id`. Cek di `payment_logs` sebelum insert. Return 200 OK. |
| Evolution API down | Retry 3x exponential backoff (30s, 2m, 5m). Log error + notifikasi dashboard. |
| QR code expired | Auto-refresh tiap 30 detik. Tampilkan "QR expired, refresh..." |
| WA instance terputus | Cron cek tiap 5 menit. Notifikasi dashboard (badge). Owner reconnect manual. |
| Gagal kirim WA | Queue retry 2x (interval 30s). Masuk DLQ setelah 3x gagal. Catat di `notification_logs.status=failed`. |
| Nomor HP tidak valid | Validasi regex `^62\d{9,13}$` di frontend + backend. |
| Tagihan duplikat (manual) | UNIQUE constraint `(tenant_id, period_label)`. Return 409 Conflict. |
| Pembayaran lebih dari tagihan | Midtrans settlement amount ≠ bill amount → flag manual review. Jangan auto-approve. |
| Hapus properti dengan tenant aktif | Reject 400: "Hapus atau checkout semua penghuni dulu." |
| Session expired | 401 → redirect ke `/login`. State form jangan hilang (localStorage sementara). |
| Cron overlap | Advisory lock PostgreSQL `pg_try_advisory_lock()`. Jika locked → skip siklus. |
| Waktu server tidak sinkron | Semua timestamp UTC. Konversi ke WIB di UI via `date-fns` + `Intl.DateTimeFormat`. |
| Transaksi Midtrans pending >24 jam | Cron tiap 6 jam: cek transaksi pending via Midtrans API → update status. |
| Payment selesai tapi WA gagal terkirim | Jangan rollback payment. Catat di `notification_logs`. Owner lihat di dashboard: "Pembayaran diterima, tapi notifikasi WA gagal." |

---

## 13. Monetization Strategy

### MVP: Free Tier (build traction)
- Semua fitur MVP gratis
- Batasan:
  - Max 3 properti per akun
  - Max 50 penghuni per properti
  - Max 500 pesan WA gratis/bulan
- Tidak perlu input payment method untuk daftar

### v2 Target: Freemium + Subscription
| Tier | Harga | Fitur |
|------|-------|-------|
| **Free** | Rp0 | 1 properti, 20 penghuni, 100 WA pesan/bln |
| **Starter** | Rp49k/bln | Unlimited tenant, 3 properti, 1000 WA pesan |
| **Business** | Rp149k/bln | 10 properti, AI Leasing Agent, multi-user, 5000 WA pesan, export |
| **Enterprise** | Custom | Unlimited, dedicated support, on-premise option |

### Payment Collection dari Owner
- Subscription payment via Midtrans (automatic recurring — skip MVP, manual tagih via WA dulu)

---

## 14. Roadmap

### Phase 1 — MVP (v1.0) — [Est: 8–10 minggu]
| Sprint | Fokus |
|--------|-------|
| Sprint 1 | Setup: Next.js + Express + TypeScript + DB + Redis + Docker. CI/CD (GitHub Actions). Auth. |
| Sprint 2 | CRUD Properti + Tenants. File upload (S3). Free tier enforcement. |
| Sprint 3 | WA Connect (QR, queue). Auto-billing + cron with advisory lock. |
| Sprint 4 | WA reminder (templates). Midtrans payment + signed token. |
| Sprint 5 | Webhook Midtrans (signature validation, idempotent). Payment timeout cron. |
| Sprint 6 | Komplain WA → tiket. Dashboard keuangan. Chat messages. |
| Sprint 7 | Bug fix, perf tuning, monitoring setup (Sentry + logging), health check. Launch. |

### Phase 2 — v1.1 (4–6 minggu post-MVP)
- Denda otomatis telat bayar
- Export laporan keuangan (CSV/PDF)
- Multi-user (tambah admin properti)
- Edit message templates dari dashboard
- PWA (installable + push notification)

### Phase 3 — v2 (8–10 minggu post-MVP)
- Consolidated multi-property report
- AI Leasing Agent (balas leads otomatis)
- Advanced analytics + insight
- Role management (admin, teknisi)
- Auto-posting WA Status

---

## 15. Risk & Mitigation

### 15.1 Product Risks

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Evolution API tidak stabil | WA gagal kirim | Queue + retry + DLQ. Dashboard tetap berfungsi tanpa WA. Cari provider alternatif (WATI, Fonnte) untuk contingency. |
| Midtrans settlement delayed | Status paid telat | Webhook + polling cron tiap 6 jam. Manual override button. |
| Owner gaptek — susah setup WA QR | Churn / gagal onboarding | Video tutorial 60 detik in-app. Onboarding wizard step-by-step. Support via WA. |
| Penghuni tidak punya smartphone WA | Reminder tidak terbaca | Bayar tetap bisa via Midtrans link (bisa dishare manual). Cetak invoice rencana v2. |
| Regulasi PDP (UU No. 27/2022) | Denda / sanksi | Data minim. Enkripsi at rest. Fitur hapus akun + anonimisasi data. Retention limit. |
| Kompetitor copy fitur | Kehilangan keunggulan | Fokus ke distribution (owner kos WA groups, marketplace properti) + UX simpel. Bikin habit loop: "buka Kospintar = cek pemasukan". |
| Cron billing gagal | Tagihan tidak terbit | Alert via email + dashboard. Retry 3x. Manual trigger button. |
| DB corrupted | Semua data hilang | Backup harian + mingguan + pre-migration. Restore drill tiap bulan. RTO: <4 jam. RPO: <24 jam. |

### 15.2 Infrastructure Risks (LXC + Single VPS)

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Disk penuh — log postgres & Docker image menumpuk | Service crash, DB stop | Cron `docker system prune -f` mingguan. logrotate untuk log container. Alert disk >80%. |
| RAM tidak cukup — Evolution API spike | OOM killed, WA down | Set `memory: 2g` limit di docker-compose untuk evolution. Jangan restart bareng semua service. |
| Host Proxmox down (listrik/matri) | Semua service down | Backup PostgreSQL tiap 6 jam + dump ke secondary storage. RPO = 6 jam. Recovery: startup ulang. |
| LXC unprivileged — Docker tidak jalan | Gagal deploy | Aktifkan `nesting` + `keyctl` di config LXC. Test Docker-in-LXC sebelum production. |
| Chromium crash karena /dev/shm kecil | Evolution crash | `/dev/shm` minimal 256MB di LXC. Atau pake flag `--disable-dev-shm-usage` di Evolution. |

---

## 16. Monitoring & Alerting

### 16.1 Internal Health Dashboard

Setiap komponen punya endpoint health yang dicek tiap 30 detik oleh scheduler. Hasilnya ditampilkan di halaman `/system/health` (hanya untuk owner — akses via env flag).

```
Status Dashboard:
  ✓ Database            — connected    (2ms)
  ✓ Redis               — connected    (1ms)
  ✓ WA Connected        — 1 instance aktif
  ✓ Queue               — idle (0 jobs)
  ✓ Scheduler           — running (next: auto_billing in 2d)
  ✓ Disk                — 42% used  (14GB / 32GB)
  ✓ RAM                 — 61% used  (2.4GB / 4GB)
  ✓ SSL                 — valid, expires in 60d
```

### 16.2 Health Endpoints

| Endpoint | Service | Cek |
|----------|---------|-----|
| `GET /health` | API | Server hidup, return 200 |
| `GET /health/db` | API | PostgreSQL reachable (`SELECT 1`) + PgBouncer |
| `GET /health/redis` | API | Redis reachable (`PING`) |
| `GET /health/evolution` | API | Evolution API reachable + status connection |
| `GET /health/queue` | API | Bull queue status (pending jobs, failed jobs) |
| `GET /health/scheduler` | API | Last run timestamp + next run |
| `GET /health/disk` | API | Disk usage % (threshold alert >80%) |
| `GET /health/memory` | API | RAM usage % (threshold alert >85%) |

### 16.3 Alerting Matrix

| Komponen | Tools | Alert |
|----------|-------|-------|
| Error rate >1% | Sentry | Email admin + dashboard notif |
| Downtime >1 menit | better-uptime (probe dari luar) | WA admin + email |
| DB connection lost | Health check cron | Email admin |
| Cron job 3x gagal berturut | `cron_logs` | Email owner + admin |
| Backup gagal | pg_dump script | Email admin |
| WA disconnected >10 menit | Scheduler check tiap 5 menit | Dashboard badge (mode non-intrusif) |
| Disk >80% | Health check cron | Email admin |
| API p95 >1 detik | Sentry performance | Review mingguan |
| SSL expiry <14 hari | Caddy auto-renew (gagal) | Email admin |

---

## 17. Glossary

| Istilah | Definisi |
|---------|----------|
| **Owner** | Pemilik / pengelola properti kos |
| **Penghuni / Tenant** | Orang yang menyewa kamar kos |
| **Properti** | Satu bangunan kos (bisa punya banyak kamar) |
| **Tagihan / Bill** | Tagihan sewa bulanan per penghuni |
| **Tiket / Ticket** | Laporan komplain / gangguan dari penghuni |
| **Due date** | Tanggal jatuh tempo pembayaran (default: tgl 10) |
| **DP / Deposit** | Uang jaminan yang disimpan saat masuk kos |
| **Prorata** | Perhitungan proporsional (tagihan sebagian bulan) |
| **OKR** | Objective & Key Results — framework goal setting |
| **NPS** | Net Promoter Score — metrik loyalitas pengguna |
| **SLA** | Service Level Agreement — jaminan tingkat layanan |
| **PDP** | Perlindungan Data Pribadi — UU No. 27 Tahun 2022 |
| **Sen** | Satuan uang terkecil. Rp10.000 = 1.000.000 sen |
| **DLQ** | Dead Letter Queue — antrian pesan gagal setelah retry habis |
| **CRON** | Job scheduler di server untuk task berulang |
| **Snap** | Midtrans payment page (hosted, redirect) |

---

## 18. Infrastruktur & Deployment

### 18.1 Topologi

```
Proxmox Host
  └── LXC Container (Debian 13)
       ├── unprivileged
       ├── nesting=1, keyctl=1
       ├── 4 CPU, 4 GB RAM
       ├── /dev/shm: 256 MB (wajib untuk Evolution/Chromium)
       └── Docker + Docker Compose
```

### 18.2 Setup LXC

```bash
# Config LXC ( `/etc/pve/lxc/<CTID>.conf` )
arch: amd64
cores: 4
memory: 4096
swap: 0
lxc.apparmor.profile: unconfined
lxc.cgroup2.memory.max: 4294967296
lxc.mount.auto: proc:mixed sys:ro

# Penting:
lxc.mount.entry: /dev/shm dev/shm none bind,create=dir 0 0

# Fitur untuk Docker-in-LXC:
lxc.cgroup2.devices.allow: a
lxc.cap.drop:
```

> **Catatan**: `kernel.shmmax` dan `kernel.shmall` **tidak perlu** di-tuning untuk PostgreSQL di dalam Docker. Tuning itu relevan untuk PostgreSQL di host Linux, bukan untuk container Docker.

### 18.3 Docker Compose Services

| Service | Image | Port | Notes |
|---------|-------|------|-------|
| caddy | caddy:alpine | 80, 443 | Reverse proxy + SSL auto |
| api | build: ./backend | internal | Express.js + TS |
| worker | build: ./backend | internal | Bull consumer (entry: worker.ts) |
| scheduler | build: ./backend | internal | Cron jobs (entry: scheduler.ts) |
| postgres | postgres:15-alpine | 5432 (internal) | + PgBouncer sidecar |
| redis | redis:7-alpine | 6379 (internal) | |
| evolution | athenna/evolution-api | 8080 (internal) | WA API, perlu --shm-size |

### 18.4 Estimasi Resource

| Service | RAM (normal) | RAM (puncak) |
|---------|:-----------:|:-----------:|
| PostgreSQL + PgBouncer | 300–500 MB | 800 MB |
| Redis | 50–100 MB | 200 MB |
| API | 150–250 MB | 400 MB |
| Worker | 100–200 MB | 300 MB |
| Scheduler | <50 MB | 100 MB |
| Evolution API (1 instance) | 500 MB–1.2 GB | 2 GB |
| Caddy | 30–50 MB | 80 MB |
| **Total** | **1.5–2.3 GB** | **~3.8 GB** |

Dengan LXC 4 GB RAM, masih ada ruang untuk cache Linux dan lonjakan.

### 18.5 Backup Strategy

- **Harian**: pg_dump jam 03:00 WIB → compress gzip → simpan di secondary storage
- **Mingguan**: Full DB dump + Docker volume backup
- **Pre-migration**: Otomatis dump sebelum `docker compose up` dengan migrasi baru
- **Retensi**: 14 hari untuk harian, 2 bulan untuk mingguan
- **Cek**: Alert email jika backup gagal

### 18.6 CI/CD

Pipeline: **GitHub Actions → GHCR (GitHub Container Registry) → SSH → Docker Compose Pull**

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io/${{ github.repository }}

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test -- --coverage

  cd:
    needs: ci
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Login to GHCR
        run: echo "${{ secrets.GHCR_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin

      - name: Build & Push images
        run: |
          docker build -t $REGISTRY/api:latest -f docker/api.Dockerfile .
          docker push $REGISTRY/api:latest
          docker build -t $REGISTRY/worker:latest -f docker/worker.Dockerfile .
          docker push $REGISTRY/worker:latest
          docker build -t $REGISTRY/scheduler:latest -f docker/scheduler.Dockerfile .
          docker push $REGISTRY/scheduler:latest

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/kospintar
            docker compose pull
            docker compose up -d
            sleep 10
            curl -f http://localhost/health || docker compose rollback
```

---

## 19. Glossary

| Istilah | Definisi |
|---------|----------|
| **Owner** | Pemilik / pengelola properti kos |
| **Penghuni / Tenant** | Orang yang menyewa kamar kos |
| **Properti** | Satu bangunan kos (bisa punya banyak kamar) |
| **Tagihan / Bill** | Tagihan sewa bulanan per penghuni |
| **Tiket / Ticket** | Laporan komplain / gangguan dari penghuni |
| **Due date** | Tanggal jatuh tempo pembayaran (default: tgl 10) |
| **DP / Deposit** | Uang jaminan yang disimpan saat masuk kos |
| **Prorata** | Perhitungan proporsional (tagihan sebagian bulan) |
| **OKR** | Objective & Key Results — framework goal setting |
| **NPS** | Net Promoter Score — metrik loyalitas pengguna |
| **SLA** | Service Level Agreement — jaminan tingkat layanan |
| **PDP** | Perlindungan Data Pribadi — UU No. 27 Tahun 2022 |
| **Sen** | Satuan uang terkecil. Rp10.000 = 1.000.000 sen |
| **DLQ** | Dead Letter Queue — antrian pesan gagal setelah retry habis |
| **CRON** | Job scheduler di server untuk task berulang |
| **Snap** | Midtrans payment page (hosted, redirect) |
| **LXC** | Linux Containers — virtualisasi ringan di Proxmox |
| **PgBouncer** | Connection pooler untuk PostgreSQL |
