import { Worker, Queue } from "bullmq";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

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
    logger.info({ to: data.to, attempt: job.attemptsMade + 1 }, "Sending WA");

    try {
      await sendWaMessage(data);

      if (data.notificationLogId) {
        await prisma.notification_logs.update({
          where: { id: data.notificationLogId },
          data: { status: "sent", sent_at: new Date() },
        }).catch((e) => logger.error(e, "Failed to update notification log"));
      }

      logger.info({ to: data.to }, "WA sent");
    } catch (error) {
      logger.error({ to: data.to, attempt: job.attemptsMade + 1, error }, "WA send failed");
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
  logger.info({ jobId: job.id, to: job.data.to }, "Job completed");
});

waWorker.on("failed", async (job, err) => {
  logger.error({ jobId: job?.id, attempts: job?.attemptsMade, error: err.message }, "Job failed");

  if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
    logger.info({ jobId: job.id }, "Moving to DLQ");
    await deadLetterQueue.add("failed-wa", {
      ...job.data,
      error: err.message,
      failed_at: new Date().toISOString(),
    }).catch((e) => logger.error(e, "Failed to add to DLQ"));
  }
});

waWorker.on("ready", () => {
  logger.info("WA send worker ready (concurrency: 5, rate: 50/min, retry: 3x with 30s delay)");
});

async function shutdown() {
  logger.info("Shutting down worker");
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
