import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database.js";
import { config } from "../config/index.js";
import { registerSchema, loginSchema } from "@kospintar/shared";
import { validate } from "../middleware/validate.js";
import { z } from "zod";
import pino from "pino";
const logger = pino({ level: process.env.LOG_LEVEL || "info" });

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(10).max(20).optional(),
});

const router = Router();

router.post("/register", validate(registerSchema), async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.users.create({
      data: { name, email, password_hash, phone },
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
  } catch (error) {
    logger.error(error, "Register error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.users.findFirst({
      where: { email, deleted_at: null },
    });

    if (!user || !user.is_active) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
  } catch (error) {
    logger.error(error, "Login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", verifyJWT, async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, phone: true, role: true, created_at: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user });
  } catch (error) {
    logger.error(error, "Me error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/me", verifyJWT, validate(updateProfileSchema), async (req, res) => {
  try {
    const data: Record<string, string> = {};
    if (req.body.name) data.name = req.body.name;
    if (req.body.phone) data.phone = req.body.phone;
    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }
    const user = await prisma.users.update({
      where: { id: req.user!.id },
      data,
      select: { id: true, name: true, email: true, phone: true, role: true, created_at: true },
    });
    res.json({ user });
  } catch (error) {
    logger.error(error, "Update profile error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/account", verifyJWT, async (req, res) => {
  try {
    await prisma.users.update({
      where: { id: req.user!.id },
      data: { is_active: false, deleted_at: new Date() },
    });

    res.json({ message: "Account deleted" });
  } catch (error) {
    logger.error(error, "Delete account error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
