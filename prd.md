# PRD — Kospintar MVP v1.0

| Metadata | |
|----------|-|
| **Status** | Draft v1 |
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
| **WA delivery rate** | >95% pesan WA terkirim | Evolution API callback |
| **Ticket response time** | <6 jam respon pertama owner | DB (`tickets.created_at` → `updated_at`) |
| **Midtrans conversion** | >70% click-to-pay berhasil | Midtrans dashboard + `payment_logs` |
| **NPS (post-MVP)** | >40 | Survey in-app bulan 3 |
| **Churn** | <10% per bulan | Billing subscription |

---

## 4. Fitur — Prioritas MVP

### LEGEND
- **P0** — Blocker, MVP wajib ada
- **P1** — Important, MVP harus ada
- **P2** — Nice to have, bisa dikejar di v1.1 / v2

| ID | Fitur | Prioritas | Estimasi |
|----|-------|-----------|----------|
| F-01 | Register & Login (email + password) | P0 | 3 hari |
| F-02 | CRUD Properti | P0 | 3 hari |
| F-03 | CRUD Penghuni | P0 | 3 hari |
| F-04 | Hubungkan WhatsApp (QR) | P0 | 3 hari |
| F-05 | Auto-billing bulanan (cron) | P1 | 4 hari |
| F-06 | WA reminder otomatis (H-7, H-3, H-1) | P1 | 3 hari |
| F-07 | Generate link bayar Midtrans | P1 | 4 hari |
| F-08 | Webhook Midtrans → update status | P0 | 3 hari |
| F-09 | Komplain WA → tiket otomatis | P1 | 4 hari |
| F-10 | Dashboard keuangan sederhana | P1 | 3 hari |
| F-11 | Kirim pesan WA dari dashboard | P2 | 2 hari |
| F-12 | Filter & search properti/penghuni/tagihan | P2 | 2 hari |

### WILL NOT DO (untuk MVP)
- AI Leasing Agent → v3
- Auto-posting WA Status → v2
- Consolidated multi-property report → v2
- Role management / multi-user → v2
- Mobile app (native) → v2 (responsive web cukup untuk MVP)
- Denda otomatis → v1.1

---

## 5. User Stories & Acceptance Criteria

### F-01: Register & Login
```
Sebagai owner, saya ingin daftar dengan email & password agar 
bisa akses dashboard.
```

**AC:**
- Register: input nama, email, password, nomor HP → sukses → redirect ke dashboard
- Validasi: email unik, password min 8 karakter, nomor HP valid (62xx)
- Login: input email + password
- Session: JWT, expire 7 hari, auto-refresh
- Lupa password: kirim link reset via email (opsional MVP — bisa skip)
- Logout: hapus JWT

### F-02: CRUD Properti
```
Sebagai owner, saya ingin tambah/edit/hapus properti agar 
bisa manage semua kos saya.
```

**AC:**
- List properti: card view, tiap card: nama, alamat, jumlah kamar, status (aktif/nonaktif)
- Tambah: nama, alamat, jumlah kamar, foto (opsional)
- Edit: semua field bisa diubah, efek ke penghuni sesuai (room number validation)
- Hapus: soft delete. Hanya bisa jika tidak ada penghuni aktif
- List pagination (10 per page) + search

### F-03: CRUD Penghuni
```
Sebagai owner, saya ingin data penghuni tercatat agar 
tagihan bisa diterbitkan otomatis.
```

**AC:**
- Tambah: nama, nomor HP, nomor kamar, harga sewa, deposit, tanggal kontrak mulai & selesai, upload foto KTP (opsional)
- Nomor kamar unik per properti
- Edit: ubah kamar, harga sewa (berlaku bulan berikutnya), perpanjang kontrak
- Check-out: set status 'checkout', kamara tersedia kembali
- List: filter properti, search nama, filter status (aktif/checkout)
- Deposit tracking: sisa deposit setelah potongan

### F-04: Hubungkan WhatsApp
```
Sebagai owner, saya ingin menghubungkan nomor WA kos saya 
agar bisa kirim reminder & terima komplain otomatis.
```

