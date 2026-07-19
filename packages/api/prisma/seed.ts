import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");

  const password_hash = await bcrypt.hash("Kospintar1", 10);

  const owner = await prisma.users.upsert({
    where: { email: "owner@kospintar.com" },
    update: {},
    create: {
      name: "Budi Owner",
      email: "owner@kospintar.com",
      password_hash,
      phone: "6281234567890",
      role: "owner",
    },
  });

  const property = await prisma.properties.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      owner_id: owner.id,
      name: "Kos Bahagia",
      address: "Jl. Merdeka No. 10, Jakarta",
      total_rooms: 5,
      is_active: true,
    },
  });

  const property2 = await prisma.properties.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      owner_id: owner.id,
      name: "Kos Sejahtera",
      address: "Jl. Sudirman No. 25, Bandung",
      total_rooms: 3,
      is_active: true,
    },
  });

  const tenants = [
    { name: "Siti Rahayu", phone: "6281211111111", room_number: "A01", rent_amount: 1_500_000_00 },
    { name: "Ahmad Fauzi", phone: "6281222222222", room_number: "A02", rent_amount: 1_500_000_00 },
    { name: "Dewi Lestari", phone: "6281233333333", room_number: "B01", rent_amount: 2_000_000_00 },
    { name: "Rudi Hartono", phone: "6281244444444", room_number: "C01", rent_amount: 1_200_000_00 },
    { name: "Maya Indah", phone: "6281255555555", room_number: "A03", rent_amount: 1_500_000_00 },
    { name: "Bagus Putra", phone: "6281266666666", room_number: "A01", rent_amount: 1_200_000_00 },
  ];

  for (const t of tenants) {
    const propId = t.room_number === "C01" ? property2.id : property.id;
    await prisma.tenants.upsert({
      where: { property_id_room_number: { property_id: propId, room_number: t.room_number } },
      update: {},
      create: {
        property_id: propId,
        name: t.name,
        phone: t.phone,
        room_number: t.room_number,
        rent_amount: t.rent_amount,
        deposit: t.rent_amount,
        contract_start: new Date("2026-01-01"),
        contract_end: new Date("2026-12-31"),
        status: "active",
      },
    });
  }

  // Generate bills for current month
  const now = new Date();
  const periodLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const dueDate = new Date(now.getFullYear(), now.getMonth(), 10);

  const activeTenants = await prisma.tenants.findMany({ where: { status: "active" } });

  for (const tenant of activeTenants) {
    const existingBill = await prisma.bills.findFirst({
      where: { tenant_id: tenant.id, period_label: periodLabel },
    });
    if (!existingBill) {
      await prisma.bills.create({
        data: {
          tenant_id: tenant.id,
          property_id: tenant.property_id,
          amount: tenant.rent_amount,
          due_date: dueDate,
          period_label: periodLabel,
          status: "pending",
        },
      });
    }
  }

  // Message templates
  const templates = [
    { property_id: null, name: "reminder_h7", body: "Tagihan kos kamu bulan {period} udah terbit ya, {amount}. Yuk segera bayar: {link}" },
    { property_id: null, name: "reminder_h3", body: "Kak {name}, tagihan {period} {amount} masih nunggak nih. Yuk bayar: {link}" },
    { property_id: null, name: "reminder_h1", body: "Besok deadline tagihan {period}. Jangan lupa bayar ya: {link}" },
    { property_id: null, name: "reminder_h+1", body: "Kak, tagihan sudah jatuh tempo. Segera bayar biar gak kendala: {link}" },
    { property_id: null, name: "payment_confirmation", body: "Pembayaran {amount} untuk tagihan {period} sudah kami terima. Terima kasih!" },
  ];

  for (const t of templates) {
    await prisma.message_templates.upsert({
      where: { property_id_name: { property_id: t.property_id, name: t.name } },
      update: {},
      create: { property_id: t.property_id, name: t.name, body: t.body },
    });
  }

  console.log("Seeding done!");
  console.log(`  - 1 owner (owner@kospintar.com / Kospintar1)`);
  console.log(`  - 2 properties`);
  console.log(`  - ${activeTenants.length} tenants`);
  console.log(`  - ${activeTenants.length} bills for ${periodLabel}`);
  console.log(`  - 5 message templates`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
