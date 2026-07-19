import { Worker, Queue, QueueEvents } from "bullmq";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";

const prisma = new PrismaClient({ log: ["error", "warn"] });

const connection = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

const connection2 = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

export const waQueue = new Queue("wa-send", { connection });
const deadLetterQueue = new Queue("wa-dead-letter", { connection });

const EVOLUTION_URL = process.env.EVOLUTION_URL || "http://localhost:8080";
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || "";

interface WaSendJob {
  to: string;
  message: string;
  instanceName: string;
  notificationLogId?: string;
}

async function sendWaMessage(data: WaSendJob): Promise<boolean> {
  const sendRes = await fetch(`${EVOLUTION_URL}/message/sendText/${data.instanceName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_KEY,
    },
    body: JSON.stringify({ number: data.to, text: data.message }),
  });

  if (!sendRes.ok) {
    const body = await sendRes.text();
    throw new Error(`Evolution API ${sendRes.status}: ${body}`);
  }

  return true;
}

const waWorker = new Worker(
  "wa-send",
  async (job) => {
    const data = job.data as WaSendJob;
    console.log(`[Worker] Sending WA to ${data.to} (attempt ${job.attemptsMade + 1})`);

    try {
      await sendWaMessage(data);

      if (data.notificationLogId) {
        await prisma.notification_logs.update({
          where: { id: data.notificationLogId },
          data: { status: "sent", sent_at: new Date() },
        }).catch((e) => console.error("[Worker] Failed to update notification log:", e));
      }

      console.log(`[Worker] WA sent to ${data.to}`);
    } catch (error) {
      console.error(`[Worker] WA send failed to ${data.to} (attempt ${job.attemptsMade + 1}):`, error);
      throw error;
    }
  },
  {
    connection: connection2,
    concurrency: 5,
    limiter: {
      max: 50,
      duration: 60 * 1000,
    },
  }
);

waWorker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed for ${job.data.to}`);
});

waWorker.on("failed", async (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed after ${job?.attemptsMade} attempts:`, err.message);

  if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
    console.error(`[Worker] Job ${job.id} moved to DLQ`);
    await deadLetterQueue.add("failed-wa", {
      ...job.data,
      error: err.message,
      failed_at: new Date().toISOString(),
    }).catch((e) => console.error("[Worker] Failed to add to DLQ:", e));
  }
});

waWorker.on("ready", () => {
  console.log("[Worker] WA send worker ready (concurrency: 5, rate: 50/min, retry: 3x with 30s delay)");
});

async function shutdown() {
  console.log("[Worker] Shutting down...");
  await waWorker.close();
  await waQueue.close();
  await deadLetterQueue.close();
  await prisma.$disconnect();
  await connection.quit();
  await connection2.quit();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export { prisma as workerPrisma };
