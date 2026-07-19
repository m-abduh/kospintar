import { Router } from "express";
import { logger } from "../config/logger.js";
import crypto from "crypto";
import { prisma } from "../config/database.js";
import { config } from "../config/index.js";
import { billSchema, billVoidSchema } from "@kospintar/shared";
import { verifyJWT, requireOwner } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.get("/", verifyJWT, requireOwner, async (req, res) => {
  try {
    const { property_id, status, period_label, page = "1" } = req.query;
    const limit = 20;
    const skip = (parseInt(String(page), 10) - 1) * limit;

    const where: any = {
      property: { owner_id: req.user!.id, deleted_at: null },
    };

    if (property_id) where.property_id = String(property_id);
    if (status) where.status = String(status) as any;
    if (period_label) where.period_label = String(period_label);

    const [bills, total] = await Promise.all([
      prisma.bills.findMany({
        where,
        include: {
          tenant: { select: { id: true, name: true, room_number: true } },
          property: { select: { id: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      prisma.bills.count({ where }),
    ]);

    res.json({ data: bills, total, page: parseInt(String(page), 10), limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    logger.error(error, "List bills error:");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", verifyJWT, requireOwner, async (req, res) => {
  try {
    const bill = await prisma.bills.findFirst({
      where: {
        id: req.params.id,
        property: { owner_id: req.user!.id, deleted_at: null },
      },
      include: {
        tenant: { select: { id: true, name: true, room_number: true, phone: true } },
        property: { select: { id: true, name: true } },
        payment_logs: { orderBy: { created_at: "desc" } },
      },
    });

    if (!bill) {
      res.status(404).json({ error: "Bill not found" });
      return;
    }

    res.json({ bill });
  } catch (error) {
    logger.error(error, "Get bill error:");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", verifyJWT, requireOwner, validate(billSchema), async (req, res) => {
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

    const existingBill = await prisma.bills.findFirst({
      where: { tenant_id: req.body.tenant_id, period_label: req.body.period_label },
    });

    if (existingBill) {
      res.status(409).json({ error: "Bill already exists for this period" });
      return;
    }

    const bill = await prisma.bills.create({
      data: {
        tenant_id: req.body.tenant_id,
        property_id: req.body.property_id,
        amount: req.body.amount,
        due_date: new Date(req.body.due_date),
        period_label: req.body.period_label,
      },
    });

    res.status(201).json({ bill });
  } catch (error) {
    logger.error(error, "Create bill error:");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id/void", verifyJWT, requireOwner, validate(billVoidSchema), async (req, res) => {
  try {
    const bill = await prisma.bills.findFirst({
      where: {
        id: req.params.id,
        property: { owner_id: req.user!.id, deleted_at: null },
      },
    });

    if (!bill) {
      res.status(404).json({ error: "Bill not found" });
      return;
    }

    if (bill.status !== "pending") {
      res.status(400).json({ error: "Can only void pending bills" });
      return;
    }

    const updated = await prisma.bills.update({
      where: { id: req.params.id },
      data: { status: "void", void_reason: req.body.void_reason },
    });

    res.json({ bill: updated });
  } catch (error) {
    logger.error(error, "Void bill error:");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/webhook/midtrans", async (req, res) => {
  try {
    const { order_id, status_code, gross_amount, signature_key } = req.body;

    const signatureString = `${order_id}${status_code}${gross_amount}${config.midtrans.server_key}`;
    const expectedSignature = crypto.createHash("sha512").update(signatureString).digest("hex");

    if (signature_key !== expectedSignature) {
      res.status(403).json({ error: "Invalid signature" });
      return;
    }

    const existingLog = await prisma.payment_logs.findFirst({
      where: { midtrans_order_id: order_id },
    });

    if (existingLog) {
      res.status(200).json({ status: "ok" });
      return;
    }

    const transaction = req.body;
    const bill = await prisma.bills.findFirst({
      where: { midtrans_order_id: order_id },
    });

    if (!bill) {
      res.status(404).json({ error: "Bill not found" });
      return;
    }

    let billStatus: "pending" | "paid" | "expired" = "pending";
    let paidAt: Date | undefined;

    if (transaction.transaction_status === "settlement" || transaction.transaction_status === "capture") {
      billStatus = "paid";
      paidAt = new Date();
    } else if (transaction.transaction_status === "expire" && bill.status === "pending") {
      billStatus = "expired";
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment_logs.create({
        data: {
          bill_id: bill.id,
          midtrans_transaction_id: transaction.transaction_id || order_id,
          midtrans_order_id: order_id,
          status: transaction.transaction_status,
          gross_amount: parseInt(gross_amount, 10),
          raw_response: transaction,
        },
      });

      if (billStatus !== "pending") {
        await tx.bills.update({
          where: { id: bill.id },
          data: { status: billStatus, paid_at: paidAt },
        });
      }
    });

    res.status(200).json({ status: "ok" });
  } catch (error) {
    logger.error(error, "Midtrans webhook error:");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
