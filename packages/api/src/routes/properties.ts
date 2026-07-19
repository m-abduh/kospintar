import { Router } from "express";
import { logger } from "../config/logger.js";
import { prisma } from "../config/database.js";
import { propertySchema } from "@kospintar/shared";
import { verifyJWT, requireOwner } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { checkFreeTierProperty } from "../middleware/property.js";

const router = Router();

router.use(verifyJWT, requireOwner);

router.get("/", async (req, res) => {
  try {
    const page = parseInt(String(req.query.page || "1"), 10);
    const search = String(req.query.search || "");
    const limit = 10;
    const skip = (page - 1) * limit;

    const where: any = { owner_id: req.user!.id, deleted_at: null };
    if (search) where.name = { contains: search, mode: "insensitive" };

    const [properties, total] = await Promise.all([
      prisma.properties.findMany({ where, skip, take: limit, orderBy: { created_at: "desc" } }),
      prisma.properties.count({ where }),
    ]);

    res.json({ data: properties, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    logger.error(error, "List properties error:");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const property = await prisma.properties.findFirst({
      where: { id: req.params.id, owner_id: req.user!.id, deleted_at: null },
      include: {
        _count: { select: { tenants: { where: { status: "active" } } } },
      },
    });

    if (!property) {
      res.status(404).json({ error: "Property not found" });
      return;
    }

    const occupied = await prisma.tenants.count({
      where: { property_id: property.id, status: "active" },
    });

    res.json({
      property: {
        ...property,
        active_tenants: property._count.tenants,
        occupied_rooms: occupied,
        occupancy_rate: property.total_rooms > 0 ? Math.round((occupied / property.total_rooms) * 100) : 0,
      },
    });
  } catch (error) {
    logger.error(error, "Get property error:");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", checkFreeTierProperty, validate(propertySchema), async (req, res) => {
  try {
    const property = await prisma.properties.create({
      data: {
        owner_id: req.user!.id,
        name: req.body.name,
        address: req.body.address,
        total_rooms: req.body.total_rooms,
        photo_url: req.body.photo_url,
      },
    });

    res.status(201).json({ property });
  } catch (error) {
    logger.error(error, "Create property error:");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", validate(propertySchema), async (req, res) => {
  try {
    const existing = await prisma.properties.findFirst({
      where: { id: req.params.id, owner_id: req.user!.id, deleted_at: null },
    });

    if (!existing) {
      res.status(404).json({ error: "Property not found" });
      return;
    }

    const property = await prisma.properties.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        address: req.body.address,
        total_rooms: req.body.total_rooms,
        photo_url: req.body.photo_url,
      },
    });

    res.json({ property });
  } catch (error) {
    logger.error(error, "Update property error:");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.properties.findFirst({
      where: { id: req.params.id, owner_id: req.user!.id, deleted_at: null },
    });

    if (!existing) {
      res.status(404).json({ error: "Property not found" });
      return;
    }

    const activeTenants = await prisma.tenants.count({
      where: { property_id: req.params.id, status: "active" },
    });

    if (activeTenants > 0) {
      res.status(400).json({ error: "Hapus atau checkout semua penghuni dulu." });
      return;
    }

    const unpaidBills = await prisma.bills.count({
      where: { property_id: req.params.id, status: "pending" },
    });

    if (unpaidBills > 0) {
      res.status(400).json({ error: "Masih ada tagihan yang belum dibayar." });
      return;
    }

    await prisma.properties.update({
      where: { id: req.params.id },
      data: { deleted_at: new Date(), is_active: false },
    });

    res.json({ message: "Property deleted" });
  } catch (error) {
    logger.error(error, "Delete property error:");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
