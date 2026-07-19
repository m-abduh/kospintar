import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { Queue } from "bullmq";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
});

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

const MAIL_HOST = process.env.SMTP_HOST || "";
const MAIL_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const MAIL_USER = process.env.SMTP_USER || "";
const MAIL_PASS = process.env.SMTP_PASS || "";
const MAIL_FROM = process.env.SMTP_FROM || "noreply@kospintar.com";
const ALERT_EMAIL = process.env.ALERT_EMAIL || "";

const mailTransport = MAIL_HOST
  ? nodemailer.createTransport({
      host: MAIL_HOST,
      port: MAIL_PORT,
      secure: MAIL_PORT === 465,
      auth: { user: MAIL_USER, pass: MAIL_PASS },
    })
  : null;

async function sendAlert(subject: string, body: string) {
  if (!mailTransport || !ALERT_EMAIL) {
    logger.warn("SMTP not configured — alert not sent");
    return;
  }
  try {
    await mailTransport.sendMail({ from: MAIL_FROM, to: ALERT_EMAIL, subject, text: body });
    logger.info({ to: ALERT_EMAIL, subject }, "Alert sent");
  } catch (e) {
    logger.error(e, "Failed to send alert");
  }
}

async function acquireLock(jobName: string): Promise<boolean> {
  const [result] = await prisma.$queryRaw<[{ pg_try_advisory_lock: boolean }]>`
    SELECT pg_try_advisory_lock(hashtext(${jobName})) as pg_try_advisory_lock
  `;
  return result.pg_try_advisory_lock;
}

async function releaseLock(jobName: string) {
  await prisma.$queryRaw`SELECT pg_advisory_unlock(hashtext(${jobName}))`;
}

function createPayToken(billId: string, phone: string): string {
  return jwt.sign({ bill_id: billId, tenant_phone: phone }, PAY_SECRET, { expiresIn: "7d" });
}

async function runWithRetryAndAlert(
  jobName: string,
  fn: () => Promise<void>,
  retries = 3,
  delayMs = 5 * 60 * 1000
): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await fn();
      return;
    } catch (error) {
      logger.error({ jobName, attempt, retries }, `Cron job failed: ${error}`);
      if (attempt < retries) {
        logger.info({ jobName, delayMs }, `Retrying in ${delayMs / 1000}s`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        await sendAlert(
          `[Kospintar] Cron FAILED: ${jobName}`,
          `Job: ${jobName}\nError: ${error}\nTime: ${new Date().toISOString()}`
        );
      }
    }
  }
}

async function autoBilling() {
  if (!(await acquireLock("auto_billing"))) {
    logger.info("auto_billing already running, skipping");
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
      where: { status: "active", contract_end: { gte: nextMonth } },
      include: { property: { select: { is_active: true } } },
    });
    let created = 0, skipped = 0, failed = 0;
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
      } catch (e) { logger.error(e, "Failed billing for tenant"); failed++; }
    }
    await prisma.cron_logs.update({
      where: { id: log.id },
      data: {
        status: "completed",
        finished_at: new Date(),
        summary: { total: activeTenants.length, created, skipped, failed },
      },
    });
    logger.info({ created, skipped, failed }, "auto_billing done");
  } catch (error) {
    await prisma.cron_logs.update({
      where: { id: log.id },
      data: { status: "failed", finished_at: new Date(), error_message: String(error) },
    });
    throw error;
  } finally {
    await releaseLock("auto_billing");
  }
}

async function waReminder() {
  if (!(await acquireLock("wa_reminder"))) { logger.info("wa_reminder already running, skipping"); return; }
  const log = await prisma.cron_logs.create({
    data: { job_name: "wa_reminder", status: "running", started_at: new Date() },
  });
  try {
    const now = new Date();
    const pendingBills = await prisma.bills.findMany({
      where: { status: "pending" },
      include: { tenant: true, property: { include: { wa_instances: true } } },
    });
    let sent = 0, skipped = 0, failed = 0;
    for (const bill of pendingBills) {
      if (!bill.tenant) { skipped++; continue; }
      const diffDays = Math.ceil(
        (new Date(bill.due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      let reminderType: string | null = null;
      if (diffDays === 7) reminderType = "H-7";
      else if (diffDays === 3) reminderType = "H-3";
      else if (diffDays === 1) reminderType = "H-1";
      else if (diffDays === -1) reminderType = "H+1";
      if (!reminderType) { skipped++; continue; }
      const waInstance = bill.property.wa_instances[0];
      if (!waInstance || waInstance.connection_status !== "connected") { skipped++; continue; }
      const month = bill.period_label;
      const amountRp = `Rp ${(bill.amount / 100).toLocaleString("id-ID")}`;
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
            status: "queued",
            sent_at: new Date(),
          },
        });
        await waQueue.add(
          "send-message",
          { to: bill.tenant.phone, message, instanceName: waInstance.instance_name, notificationLogId: logEntry.id },
          { attempts: 3, backoff: { type: "fixed", delay: 30000 } }
        );
        sent++;
      } catch (e) { logger.error(e, "Failed queue reminder"); failed++; }
    }
    await prisma.cron_logs.update({
      where: { id: log.id },
      data: {
        status: "completed",
        finished_at: new Date(),
        summary: { total: pendingBills.length, sent, skipped, failed },
      },
    });
    logger.info({ sent, skipped, failed }, "wa_reminder done");
  } catch (error) {
    await prisma.cron_logs.update({
      where: { id: log.id },
      data: { status: "failed", finished_at: new Date(), error_message: String(error) },
    });
    throw error;
  } finally {
    await releaseLock("wa_reminder");
  }
}

