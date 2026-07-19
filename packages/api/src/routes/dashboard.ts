import { Router } from "express";
import { logger } from "../config/logger.js";
import { prisma } from "../config/database.js";
import { verifyJWT, requireOwner } from "../middleware/auth.js";

const router = Router();

router.use(verifyJWT, requireOwner);

router.get("/summary", async (req, res) => {
  try {
    const { property_id } = req.query;

    const where: any = { owner_id: req.user!.id, deleted_at: null };
    if (property_id) where.id = String(property_id);

    const properties = await prisma.properties.findMany({ where });

    const summaries = await Promise.all(
      properties.map(async (prop) => {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
        const lastMonthLabel = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;

        const [activeTenants, occupiedRooms, currentMonthBills, lastMonthBills, outstandingBills] = await Promise.all([
          prisma.tenants.count({ where: { property_id: prop.id, status: "active" } }),
          prisma.tenants.count({ where: { property_id: prop.id, status: "active" } }),
          prisma.bills.findMany({
            where: { property_id: prop.id, period_label: currentMonth, status: "paid" },
          }),
          prisma.bills.findMany({
            where: { property_id: prop.id, period_label: lastMonthLabel, status: "paid" },
          }),
          prisma.bills.aggregate({
            where: { property_id: prop.id, status: "pending", due_date: { lt: now } },
            _sum: { amount: true },
            _count: true,
          }),
        ]);

        const currentIncome = currentMonthBills.reduce((sum, b) => sum + b.amount, 0);
        const lastIncome = lastMonthBills.reduce((sum, b) => sum + b.amount, 0);
        const incomeChange = lastIncome > 0 ? Math.round(((currentIncome - lastIncome) / lastIncome) * 100) : 0;

        return {
          property_id: prop.id,
          property_name: prop.name,
          total_active_tenants: activeTenants,
          occupied_rooms: occupiedRooms,
          total_rooms: prop.total_rooms,
          occupancy_rate: prop.total_rooms > 0 ? Math.round((occupiedRooms / prop.total_rooms) * 100) : 0,
          current_month_income: currentIncome,
          last_month_income: lastIncome,
          income_change_pct: incomeChange,
          outstanding_bills: outstandingBills._sum.amount || 0,
          outstanding_count: outstandingBills._count,
          avg_daily_payment: 0,
        };
      })
    );

    res.json({ summaries });
  } catch (error) {
    logger.error("Dashboard summary error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/revenue", async (req, res) => {
  try {
    const { property_id } = req.query;
    const months = 6;
    const data: { month: string; income: number }[] = [];

    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      const where: any = {
        property: { owner_id: req.user!.id, deleted_at: null },
        period_label: label,
        status: "paid",
      };

      if (property_id) where.property_id = String(property_id);

      const result = await prisma.bills.aggregate({
        where,
        _sum: { amount: true },
      });

      data.push({ month: label, income: result._sum.amount || 0 });
    }

    res.json({ data });
  } catch (error) {
    logger.error("Revenue error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
