import { Router } from "express";
import { logger } from "../config/logger.js";
import { prisma } from "../config/database.js";
import { ticketUpdateSchema, ticketReplySchema } from "@kospintar/shared";
import { verifyJWT, requireOwner } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";

const router = Router();

router.use(verifyJWT, requireOwner);

const createTicketSchema = z.object({
  property_id: z.string().uuid(),
  tenant_id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

router.get("/", async (req, res) => {
  try {
    const { property_id, status, priority, page = "1" } = req.query;
    const limit = 20;
    const skip = (parseInt(String(page), 10) - 1) * limit;

    const where: any = {
      property: { owner_id: req.user!.id, deleted_at: null },
    };

    if (property_id) where.property_id = String(property_id);
    if (status) where.status = String(status) as any;
    if (priority) where.priority = String(priority) as any;

    const [tickets, total] = await Promise.all([
      prisma.tickets.findMany({
        where,
        include: {
          tenant: { select: { id: true, name: true, room_number: true } },
          property: { select: { id: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      prisma.tickets.count({ where }),
    ]);

    res.json({ data: tickets, total, page: parseInt(String(page), 10), limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    logger.error("List tickets error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const ticket = await prisma.tickets.findFirst({
      where: {
        id: req.params.id,
        property: { owner_id: req.user!.id, deleted_at: null },
      },
      include: {
        tenant: { select: { id: true, name: true, room_number: true, phone: true } },
        property: { select: { id: true, name: true } },
        chat_messages: { orderBy: { created_at: "asc" } },
      },
    });

    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    res.json({ ticket });
  } catch (error) {
    logger.error("Get ticket error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", validate(createTicketSchema), async (req, res) => {
  try {
    const { property_id, tenant_id, title, description, priority } = req.body;

    const property = await prisma.properties.findFirst({
      where: { id: property_id, owner_id: req.user!.id, deleted_at: null },
    });

    if (!property) {
      res.status(404).json({ error: "Property not found" });
      return;
    }

    const ticketCount = await prisma.tickets.count();
    const ticketNumber = `TKT-${String(ticketCount + 1).padStart(6, "0")}`;

    const ticket = await prisma.tickets.create({
      data: {
        property_id,
        tenant_id: tenant_id || null,
        ticket_number: ticketNumber,
        title,
        description: description || null,
        priority: (priority as any) || "medium",
        source: "manual",
      },
    });

    res.status(201).json({ ticket });
  } catch (error) {
    logger.error("Create ticket error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", validate(ticketUpdateSchema), async (req, res) => {
  try {
    const existing = await prisma.tickets.findFirst({
      where: {
        id: req.params.id,
        property: { owner_id: req.user!.id, deleted_at: null },
      },
    });

    if (!existing) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    const data: any = { ...req.body };

    if (data.status === "closed" && !existing.closed_at) {
      data.closed_at = new Date();
    }

    const ticket = await prisma.tickets.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ ticket });
  } catch (error) {
    logger.error("Update ticket error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/reply", validate(ticketReplySchema), async (req, res) => {
  try {
    const ticket = await prisma.tickets.findFirst({
      where: {
        id: req.params.id,
        property: { owner_id: req.user!.id, deleted_at: null },
      },
      include: { tenant: true, property: true },
    });

    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    if (!ticket.tenant) {
      res.status(400).json({ error: "Ticket has no associated tenant" });
      return;
    }

    const chatMessage = await prisma.chat_messages.create({
      data: {
        ticket_id: ticket.id,
        tenant_id: ticket.tenant_id!,
        property_id: ticket.property_id,
        direction: "outgoing",
        message_body: req.body.message,
        status: "sent",
      },
    });

    // Queue WA send (simplified - in production, use BullMQ)
    // await waQueue.add('send-message', { ... });

    res.json({ chat_message: chatMessage });
  } catch (error) {
    logger.error("Reply ticket error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
