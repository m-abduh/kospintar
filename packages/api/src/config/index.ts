export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret-change-me-min-32-chars!",
    expiresIn: "7d",
  },
  pay: {
    secret: process.env.PAY_SECRET || "pay-secret-change-me-min-32-chars",
    expiresIn: "7d",
  },
  database: {
    url: process.env.DATABASE_URL || "postgresql://kospintar:kospintar@localhost:5432/kospintar",
  },
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  evolution: {
    url: process.env.EVOLUTION_URL || "http://localhost:8080",
    api_key: process.env.EVOLUTION_API_KEY || "",
  },
  midtrans: {
    server_key: process.env.MIDTRANS_SERVER_KEY || "",
    client_key: process.env.MIDTRANS_CLIENT_KEY || "",
    snap_url: process.env.MIDTRANS_SNAP_URL || "https://app.sandbox.midtrans.com/api/v1",
    is_production: process.env.MIDTRANS_IS_PRODUCTION === "true",
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT || "",
    bucket: process.env.S3_BUCKET || "kospintar",
    access_key: process.env.S3_ACCESS_KEY || "",
    secret_key: process.env.S3_SECRET_KEY || "",
    public_url: process.env.S3_PUBLIC_URL || "",
  },
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3001",
  },
  rateLimit: {
    global: 100,
    authenticated: 300,
    auth: 5,
    webhook_midtrans: 200,
    webhook_evolution: 100,
    wa_send: 50,
  },
} as const;
