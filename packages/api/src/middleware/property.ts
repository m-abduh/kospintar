import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database.js";

export async function checkPropertyOwner(req: Request, res: Response, next: NextFunction): Promise<void> {
  const propertyId = req.params.id || req.body.property_id || req.query.property_id;

  if (!propertyId) {
    next();
    return;
  }

  const property = await prisma.properties.findFirst({
    where: { id: String(propertyId), owner_id: req.user!.id, deleted_at: null },
  });

  if (!property) {
    res.status(404).json({ error: "Property not found" });
    return;
  }

  (req as any).property = property;
  next();
}

export async function checkFreeTierProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
  const count = await prisma.properties.count({
    where: { owner_id: req.user!.id, deleted_at: null },
  });

  if (count >= 3) {
    res.status(403).json({
      error: "Free tier limit reached",
      message: "Maximum 3 properties on free tier. Upgrade for unlimited.",
    });
    return;
  }

  next();
}

export async function checkFreeTierTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
  const propertyId = req.body.property_id;
  if (!propertyId) {
    next();
    return;
  }

  const count = await prisma.tenants.count({
    where: { property_id: propertyId, status: "active" },
  });

  if (count >= 50) {
    res.status(403).json({
      error: "Free tier limit reached",
      message: "Maximum 50 tenants per property on free tier.",
    });
    return;
  }

  next();
}
