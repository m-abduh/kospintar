import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database.js";
import { config } from "../config/index.js";
import { registerSchema, loginSchema } from "@kospintar/shared";
import { validate } from "../middleware/validate.js";
import { verifyJWT } from "../middleware/auth.js";

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
    console.error("Register error:", error);
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
    console.error("Login error:", error);
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
    console.error("Me error:", error);
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
    console.error("Delete account error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