**AC:**
- Tiap properti punya koneksi WA sendiri
- Flow: input nomor HP properti → klik "Hubungkan WA" → QR code muncul di dashboard
- QR code: refresh tiap 30 detik, auto-close setelah connect
- Status: QR expired, connected, disconnected
- Disconnect handling: notifikasi ke dashboard + retry otomatis 3x
- Reconnect: klik "Hubungkan Ulang" → QR baru
- Hanya 1 instance WA per properti

### F-05: Auto-billing Bulanan
```
Sebagai owner, saya ingin tagihan terbit otomatis setiap 
bulan tanpa harus entry manual.
```

**AC:**
- Cron job: tiap tanggal 25 jam 08:00 WIB generate tagihan bulan depan
- Yang dibuatkan tagihan: penghuni status aktif, kontrak masih berlaku
- Nominal: `harga_sewa` dari tabel tenants
- Jika tagihan bulan ini sudah ada → skip (idempotent)
- Status awal: `pending`
- Batch: log jumlah tagihan yang berhasil & gagal tiap siklus
- Jika cron gagal → retry 3x, kirim alert ke owner (WA)

### F-06: WA Reminder Otomatis
```
Sebagai owner, saya ingin penghuni otomatis diingatkan via 
WA agar bayar tepat waktu.
```

**AC:**
- Timeline reminder (relative ke `due_date`):
  - H-7 → "Tagihan kos kamu bulan [bulan] udah terbit ya, Rp [amount]. Bayar sebelum [due_date] biar gak kena denda."
  - H-3 → "Kak [nama], tagihan [bulan] Rp [amount] masih nunggak nih. Yuk bayar: [link]"
  - H-1 → "Besok deadline tagihan [bulan]. Jangan lupa bayar ya: [link]. Malam ini kita kirimkan summary."
  - H+1 → "Kak, tagihan sudah jatuh tempo. Segera bayar biar gak kendala ya: [link]"
- Jika status `paid` sebelum H-7 → skip semua reminder
- Link di WA: Midtrans payment link (QRIS/VA)
- Setiap reminder tercatat di `notification_logs`
- Gagal kirim WA → retry 2x, log error

### F-07: Generate Link Bayar Midtrans
```
Sebagai penghuni, saya ingin klik link dari WA dan bayar 
langsung via QRIS/VA tanpa ribet.
```

**AC:**
- Endpoint: `POST /api/bills/:id/pay`
- Response: `redirect_url` (Midtrans Snap page)
- Payment methods: QRIS, Virtual Account (BCA, Mandiri, BNI, BRI), convenience store (Indomaret/Alfamart)
- Status: `pending`, `settlement` (lunas), `expire`, `deny`, `cancel`
- Midtrans transaction_id disimpan di `payment_logs`
- Snap page: embed di browser, bukan native

### F-08: Webhook Midtrans → Update Status
```
Sebagai system, saya ingin notifikasi pembayaran dari Midtrans 
otomatis update status tagihan.
```

**AC:**
- Endpoint: `POST /api/bills/webhook/midtrans`
- Validate signature: `sha512(order_id + status_code + gross_amount + server_key)`
- Status mapping:
  - `settlement` / `capture` → bills.status = `paid`
  - `expire` → bills.status = `expired`
  - `deny` / `cancel` → no change (catat log)
- Idempotent: jika `transaction_id` sudah diproses, skip
- Jika status jadi paid:
  - update `bills.paid_at = now()`
  - kirim WA notifikasi lunas ke penghuni: "Pembayaran kamu sudah kami terima. Terima kasih!"
- Log semua raw response di `payment_logs`

### F-09: Komplain WA → Tiket
```
Sebagai penghuni, saya ingin kirim komplain via WA dan 
tercatat otomatis tanpa perlu nelpon owner.
```

**AC:**
- Webhook Evolution API → back end auto-create ticket
- Incoming message dideteksi sebagai komplain jika:
  - Nomor pengirim terdaftar sebagai penghuni aktif
  - Bukan nomor owner/admin
