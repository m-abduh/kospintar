import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";

export const prisma = new PrismaClient({
  log: ["error", "warn"],
});

export const config = {
  evolution: {
    url: process.env.EVOLUTION_URL || "http://localhost:8080",
    api_key: process.env.EVOLUTION_API_KEY || "",
  },
};
