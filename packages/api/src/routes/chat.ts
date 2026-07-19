import { Router } from "express";
import { logger } from "../config/logger.js";
import { prisma } from "../config/database.js";
import { chatSendSchema } from "@kospintar/shared";
import { verifyJWT, requireOwner } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.use(verifyJWT, requireOwner);

router.get("/:tenantId", async (req, res) => {
  try {
    const tenant = await prisma.tenants.findFirst({
      where: {
        id: req.params.tenantId,
        property: { owner_id: req.user!.id, deleted_at: null },
      },
    });

    if (!tenant) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    const messages = await prisma.chat_messages.findMany({
      where: { tenant_id: req.params.tenantId },
      orderBy: { created_at: "asc" },
    });

    res.json({ messages });
  } catch (error) {
    logger.error(error, "Chat history error:");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/send", validate(chatSendSchema), async (req, res) => {
  try {
    const tenant = await prisma.tenants.findFirst({
      where: {
        id: req.body.tenant_id,
        property: { owner_id: req.user!.id, deleted_at: null },
      },
    });

    if (!tenant) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    const message = await prisma.chat_messages.create({
      data: {
        tenant_id: tenant.id,
        property_id: tenant.property_id,
        direction: "outgoing",
        message_body: req.body.message,
        status: "sent",
      },
    });

    // In production: queue WA send via BullMQ
    // await waQueue.add('send-message', { to: tenant.phone, message: req.body.message });

    res.json({ message });
  } catch (error) {
    logger.error(error, "Chat send error:");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
