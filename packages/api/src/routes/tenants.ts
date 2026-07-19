import { Router } from "express";
import { logger } from "../config/logger.js";
import { prisma } from "../config/database.js";
import { tenantSchema } from "@kospintar/shared";
import { verifyJWT, requireOwner } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { checkFreeTierTenant } from "../middleware/property.js";

const router = Router();

router.use(verifyJWT, requireOwner);

router.get("/", async (req, res) => {
  try {
    const { property_id, status, search, page = "1" } = req.query;
    const limit = 10;
    const skip = (parseInt(String(page), 10) - 1) * limit;

    const where: any = {
      property: { owner_id: req.user!.id, deleted_at: null },
    };

    if (property_id) where.property_id = String(property_id);
    if (status) where.status = String(status) as any;
    if (search) where.name = { contains: String(search), mode: "insensitive" };

    const [tenants, total] = await Promise.all([
      prisma.tenants.findMany({
        where,
        include: { property: { select: { id: true, name: true } } },
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      prisma.tenants.count({ where }),
    ]);

    res.json({ data: tenants, total, page: parseInt(String(page), 10), limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    logger.error(error, "List tenants error:");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const tenant = await prisma.tenants.findFirst({
      where: {
        id: req.params.id,
        property: { owner_id: req.user!.id, deleted_at: null },
      },
      include: {
        property: { select: { id: true, name: true } },
        bills: { orderBy: { created_at: "desc" }, take: 12 },
      },
    });

    if (!tenant) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    res.json({ tenant });
  } catch (error) {
    logger.error(error, "Get tenant error:");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", checkFreeTierTenant, validate(tenantSchema), async (req, res) => {
  try {
    const property = await prisma.properties.findFirst({
      where: { id: req.body.property_id, owner_id: req.user!.id, deleted_at: null },
    });

    if (!property) {
      res.status(404).json({ error: "Property not found" });
      return;
    }

    const existingRoom = await prisma.tenants.findFirst({
      where: {
        property_id: req.body.property_id,
        room_number: req.body.room_number,
        status: "active",
      },
    });

    if (existingRoom) {
      res.status(409).json({ error: "Room number already occupied" });
      return;
    }

    const tenant = await prisma.tenants.create({
      data: {
        property_id: req.body.property_id,
        name: req.body.name,
        phone: req.body.phone,
        room_number: req.body.room_number,
        rent_amount: req.body.rent_amount,
        deposit: req.body.deposit || 0,
        due_date_override: req.body.due_date_override,
        contract_start: new Date(req.body.contract_start),
        contract_end: new Date(req.body.contract_end),
        notes: req.body.notes,
      },
    });

    res.status(201).json({ tenant });
  } catch (error) {
    logger.error(error, "Create tenant error:");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", validate(tenantSchema), async (req, res) => {
  try {
    const existing = await prisma.tenants.findFirst({
      where: {
        id: req.params.id,
        property: { owner_id: req.user!.id, deleted_at: null },
      },
    });

    if (!existing) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    if (req.body.room_number !== existing.room_number) {
      const roomTaken = await prisma.tenants.findFirst({
        where: {
          property_id: existing.property_id,
          room_number: req.body.room_number,
          status: "active",
          NOT: { id: req.params.id },
        },
      });

      if (roomTaken) {
        res.status(409).json({ error: "Room number already occupied" });
        return;
      }
    }

    const tenant = await prisma.tenants.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        phone: req.body.phone,
        room_number: req.body.room_number,
        rent_amount: req.body.rent_amount,
        deposit: req.body.deposit,
        due_date_override: req.body.due_date_override,
        contract_start: new Date(req.body.contract_start),
        contract_end: new Date(req.body.contract_end),
        notes: req.body.notes,
      },
    });

    res.json({ tenant });
  } catch (error) {
    logger.error(error, "Update tenant error:");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const tenant = await prisma.tenants.findFirst({
      where: {
        id: req.params.id,
        property: { owner_id: req.user!.id, deleted_at: null },
      },
    });

    if (!tenant) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    const updated = await prisma.tenants.update({
      where: { id: req.params.id },
      data: { status: "checkout" },
    });

    const now = new Date();
    const dayOfMonth = now.getDate();
    const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    if (dayOfMonth > 10) {
      const prorataAmount = Math.round(tenant.rent_amount * (totalDaysInMonth - dayOfMonth + 1) / totalDaysInMonth);
      const periodLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const dueDate = new Date(now.getFullYear(), now.getMonth(), Math.min(tenant.due_date_override || 10, 28));

      await prisma.bills.create({
        data: {
          tenant_id: tenant.id,
          property_id: tenant.property_id,
          amount: prorataAmount,
          due_date: dueDate,
          period_label: periodLabel,
          status: "pending",
        },
      });
    }

    res.json({ tenant: updated });
  } catch (error) {
    logger.error(error, "Delete tenant error:");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
