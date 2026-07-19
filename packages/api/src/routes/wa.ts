import { Router } from "express";
import { prisma } from "../config/database.js";
import { waConnectSchema, waSendSchema } from "@kospintar/shared";
import { verifyJWT, requireOwner } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { config } from "../config/index.js";
import { FREE_TIER } from "@kospintar/shared";

const router = Router();

router.use(verifyJWT, requireOwner);

async function checkWaFreeTier(ownerId: string, res: any): Promise<boolean> {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const usage = await prisma.usage_logs.upsert({
    where: { owner_id_month: { owner_id: ownerId, month } },
    update: {},
    create: { owner_id: ownerId, month, wa_messages: 0 },
  });

  if (usage.wa_messages >= FREE_TIER.MAX_WA_MESSAGES_PER_MONTH) {
    res.status(403).json({
      error: "Free tier limit reached",
      message: "Tier gratis sudah mencapai batas WA bulan ini.",
    });
    return false;
  }

  return true;
}

async function incrementWaUsage(ownerId: string) {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  await prisma.usage_logs.upsert({
    where: { owner_id_month: { owner_id: ownerId, month } },
    update: { wa_messages: { increment: 1 } },
    create: { owner_id: ownerId, month, wa_messages: 1 },
  });
}

router.post("/connect", validate(waConnectSchema), async (req, res) => {
  try {
    const property = await prisma.properties.findFirst({
      where: { id: req.body.property_id, owner_id: req.user!.id, deleted_at: null },
    });

    if (!property) {
      res.status(404).json({ error: "Property not found" });
      return;
    }

    const instanceName = `kospintar-${property.id.slice(0, 8)}`;

    // Create Evolution instance
    const createRes = await fetch(`${config.evolution.url}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.evolution.api_key,
      },
      body: JSON.stringify({
        instanceName,
        number: req.body.phone_number,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
    });

    const instanceData = await createRes.json() as any;

    // Upsert WA instance
    await prisma.wa_instances.upsert({
      where: { property_id: req.body.property_id },
      update: {
        instance_name: instanceName,
        phone_number: req.body.phone_number,
        connection_status: "connecting",
      },
      create: {
        property_id: req.body.property_id,
        instance_name: instanceName,
        phone_number: req.body.phone_number,
        connection_status: "connecting",
      },
    });

    // Get QR code
    const qrRes = await fetch(`${config.evolution.url}/instance/qr/${instanceName}`, {
      headers: { apikey: config.evolution.api_key },
    });

    const qrData = await qrRes.json() as any;

    res.json({
      instance_name: instanceName,
      qr_code: qrData.base64 || qrData.qrcode,
      status: "connecting",
    });
  } catch (error) {
    console.error("WA connect error:", error);
    res.status(500).json({ error: "Failed to connect WhatsApp" });
  }
});

router.get("/qr/:propertyId", async (req, res) => {
  try {
    const waInstance = await prisma.wa_instances.findFirst({
      where: {
        property_id: req.params.propertyId,
        property: { owner_id: req.user!.id },
      },
    });

    if (!waInstance) {
      res.status(404).json({ error: "WA instance not found" });
      return;
    }

    const qrRes = await fetch(`${config.evolution.url}/instance/qr/${waInstance.instance_name}`, {
      headers: { apikey: config.evolution.api_key },
    });

    const qrData = await qrRes.json() as any;
    res.json({ qr_code: qrData.base64 || qrData.qrcode });
  } catch (error) {
    console.error("WA QR error:", error);
    res.status(500).json({ error: "Failed to get QR code" });
  }
});

router.get("/status/:propertyId", async (req, res) => {
  try {
    const waInstance = await prisma.wa_instances.findFirst({
      where: {
        property_id: req.params.propertyId,
        property: { owner_id: req.user!.id },
      },
    });

    if (!waInstance) {
      res.status(404).json({ error: "WA instance not found" });
      return;
    }

    // Check Evolution status
    const statusRes = await fetch(`${config.evolution.url}/instance/connectionState/${waInstance.instance_name}`, {
      headers: { apikey: config.evolution.api_key },
    });

    const statusData = await statusRes.json() as any;
    const connectionStatus = statusData.state === "open" ? "connected" : "disconnected";

    await prisma.wa_instances.update({
      where: { id: waInstance.id },
      data: {
        connection_status: connectionStatus,
        last_connected_at: connectionStatus === "connected" ? new Date() : waInstance.last_connected_at,
      },
    });

    res.json({ status: connectionStatus });
  } catch (error) {
    console.error("WA status error:", error);
    res.status(500).json({ error: "Failed to check status" });
  }
});

router.post("/send", validate(waSendSchema), async (req, res) => {
  try {
    const allowed = await checkWaFreeTier(req.user!.id, res);
    if (!allowed) return;

    const waInstance = await prisma.wa_instances.findFirst({
      where: {
        property_id: req.body.property_id,
        property: { owner_id: req.user!.id },
        connection_status: "connected",
      },
    });

    if (!waInstance) {
      res.status(400).json({ error: "WhatsApp not connected for this property" });
      return;
    }

    // Send via Evolution API
    const sendRes = await fetch(`${config.evolution.url}/message/sendText/${waInstance.instance_name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.evolution.api_key,
      },
      body: JSON.stringify({
        number: req.body.to,
        text: req.body.message,
      }),
    });

    const sendData = await sendRes.json() as any;

    await incrementWaUsage(req.user!.id);

    // Log notification
    await prisma.notification_logs.create({
      data: {
        type: "payment_confirmation",
        recipient_phone: req.body.to,
        message_body: req.body.message,
        status: "sent",
        sent_at: new Date(),
      },
    });

    res.json({ message_id: sendData.key?.id || "sent" });
  } catch (error) {
    console.error("WA send error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

router.post("/webhook/:instanceName", async (req, res) => {
  try {
    // Validate Evolution webhook key
    const evolutionKey = req.headers["x-evolution-key"];
    if (evolutionKey !== config.evolution.api_key) {
      res.status(403).json({ error: "Invalid webhook key" });
      return;
    }

    const event = req.body.event;
    const instance = req.body.instance;

    if (event === "messages.upsert") {
      const msg = req.body.data;
      const from = msg.key?.remoteJid?.replace("@s.whatsapp.net", "");
      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";

      if (!from || !text) {
        res.status(200).json({ status: "ok" });
        return;
      }

      // Find tenant by phone
      const waInstance = await prisma.wa_instances.findFirst({
        where: { instance_name: instance },
      });

      if (!waInstance) {
        res.status(200).json({ status: "ok" });
        return;
      }

      const tenant = await prisma.tenants.findFirst({
        where: { phone: from, property_id: waInstance.property_id, status: "active" },
      });

      if (!tenant) {
        res.status(200).json({ status: "ok" });
        return;
      }

      // Check for complaint keywords
      const isComplaint = /darurat|mendesak|kebakaran|banjir|kunci/i.test(text);

      // Create or find existing ticket
      let ticket;
      if (isComplaint) {
        const ticketCount = await prisma.tickets.count();
        const ticketNumber = `TKT-${String(ticketCount + 1).padStart(6, "0")}`;
        const priority = /darurat|mendesak|kebakaran|banjir|kunci/i.test(text) ? "high" : "medium";

        ticket = await prisma.tickets.create({
          data: {
            property_id: waInstance.property_id,
            tenant_id: tenant.id,
            ticket_number: ticketNumber,
            title: text.substring(0, 100),
            description: text,
            priority: priority as any,
            source: "wa",
            wa_message_id: msg.key?.id,
          },
        });

        // Auto-reply
        const reply = `Laporan kamu udah kami terima ya, sebentar lagi kami cek. Kode tiket: #${ticket.ticket_number}`;

        await fetch(`${config.evolution.url}/message/sendText/${instance}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: config.evolution.api_key,
          },
          body: JSON.stringify({ number: from, text: reply }),
        });

        await prisma.notification_logs.create({
          data: {
            ticket_id: ticket.id,
            type: "ticket_created",
            recipient_phone: from,
            message_body: reply,
            status: "sent",
            sent_at: new Date(),
          },
        });
      }

      // Save chat message
      await prisma.chat_messages.create({
        data: {
          ticket_id: ticket?.id || null,
          tenant_id: tenant.id,
          property_id: waInstance.property_id,
          direction: "incoming",
          message_body: text,
          wa_message_id: msg.key?.id,
          status: "delivered",
        },
      });
    }

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("WA webhook error:", error);
    res.status(200).json({ status: "ok" });
  }
});

router.post("/disconnect/:propertyId", async (req, res) => {
  try {
    const waInstance = await prisma.wa_instances.findFirst({
      where: {
        property_id: req.params.propertyId,
        property: { owner_id: req.user!.id },
      },
    });

    if (!waInstance) {
      res.status(404).json({ error: "WA instance not found" });
      return;
    }

    await fetch(`${config.evolution.url}/instance/delete/${waInstance.instance_name}`, {
      method: "DELETE",
      headers: { apikey: config.evolution.api_key },
    });

    await prisma.wa_instances.update({
      where: { id: waInstance.id },
      data: { connection_status: "disconnected" },
    });

    res.json({ message: "WhatsApp disconnected" });
  } catch (error) {
    console.error("WA disconnect error:", error);
    res.status(500).json({ error: "Failed to disconnect" });
  }
});

export default router;