- Auto-reply: "Laporan kamu udah kami terima ya, sebentar lagi kami cek. Kode tiket: #TKT123"
- Ticket fields: title (ambil dari pesan pertama), description, status=open, source=wa
- Priority: auto (jika ada keyword "darurat/mendesak/banjir/kebakaran") → priority=high
- Jika nomor tidak dikenal → auto-reply: "Halo, untuk informasi lebih lanjut silakan hubungi pengelola."
- Ticket muncul di dashboard owner secara real-time

### F-10: Dashboard Keuangan
```
Sebagai owner, saya ingin lihat rekap pemasukan properti 
tanpa harus hitung manual.
```

**AC:**
- Ringkasan per properti:
  - Total penghuni aktif
  - Total kamar terisi / total kamar (% okupansi)
  - Pemasukan bulan ini (total tagihan yang sudah lunas)
  - Pemasukan bulan lalu (perbandingan)
  - Tagihan outstanding (pending tunggakan)
  - Rata-rata pembayaran per hari
- Grafik: line chart pemasukan 6 bulan terakhir
- Tabel tagihan: filter berdasarkan status, properti, bulan
- Export: CSV (opsional MVP)

### F-11: Kirim Pesan WA dari Dashboard
```
Sebagai owner, saya ingin kirim pesan ke penghuni langsung 
dari dashboard tanpa buka WA.
```

**AC:**
- Pilih penghuni → tulis pesan → kirim
- Template cepat: "Tagihan [bulan]", "Pengingat kontrak berakhir", "Pemberitahuan perbaikan"
- Riwayat chat: list pesan terkirim per penghuni
- Forward komplain ke teknisi: owner bisa reply dari dashboard dan terkirim ke WA penghuni

---

## 6. Functional Requirements

### 6.1 Autentikasi & Authorisasi
- JWT access token (7 hari expire)
- Refresh token (opsional — bisa skip MVP)
- Middleware: verify JWT di semua endpoint kecuali `/api/auth/*`, `/api/bills/webhook/*`, `/api/wa/webhook/*`
- Rate limit: 5x gagal login dalam 15 menit → lockout 15 menit
- Password min 8 karakter, wajib kombinasi huruf+angka

### 6.2 Multi-property
- Semua resource (tenants, bills, tickets) terikat ke `property_id`
- Owner hanya bisa akses resource milik propertinya sendiri
- Filter global: pilih properti → tampilkan data untuk properti itu

### 6.3 WhatsApp
- 1 instance Evolution API per properti
- QR generation: via Evolution API `POST /instance/create`
- QR polling: `GET /instance/qr/{name}` → return base64 QR
- Cek status: `GET /instance/connectionState/{name}`
- Kirim pesan: `POST /message/sendText`
- Webhook incoming: `POST /webhook/{instanceName}` → terima pesan masuk
- Rate limit WA: max 50 pesan per menit per instance

### 6.4 Midtrans
- Snap transaction: `POST /snap` charge
- Payment channel: QRIS (utama), Virtual Account (backup)
- Webhook: validasi signature, response mapping
- Expire payment link: 24 jam
- Handle duplikat callback: idempotent key = `transaction_id`

### 6.5 Billing Engine
- Cron schedule: `0 8 25 * *` (tiap bulan tgl 25 jam 08:00)
- Generate billing untuk bulan berikutnya
- Idempotent: cek `(tenant_id, period_label)` sebelum insert
- Jika tenant checkout di tengah bulan → prorata (opsional MVP — skip, generate full month)
- Manual override: owner bisa buat tagihan di luar schedule

### 6.6 Notification Log
Setiap notifikasi WA tercatat di `notification_logs`:
- `id, bill_id, ticket_id, type (reminder/payment/ticket), recipient_phone, status (sent/failed), error_message, sent_at`

---

## 7. Non-Functional Requirements

