import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config/index.js";
import { prisma } from "./config/database.js";
import { redis } from "./config/redis.js";
import { logger } from "./config/logger.js";
import authRoutes from "./routes/auth.js";
import propertyRoutes from "./routes/properties.js";
import tenantRoutes from "./routes/tenants.js";
import billRoutes from "./routes/bills.js";
import ticketRoutes from "./routes/tickets.js";
import dashboardRoutes from "./routes/dashboard.js";
import chatRoutes from "./routes/chat.js";
import waRoutes from "./routes/wa.js";
import payRoutes from "./routes/pay.js";
import uploadRoutes from "./routes/upload.js";
import healthRoutes, { readyRouter } from "./routes/health.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json({ limit: "10mb" }));

app.use((req, _res, next) => {
  if (config.nodeEnv === "development" && req.path.startsWith("/api")) {
    logger.info({ method: req.method, url: req.path }, "request");
  }
  next();
});

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: config.rateLimit.global,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests" },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.rateLimit.auth,
  message: { error: "Too many login attempts. Try again in 15 minutes." },
  keyGenerator: (req) => `${req.ip}-${req.body?.email || "unknown"}`,
});

const webhookMidtransLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: config.rateLimit.webhook_midtrans,
  standardHeaders: true,
  legacyHeaders: false,
});

const webhookEvolutionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: config.rateLimit.webhook_evolution,
  standardHeaders: true,
  legacyHeaders: false,
});

const waSendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: config.rateLimit.wa_send,
  message: { error: "WA send rate limit exceeded" },
  keyGenerator: (req) => req.user?.id || req.ip,
});

app.use("/api/", globalLimiter);

app.use("/api/health", healthRoutes);
app.use("/api/ready", readyRouter());

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.use("/api/bills/webhook/midtrans", webhookMidtransLimiter);
app.use("/api/wa/webhook", webhookEvolutionLimiter);

app.use("/api/properties", propertyRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/wa", waSendLimiter, waRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/pay", payRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/", (_req, res) => {
  res.json({ name: "Kospintar API", version: "1.0.0" });
});

const server = app.listen(config.port, () => {
  logger.info({ port: config.port, nodeEnv: config.nodeEnv }, "Kospintar API running");
});

async function gracefulShutdown(signal: string) {
  logger.info({ signal }, "Starting graceful shutdown");

  server.close(() => {
    logger.info("HTTP server closed");
  });

  const shutdownTimeout = setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 30000);

  try {
    await prisma.$disconnect();
    logger.info("Database disconnected");
  } catch (e) {
    logger.error(e, "Error disconnecting database");
  }

  try {
    await redis.quit();
    logger.info("Redis disconnected");
  } catch (e) {
    logger.error(e, "Error disconnecting Redis");
  }

  clearTimeout(shutdownTimeout);
  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default app;
