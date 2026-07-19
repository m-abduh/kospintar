import { Router } from "express";
import { logger } from "../config/logger.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../config/database.js";
import { config } from "../config/index.js";
import { generateMidtransOrderId } from "@kospintar/shared";

const router = Router();

router.post("/:signed_token", async (req, res) => {
  try {
    const { signed_token } = req.params;

    let payload: any;
    try {
      payload = jwt.verify(signed_token, config.pay.secret);
    } catch {
      res.status(401).json({ error: "Invalid or expired payment link" });
      return;
    }

    const bill = await prisma.bills.findFirst({
      where: { id: payload.bill_id, status: "pending" },
      include: { tenant: true },
    });

    if (!bill) {
      res.status(404).json({ error: "Bill not found or already paid" });
      return;
    }

    const orderId = generateMidtransOrderId(bill.id);

    const midtransRes = await fetch(`${config.midtrans.snap_url}/charge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(config.midtrans.server_key + ":").toString("base64")}`,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderId,
          gross_amount: bill.amount,
        },
        customer: {
          first_name: bill.tenant.name,
          phone: bill.tenant.phone,
        },
        enabled_payments: ["gopay", "shopeepay", "bank_transfer", "qris"],
        callbacks: {
          finish: `${config.cors.origin}/bills/${bill.id}`,
        },
      }),
    });

    const midtransData = await midtransRes.json() as any;

    if (midtransData.error_type) {
      res.status(502).json({ error: "Payment gateway error", details: midtransData });
      return;
    }

    await prisma.bills.update({
      where: { id: bill.id },
      data: { midtrans_order_id: orderId },
    });

    res.json({ redirect_url: midtransData.redirect_url, token: midtransData.token });
  } catch (error) {
    logger.error(error, "Pay error:");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:signed_token/status", async (req, res) => {
  try {
    const { signed_token } = req.params;

    let payload: any;
    try {
      payload = jwt.verify(signed_token, config.pay.secret);
    } catch {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    const bill = await prisma.bills.findFirst({
      where: { id: payload.bill_id },
      select: { id: true, status: true, amount: true, period_label: true, paid_at: true },
    });

    if (!bill) {
      res.status(404).json({ error: "Bill not found" });
      return;
    }

    res.json({ bill });
  } catch (error) {
    logger.error(error, "Pay status error:");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