| Area | Requirement |
|------|------------|
| **Availability** | Uptime 99.5% (max ~3.5 jam down/bulan). WA service boleh best-effort. |
| **Performance** | API response <500ms (P95). Dashboard load <3 detik. |
| **Security** | JWT secret min 32 char. Password di-hash bcrypt. HTTPS wajib. CORS restrict ke frontend domain. |
| **Data** | Backup DB harian otomatis (pg_dump), retensi 7 hari. |
| **Monitoring** | Sentry (error tracking). WA delivery monitoring dashboard internal. |
| **Scalability** | 50 property per server (MVP cukup single instance). PostgreSQL bisa naik pakai connection pooling (PgBouncer) nanti. |
| **Mobile** | Web responsive. No native app needed. Mobile-first design (target persona Rina). |
| **Audit Log** | Semua perubahan data critical (create/update/delete tenant, bill, property) tercatat di `audit_logs`. |

---

## 8. Arsitektur

```
                     ┌──────────────┐
                     │   Browser     │
                     │  (Next.js)    │
                     └──────┬───────┘
                            │ HTTP (JSON)
                     ┌──────▼───────┐
                     │  Express API  │
                     │   :3001       │
                     └──┬───────┬───┘
                        │       │
               ┌────────▼─┐  ┌──▼──────────┐
               │PostgreSQL │  │  Redis      │
               │  :5432    │  │ (caching)   │
               └──────────┘  └─────────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
   ┌──────▼────┐ ┌──────▼────┐ ┌──────▼──────┐
   │ Evolution  │ │  Midtrans  │ │  SMTP/      │
   │ API (WA)   │ │  API       │ │  Resend     │
   │:8080       │ │            │ │  (email)    │
   └────────────┘ └────────────┘ └─────────────┘
```

### Catatan Arsitektur
- **Redis**: opsional di MVP. Ditambahkan untuk queue WA sending dan session store
- **Email**: opsional MVP. Reset password bisa via WA dulu
- **WA Sending Queue**: WA reminder jangan blocking — masuk antrian lalu diproses async
- **Monolith first**: backend satu service dulu. Pisah ke microservice kalau perlu scale

---

## 9. Data Model

### 9.1 Entity Relationship (MVP)

```
users 1──N properties
properties 1──N tenants
properties 1──N wa_instances
properties 1──N tickets
tenants 1──N bills
bills 1──1 payment_logs
tickets N──1 tenants (optional)
```

### 9.2 Schema Detail

#### `users`
| Kolom | Tipe | Notes |
|-------|------|-------|
| id | UUID | PK |
| name | VARCHAR(100) | |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | bcrypt |
| phone | VARCHAR(20) | Nomor owner, format 62xx |
| role | VARCHAR(20) | `owner` saja untuk MVP |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `properties`
| Kolom | Tipe | Notes |
|-------|------|-------|
| id | UUID | PK |
| owner_id | UUID | FK → users.id |
| name | VARCHAR(200) | |
| address | TEXT | |
| total_rooms | INTEGER | Jumlah total kamar |
| photo_url | VARCHAR(500) | Opsional |
| is_active | BOOLEAN | Default true |
| deleted_at | TIMESTAMPTZ | Soft delete |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `tenants`
| Kolom | Tipe | Notes |
|-------|------|-------|
| id | UUID | PK |
| property_id | UUID | FK → properties.id |
| name | VARCHAR(100) | |
| phone | VARCHAR(20) | Format 62xx |
| room_number | VARCHAR(20) | UNIQUE per property |
| rent_amount | DECIMAL(12,0) | Rupiah |
| deposit | DECIMAL(12,0) | |
| contract_start | DATE | |
| contract_end | DATE | |
| status | VARCHAR(20) | `active`, `checkout` |
| ktp_url | VARCHAR(500) | Opsional |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `bills`
| Kolom | Tipe | Notes |
|-------|------|-------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants.id |
| property_id | UUID | FK → properties.id |
| amount | DECIMAL(12,0) | |
| due_date | DATE | |
| period_label | VARCHAR(20) | e.g. `2026-08` |
| status | VARCHAR(20) | `pending`, `paid`, `expired`, `void` |
| paid_at | TIMESTAMPTZ | Null jika belum bayar |
| midtrans_order_id | VARCHAR(100) | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| UNIQUE | (tenant_id, period_label) | |

