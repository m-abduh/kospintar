import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { Queue } from "bullmq";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient({ log: ["error", "warn"] });

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

const waQueue = new Queue("wa-send", { connection: redis });

const EVOLUTION_URL = process.env.EVOLUTION_URL || "http://localhost:8080";
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || "";
const PAY_SECRET = process.env.PAY_SECRET || "pay-secret-change-me-min-32-chars";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

async function acquireLock(lockKey: string): Promise<boolean> {
  const result = await redis.set(lockKey, "locked", "EX", 600, "NX");
  return result === "OK";
}

async function releaseLock(lockKey: string) {
  await redis.del(lockKey);
}

function createPayToken(billId: string, phone: string): string {
  return jwt.sign({ bill_id: billId, tenant_phone: phone }, PAY_SECRET, { expiresIn: "7d" });
}

// ========== AUTO BILLING ==========
// Cron: 25th of every month at 08:00 WIB (01:00 UTC)
async function autoBilling() {
  const lockKey = "cron:auto_billing";
  if (!(await acquireLock(lockKey))) {
    console.log("[Scheduler] auto_billing already running, skipping");
    return;
  }

  const log = await prisma.cron_logs.create({
    data: { job_name: "auto_billing", status: "running", started_at: new Date() },
  });

  try {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const periodLabel = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`;

    const activeTenants = await prisma.tenants.findMany({
      where: {
        status: "active",
        contract_end: { gte: nextMonth },
      },
      include: { property: { select: { is_active: true } } },
    });

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const tenant of activeTenants) {
      if (!tenant.property.is_active) { skipped++; continue; }

      const existing = await prisma.bills.findFirst({
        where: { tenant_id: tenant.id, period_label: periodLabel },
      });

      if (existing) { skipped++; continue; }

      try {
        const dueDay = Math.min(tenant.due_date_override || 10, 28);
        const dueDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), dueDay);

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
        created++;
      } catch (error) {
        console.error(`[Scheduler] Failed to create bill for tenant ${tenant.id}:`, error);
        failed++;
      }
    }

    await prisma.cron_logs.update({
      where: { id: log.id },
      data: {
        status: "completed",
        finished_at: new Date(),
        summary: { total: activeTenants.length, created, skipped, failed },
      },
    });

    console.log(`[Scheduler] auto_billing done: ${created} created, ${skipped} skipped, ${failed} failed`);
  } catch (error) {
    await prisma.cron_logs.update({
      where: { id: log.id },
      data: { status: "failed", finished_at: new Date(), error_message: String(error) },
    });
    console.error("[Scheduler] auto_billing failed:", error);
  } finally {
    await releaseLock(lockKey);
  }
}

// ========== WA REMINDER ==========
// Cron: daily at 08:00 WIB (01:00 UTC)
async function waReminder() {
  const lockKey = "cron:wa_reminder";
  if (!(await acquireLock(lockKey))) {
    console.log("[Scheduler] wa_reminder already running, skipping");
    return;
  }

  const log = await prisma.cron_logs.create({
    data: { job_name: "wa_reminder", status: "running", started_at: new Date() },
  });

  try {
    const now = new Date();
    const pendingBills = await prisma.bills.findMany({
      where: { status: "pending" },
      include: {
        tenant: true,
        property: { include: { wa_instances: true } },
      },
    });

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const bill of pendingBills) {
      if (!bill.tenant) { skipped++; continue; }

      const dueDate = new Date(bill.due_date);
      const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      let reminderType: string | null = null;
      if (diffDays === 7) reminderType = "H-7";
      else if (diffDays === 3) reminderType = "H-3";
      else if (diffDays === 1) reminderType = "H-1";
      else if (diffDays === -1) reminderType = "H+1";

      if (!reminderType) { skipped++; continue; }

      const waInstance = bill.property.wa_instances[0];
      if (!waInstance || waInstance.connection_status !== "connected") { skipped++; continue; }

      const month = bill.period_label;
      const amountRp = `Rp ${(bill.amount / 1_000_000).toLocaleString("id-ID")}`;
      const signedToken = createPayToken(bill.id, bill.tenant.phone);
      const payLink = `${APP_URL}/pay/${signedToken}`;

      let message = "";
      switch (reminderType) {
        case "H-7":
          message = `Tagihan kos kamu bulan ${month} udah terbit ya, ${amountRp}. Yuk segera bayar: ${payLink}`;
          break;
        case "H-3":
          message = `Kak ${bill.tenant.name}, tagihan ${month} ${amountRp} masih nunggak nih. Yuk bayar: ${payLink}`;
          break;
        case "H-1":
          message = `Besok deadline tagihan ${month}. Jangan lupa bayar ya: ${payLink}`;
          break;
        case "H+1":
          message = `Kak, tagihan sudah jatuh tempo. Segera bayar biar gak kendala: ${payLink}`;
          break;
      }

      try {
        const logEntry = await prisma.notification_logs.create({
          data: {
            bill_id: bill.id,
            type: "reminder",
            recipient_phone: bill.tenant.phone,
            message_body: message,
            status: "sent",
            sent_at: new Date(),
          },
        });

        await waQueue.add("send-message", {
          to: bill.tenant.phone,
          message,
          instanceName: waInstance.instance_name,
          notificationLogId: logEntry.id,
        }, {
          attempts: 3,
          backoff: { type: "exponential", delay: 30000 },
        });

        sent++;
      } catch (error) {
        console.error(`[Scheduler] Failed to queue reminder for bill ${bill.id}:`, error);
        failed++;
      }
    }

    await prisma.cron_logs.update({
      where: { id: log.id },
      data: {
        status: "completed",
        finished_at: new Date(),
        summary: { total: pendingBills.length, sent, skipped, failed },
      },
    });

    console.log(`[Scheduler] wa_reminder done: ${sent} sent, ${skipped} skipped, ${failed} failed`);
  } catch (error) {
    await prisma.cron_logs.update({
      where: { id: log.id },
      data: { status: "failed", finished_at: new Date(), error_message: String(error) },
    });
    console.error("[Scheduler] wa_reminder failed:", error);
  } finally {
    await releaseLock(lockKey);
  }
}

// ========== EXPIRE STALE PAYMENTS ==========
// Cron: every 6 hours
async function expireStalePayments() {
  const lockKey = "cron:expire_stale_payments";
  if (!(await acquireLock(lockKey))) return;

  const log = await prisma.cron_logs.create({
    data: { job_name: "expire_stale_payments", status: "running", started_at: new Date() },
  });

  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const staleBills = await prisma.bills.findMany({
      where: {
        status: "pending",
        midtrans_order_id: { not: null },
        created_at: { lt: twentyFourHoursAgo },
      },
    });

    let expired = 0;
    let checked = 0;

    for (const bill of staleBills) {
      if (!bill.midtrans_order_id) continue;
      checked++;

      try {
        const midtransRes = await fetch(
          `${process.env.MIDTRANS_SNAP_URL || "https://app.sandbox.midtrans.com/api/v1"}/transactions/${bill.midtrans_order_id}/status`,
          {
            headers: {
              Authorization: `Basic ${Buffer.from((process.env.MIDTRANS_SERVER_KEY || "") + ":").toString("base64")}`,
            },
          }
        );

        const data = await midtransRes.json() as any;

        if (data.transaction_status === "expire") {
          await prisma.bills.update({
            where: { id: bill.id },
            data: { status: "expired" },
          });
          expired++;
        } else if (data.transaction_status === "settlement" || data.transaction_status === "capture") {
          await prisma.bills.update({
            where: { id: bill.id },
            data: { status: "paid", paid_at: new Date() },
          });
        }
      } catch (error) {
        console.error(`[Scheduler] Failed to check bill ${bill.id}:`, error);
      }
    }

    await prisma.cron_logs.update({
      where: { id: log.id },
      data: {
        status: "completed",
        finished_at: new Date(),
        summary: { checked, expired },
      },
    });

    console.log(`[Scheduler] expire_stale_payments done: ${checked} checked, ${expired} expired`);
  } catch (error) {
    await prisma.cron_logs.update({
      where: { id: log.id },
      data: { status: "failed", finished_at: new Date(), error_message: String(error) },
    });
    console.error("[Scheduler] expire_stale_payments failed:", error);
  } finally {
    await releaseLock(lockKey);
  }
}

// ========== AUTO-CLOSE TICKETS ==========
// Cron: daily at 02:00 WIB (19:00 UTC prev day)
async function autoCloseTickets() {
  const lockKey = "cron:auto_close_tickets";
  if (!(await acquireLock(lockKey))) return;

  const log = await prisma.cron_logs.create({
    data: { job_name: "auto_close_tickets", status: "running", started_at: new Date() },
  });

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await prisma.tickets.updateMany({
      where: {
        status: "resolved",
        updated_at: { lt: sevenDaysAgo },
      },
      data: {
        status: "closed",
        closed_at: new Date(),
      },
    });

    await prisma.cron_logs.update({
      where: { id: log.id },
      data: {
        status: "completed",
        finished_at: new Date(),
        summary: { auto_closed: result.count },
      },
    });

    console.log(`[Scheduler] auto_close_tickets done: ${result.count} tickets auto-closed`);
  } catch (error) {
    await prisma.cron_logs.update({
      where: { id: log.id },
      data: { status: "failed", finished_at: new Date(), error_message: String(error) },
    });
    console.error("[Scheduler] auto_close_tickets failed:", error);
  } finally {
    await releaseLock(lockKey);
  }
}

// ========== WA HEALTH CHECK ==========
// Cron: every 5 minutes
async function waHealthCheck() {
  const lockKey = "cron:wa_health_check";
  if (!(await acquireLock(lockKey))) return;

  try {
    const instances = await prisma.wa_instances.findMany({
      where: { connection_status: "connected" },
    });

    for (const instance of instances) {
      try {
        const res = await fetch(`${EVOLUTION_URL}/instance/connectionState/${instance.instance_name}`, {
          headers: { apikey: EVOLUTION_KEY },
        });

        const data = await res.json() as any;
        const newStatus = data.state === "open" ? "connected" : "disconnected";

        if (newStatus !== instance.connection_status) {
          await prisma.wa_instances.update({
            where: { id: instance.id },
            data: {
              connection_status: newStatus as any,
              last_connected_at: newStatus === "connected" ? new Date() : instance.last_connected_at,
            },
          });
          console.log(`[Scheduler] WA ${instance.instance_name} status changed: ${instance.connection_status} → ${newStatus}`);
        }
      } catch (error) {
        console.error(`[Scheduler] WA health check failed for ${instance.instance_name}:`, error);
      }
    }
  } catch (error) {
    console.error("[Scheduler] wa_health_check failed:", error);
  } finally {
    await releaseLock(lockKey);
  }
}

// ========== REGISTER CRON JOBS ==========
cron.schedule("0 1 25 * *", autoBilling);       // 25th at 08:00 WIB
cron.schedule("0 1 * * *", waReminder);          // daily at 08:00 WIB
cron.schedule("0 */6 * * *", expireStalePayments); // every 6 hours
cron.schedule("0 19 * * *", autoCloseTickets);   // daily at 02:00 WIB
cron.schedule("*/5 * * * *", waHealthCheck);     // every 5 minutes

console.log("[Scheduler] Started. Cron jobs registered:");
console.log("  - auto_billing: 25th of every month at 08:00 WIB");
console.log("  - wa_reminder: daily at 08:00 WIB");
console.log("  - expire_stale_payments: every 6 hours");
console.log("  - auto_close_tickets: daily at 02:00 WIB");
console.log("  - wa_health_check: every 5 minutes");

async function shutdown() {
  console.log("[Scheduler] Shutting down...");
  cron.destroy();
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
