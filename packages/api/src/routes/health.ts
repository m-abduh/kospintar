import { Router } from "express";
import { prisma } from "../config/database.js";
import { redis } from "../config/redis.js";
import os from "os";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const redisOk = await redis.ping();
    res.json({
      status: "ok",
      service: "api",
      database: "connected",
      redis: redisOk === "PONG" ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({ status: "error", error: "Service unhealthy" });
  }
});

router.get("/db", async (_req, res) => {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", latency_ms: Date.now() - start });
  } catch {
    res.status(503).json({ status: "error", service: "database" });
  }
});

router.get("/redis", async (_req, res) => {
  try {
    const start = Date.now();
    const pong = await redis.ping();
    res.json({ status: "ok", latency_ms: Date.now() - start });
  } catch {
    res.status(503).json({ status: "error", service: "redis" });
  }
});

router.get("/disk", async (_req, res) => {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const usedPct = Math.round((used / total) * 100);
  res.json({
    status: usedPct > 85 ? "warning" : "ok",
    used_pct: usedPct,
    used_gb: Math.round(used / (1024 ** 3) * 10) / 10,
    total_gb: Math.round(total / (1024 ** 3) * 10) / 10,
  });
});

router.get("/memory", async (_req, res) => {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const usedPct = Math.round((used / total) * 100);
  res.json({
    status: usedPct > 85 ? "warning" : "ok",
    used_pct: usedPct,
    used_gb: Math.round(used / (1024 ** 3) * 10) / 10,
    total_gb: Math.round(total / (1024 ** 3) * 10) / 10,
  });
});

router.get("/queue", async (_req, res) => {
  try {
    const failedJobs = await redis.get("bull:wa-send:failed") || "0";
    const waitingJobs = await redis.get("bull:wa-send:waiting") || "0";
    res.json({ status: "ok", waiting: parseInt(waitingJobs), failed: parseInt(failedJobs) });
  } catch {
    res.json({ status: "unknown" });
  }
});

router.get("/scheduler", async (_req, res) => {
  try {
    const lastRun = await prisma.cron_logs.findFirst({
      orderBy: { started_at: "desc" },
      select: { job_name: true, status: true, started_at: true, finished_at: true },
    });
    res.json({ status: "ok", last_run: lastRun });
  } catch {
    res.json({ status: "unknown" });
  }
});

export function healthRouter() {
  return router;
}

export function readyRouter() {
  const r = Router();
  r.get("/", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      await redis.ping();
      res.json({ status: "ready", checks: { database: "ok", redis: "ok" } });
    } catch {
      res.status(503).json({ status: "not ready" });
    }
  });
  return r;
}

export default router;