#### `payment_logs`
| Kolom | Tipe | Notes |
|-------|------|-------|
| id | UUID | PK |
| bill_id | UUID | FK → bills.id |
| midtrans_transaction_id | VARCHAR(100) | |
| midtrans_order_id | VARCHAR(100) | |
| status | VARCHAR(30) | `pending`, `settlement`, `expire`, `deny`, `cancel` |
| raw_response | JSONB | Full response dari Midtrans |
| created_at | TIMESTAMPTZ | |

#### `tickets`
| Kolom | Tipe | Notes |
|-------|------|-------|
| id | UUID | PK |
| property_id | UUID | FK → properties.id |
| tenant_id | UUID | FK → tenants.id (nullable — bisa dari non-tenant) |
| title | VARCHAR(200) | |
| description | TEXT | |
| status | VARCHAR(20) | `open`, `in_progress`, `resolved`, `closed` |
| priority | VARCHAR(10) | `low`, `medium`, `high` |
| source | VARCHAR(20) | `wa`, `manual` |
| wa_message_id | VARCHAR(100) | Dari Evolution API |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `wa_instances`
| Kolom | Tipe | Notes |
|-------|------|-------|
| id | UUID | PK |
| property_id | UUID | FK → properties.id |
| instance_name | VARCHAR(100) | Nama instance di Evolution |
| phone_number | VARCHAR(20) | Nomor WA properti |
| qr_code | TEXT | Base64 QR terakhir |
| connection_status | VARCHAR(20) | `connected`, `disconnected`, `expired` |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `notification_logs`
| Kolom | Tipe | Notes |
|-------|------|-------|
| id | UUID | PK |
| bill_id | UUID | FK → bills.id (nullable) |
| ticket_id | UUID | FK → tickets.id (nullable) |
| type | VARCHAR(20) | `reminder`, `payment_confirmation`, `ticket_reply` |
| recipient_phone | VARCHAR(20) | |
| message_body | TEXT | |
| status | VARCHAR(20) | `sent`, `failed` |
| error_message | TEXT | |
| sent_at | TIMESTAMPTZ | |

#### `audit_logs`
| Kolom | Tipe | Notes |
|-------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| action | VARCHAR(50) | `create_tenant`, `update_bill`, dll |
| entity_type | VARCHAR(50) | `tenant`, `bill`, `property` |
| entity_id | UUID | |
| old_data | JSONB | |
| new_data | JSONB | |
| ip_address | VARCHAR(50) | |
| created_at | TIMESTAMPTZ | |

### 9.3 Indexes
- `idx_bills_tenant_status_period` ON bills(tenant_id, status, period_label)
- `idx_bills_property_due_date` ON bills(property_id, due_date)
- `idx_tenants_property_status` ON tenants(property_id, status)
- `idx_tickets_property_status` ON tickets(property_id, status)
- `idx_payment_logs_bill` ON payment_logs(bill_id)

---

## 10. API Endpoints

### 10.1 Auth
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | /api/auth/register | No | Register owner |
| POST | /api/auth/login | No | Login, return JWT |
| GET | /api/auth/me | Yes | Profil owner |

### 10.2 Properties
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /api/properties | Yes | List milik owner |
| GET | /api/properties/:id | Yes | Detail + stats (penghuni aktif, okupansi) |
| POST | /api/properties | Yes | Tambah properti |
| PUT | /api/properties/:id | Yes | Edit properti |
| DELETE | /api/properties/:id | Yes | Soft delete (cek tidak ada tenant aktif) |

### 10.3 Tenants
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /api/tenants | Yes | List, filter by property_id & status |
| GET | /api/tenants/:id | Yes | Detail + history tagihan |
| POST | /api/tenants | Yes | Tambah |
| PUT | /api/tenants/:id | Yes | Edit, ganti kamar, perpanjang kontrak |
| DELETE | /api/tenants/:id | Yes | Soft delete (set status=checkout) |

### 10.4 Bills
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /api/bills | Yes | List, filter property & status & period |
| GET | /api/bills/:id | Yes | Detail termasuk payment_logs |
| POST | /api/bills | Yes | Manual override — buat tagihan di luar cron |
| POST | /api/bills/:id/pay | Yes | Generate Midtrans Snap URL, return redirect_url |
| POST | /api/bills/webhook/midtrans | No (IP whitelist) | Webhook dari Midtrans |