async function expireStalePayments() {
  if (!(await acquireLock("expire_stale_payments"))) return;
  const log = await prisma.cron_logs.create({
    data: { job_name: "expire_stale_payments", status: "running", started_at: new Date() },
  });
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const staleBills = await prisma.bills.findMany({
      where: { status: "pending", midtrans_order_id: { not: null }, created_at: { lt: twentyFourHoursAgo } },
    });
    let expired = 0, checked = 0;
    for (const bill of staleBills) {
      if (!bill.midtrans_order_id) continue;
      checked++;
      try {
        const res = await fetch(
          `${process.env.MIDTRANS_SNAP_URL || "https://app.sandbox.midtrans.com/api/v1"}/transactions/${bill.midtrans_order_id}/status`,
          {
            headers: {
              Authorization: `Basic ${Buffer.from((process.env.MIDTRANS_SERVER_KEY || "") + ":").toString("base64")}`,
            },
          }
        );
        const data = await res.json() as any;
        if (data.transaction_status === "expire") {
          await prisma.bills.update({ where: { id: bill.id }, data: { status: "expired" } });
          expired++;
        } else if (["settlement", "capture"].includes(data.transaction_status)) {
          await prisma.bills.update({ where: { id: bill.id }, data: { status: "paid", paid_at: new Date() } });
        }
      } catch (e) { logger.error(e, "Failed checking bill status"); }
    }
    await prisma.cron_logs.update({
      where: { id: log.id },
      data: { status: "completed", finished_at: new Date(), summary: { checked, expired } },
    });
    logger.info({ checked, expired }, "expire_stale_payments done");
  } catch (error) {
    await prisma.cron_logs.update({
      where: { id: log.id },
      data: { status: "failed", finished_at: new Date(), error_message: String(error) },
    });
    throw error;
  } finally {
    await releaseLock("expire_stale_payments");
  }
}

async function autoCloseTickets() {
  if (!(await acquireLock("auto_close_tickets"))) return;
  const log = await prisma.cron_logs.create({
    data: { job_name: "auto_close_tickets", status: "running", started_at: new Date() },
  });
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await prisma.tickets.updateMany({
      where: { status: "resolved", updated_at: { lt: sevenDaysAgo } },
      data: { status: "closed", closed_at: new Date() },
    });
    await prisma.cron_logs.update({
      where: { id: log.id },
      data: { status: "completed", finished_at: new Date(), summary: { auto_closed: result.count } },
    });
    logger.info({ count: result.count }, "auto_close_tickets done");
  } catch (error) {
    await prisma.cron_logs.update({
      where: { id: log.id },
      data: { status: "failed", finished_at: new Date(), error_message: String(error) },
    });
    throw error;
  } finally {
    await releaseLock("auto_close_tickets");
  }
}

async function waHealthCheck() {
  if (!(await acquireLock("wa_health_check"))) return;
  const log = await prisma.cron_logs.create({
    data: { job_name: "wa_health_check", status: "running", started_at: new Date() },
  });
  try {
    const instances = await prisma.wa_instances.findMany();
    for (const instance of instances) {
      try {
        const res = await fetch(
          `${EVOLUTION_URL}/instance/connectionState/${instance.instance_name}`,
          { headers: { apikey: EVOLUTION_KEY } }
        );
        const data = await res.json() as any;
        const newStatus: any = data.state === "open" ? "connected" : "disconnected";
        if (newStatus !== instance.connection_status) {
          await prisma.wa_instances.update({
            where: { id: instance.id },
            data: {
              connection_status: newStatus,
              last_connected_at: newStatus === "connected" ? new Date() : instance.last_connected_at,
            },
          });
          logger.info({ instance: instance.instance_name, from: instance.connection_status, to: newStatus }, "WA status changed");
        }
      } catch (e) { logger.error(e, "WA health check failed"); }
    }
    await prisma.cron_logs.update({
      where: { id: log.id },
      data: { status: "completed", finished_at: new Date(), summary: { checked: instances.length } },
    });
  } catch (error) {
    await prisma.cron_logs.update({
      where: { id: log.id },
      data: { status: "failed", finished_at: new Date(), error_message: String(error) },
    });
  } finally {
    await releaseLock("wa_health_check");
  }
}

cron.schedule("0 1 25 * *", () => runWithRetryAndAlert("auto_billing", autoBilling));
cron.schedule("0 1 * * *", () => runWithRetryAndAlert("wa_reminder", waReminder));
cron.schedule("0 */6 * * *", () => runWithRetryAndAlert("expire_stale_payments", expireStalePayments));
cron.schedule("0 19 * * *", () => runWithRetryAndAlert("auto_close_tickets", autoCloseTickets));
cron.schedule("*/5 * * * *", () => runWithRetryAndAlert("wa_health_check", waHealthCheck));

logger.info("Scheduler started with 5 cron jobs");
logger.info("  auto_billing: 25th 08:00 WIB (retry 3x, alert on failure)");
logger.info("  wa_reminder: daily 08:00 WIB (retry 3x, alert on failure)");
logger.info("  expire_stale_payments: every 6h (retry 3x, alert on failure)");
logger.info("  auto_close_tickets: daily 02:00 WIB (retry 3x, alert on failure)");
logger.info("  wa_health_check: every 5min (retry 3x, alert on failure)");

async function shutdown() {
  logger.info("Shutting down scheduler");
  const tasks = cron.getTasks();
  tasks.forEach((t) => t.stop());
  tasks.clear();
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