### 10.5 Tickets
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /api/tickets | Yes | List, filter property & status & priority |
| GET | /api/tickets/:id | Yes | Detail + chat history |
| POST | /api/tickets | Yes | Buat manual dari dashboard |
| PUT | /api/tickets/:id | Yes | Update status (open → in_progress → resolved) |
| POST | /api/tickets/:id/reply | Yes | Reply owner → forward ke WA tenant |

### 10.6 WhatsApp
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | /api/wa/connect | Yes | Init instance Evolution, return QR |
| GET | /api/wa/qr/:propertyId | Yes | QR code terbaru |
| GET | /api/wa/status/:propertyId | Yes | Status koneksi |
| POST | /api/wa/send | Yes | Kirim pesan manual |
| POST | /api/wa/webhook/:instanceName | No | Webhook dari Evolution (incoming message, delivery report) |
| POST | /api/wa/disconnect/:propertyId | Yes | Putus koneksi WA |

### 10.7 Dashboard
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /api/dashboard/summary | Yes | Ringkasan keuangan per properti + okupansi |
| GET | /api/dashboard/revenue | Yes | Data grafik 6 bulan, filter property |

### 10.8 Notifications (internal)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /api/notifications | Yes | List notifikasi terakhir (reminder, pembayaran, tiket) |
| PUT | /api/notifications/:id/read | Yes | Mark as read |

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
| `/tenants/[id]` | Detail penghuni | Info + riwayat tagihan |
| `/tenants/[id]/edit` | Edit penghuni | Form |
| `/bills` | List tagihan | Table + filter status, properti, periode |
| `/bills/[id]` | Detail tagihan | Info + link bayar + payment logs |
| `/tickets` | List tiket | Table + filter status & prioritas |
| `/tickets/[id]` | Detail tiket | Info + reply form |
| `/wa/[propertyId]` | Halaman koneksi WA | QR code + status + tombol disconnect |
| `/settings` | Profil owner | Edit nama, email, password |

### 11.2 Mobile-first Design
- Navigasi: bottom tab bar di mobile, sidebar di desktop
- Cards bukan tables di mobile view
- Touch-friendly: tombol min 44x44px
- WA-style chat untuk reply tiket

### 11.3 Empty States
- Belum ada properti → ilustrasi + CTA "Tambah Properti Pertama"
- Belum ada penghuni → "Tambahkan penghuni agar tagihan otomatis"
- Belum ada tagihan → "Tagihan akan muncul setelah cron berjalan"
- Belum ada tiket → "Komplain WA akan muncul di sini"
- WA belum terhubung → tombol besar "Hubungkan WhatsApp"

---

## 12. Error Handling & Edge Cases

| Skenario | Penanganan |
|----------|-----------|
| Midtrans webhook duplikat | Idempotent key: `transaction_id`. Cek di `payment_logs` sebelum insert. |
| Evolution API down | Retry 3x dengan exponential backoff. Log error + alert ke owner. |
| QR code expired | Auto-refresh tiap 30 detik. Tampilkan "QR expired, refresh..." |
| WA instance terputus | Cron cek tiap 5 menit. Notifikasi dashboard. Owner bisa reconnect manual. |
| Gagal kirim WA | Retry 2x. Catat di `notification_logs.status=failed` |
| Nomor penghuni tidak valid | Validasi format 62xx di frontend & backend. |
| Tagihan duplikat | UNIQUE constraint (tenant_id, period_label). Return error 409. |
| Pembayaran lebih | Midtrans notifikasi settlement untuk transaksi double? Validasi jumlah. |
| Hapus properti dengan tenant aktif | Reject with 400: "Hapus atau checkout semua penghuni dulu." |
| Session expired | 401 → redirect ke login. Jangan lost data form. |
| Cron overlap | Pastikan cron gak jalan lagi kalau masih ada yang jalan. Lock DB. |
| Waktu server tidak sinkron | Semua timestamp pake UTC. Tampilkan di UI sesuai timezone browser. |

---

## 13. Monetization Strategy

### MVP: Free Tier (build traction dulu)
- Semua fitur MVP gratis
- Batas: maks 3 properti per akun
- Batas: maks 50 penghuni per properti
- WA: 500 pesan gratis/bulan

### v2 Target: Freemium + Subscription
| Tier | Harga | Fitur |
|------|-------|-------|
| **Free** | Rp0 | 1 properti, 20 penghuni, WA terbatas |
| **Starter** | Rp49k/bulan | 5 properti, unlimited tenant, all core features |
| **Business** | Rp149k/bulan | 20 properti, AI Leasing Agent, multi-user, export |
| **Enterprise** | Custom | Unlimited, dedicated support, on-premise |

---

## 14. Roadmap

### Phase 1 — MVP (v1.0) — [Est: 6–8 minggu]
| Sprint | Fokus |
|--------|-------|
| Sprint 1 | Setup project (FE + BE + DB + deploy). Auth. CRUD Properti & Tenants. |
| Sprint 2 | WA Connect (QR). Auto-billing + cron. |
| Sprint 3 | WA reminder. Midtrans payment + webhook. |
| Sprint 4 | Komplain → tiket. Dashboard keuangan. Bug fixing. Launch. |

### Phase 2 — v1.1 (4 minggu post-MVP)
- Denda otomatis telat bayar
- Export laporan keuangan (CSV/PDF)
- Multi-user (tambah admin properti)
- Auto-posting WA Status

### Phase 3 — v2 (8 minggu post-MVP)
- Consolidated multi-property report
- AI Leasing Agent (balas leads otomatis)
- Advanced analytics
- Role management

---

## 15. Risk & Mitigation

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Evolution API tidak stabil | WA gagal kirim | Fallback: dashboard tetap berfungsi. WA failure visible + retry. Cari provider alternatif (WATI, Fonnte). |
| Midtrans settlement delayed | Status paid telat | Webhook + polling tiap 5 menit cek status transaksi pending. |
| Owner gaptek — susah setup WA QR | Churn / gagal onboard | Video tutorial 60 detik. Onboarding wizard step-by-step. Support WA. |
| Penghuni tidak punya smartphone WA | Reminder tidak terbaca | Jangkau via SMS gateway (opsional). Cetak invoice. |
| Regulasi PDP (UU Perlindungan Data) | Denda / hukum | Simpan data seminimal mungkin. Enkripsi data sensitif. Pengguna hapus data sendiri. |
| Kompetitor copy fitur | Kehilangan keunggulan | Fokus ke distribution (owner kos WA groups) + UX simpel. Bikin ekosistem (marketplace properti). |

---

## 16. Glossary

| Istilah | Definisi |
|---------|----------|
| **Owner** | Pemilik / pengelola properti kos |
| **Penghuni / Tenant** | Orang yang menyewa kamar kos |
| **Properti** | Satu bangunan kos (bisa punya banyak kamar) |
| **Tagihan / Bill** | Tagihan sewa bulanan per penghuni |
| **Tiket / Ticket** | Laporan komplain / gangguan dari penghuni |
| **Due date** | Tanggal jatuh tempo pembayaran |
| **OKR** | Objective & Key Results — framework goal setting |
| **NPS** | Net Promoter Score — metrik loyalitas pengguna |
| **SLA** | Service Level Agreement — jaminan tingkat layanan |
| **PDP** | Perlindungan Data Pribadi — UU No. 27 Tahun 2022 |
| **CRON** | Job scheduler di server untuk task berulang |
| **Prorata** | Perhitungan proporsional (tagihan sebagian bulan) |

---

## 17. Referensi & Lampiran

- **Design System**: [Figma — (coming soon)]
- **API Contract**: [Postman collection — (coming soon)]
- **Evolution API Docs**: https://docs.evolution-api.com
- **Midtrans Docs**: https://docs.midtrans.com
- **Database Migration Tool**: node-pg-migrate / Prisma (opsional)
- **Deployment**: Railway / DigitalOcean / VPS (single VM)
