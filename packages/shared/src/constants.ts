export * from "./types.js";
export * from "./schemas.js";

export const FREE_TIER = {
  MAX_PROPERTIES: 3,
  MAX_TENANTS_PER_PROPERTY: 50,
  MAX_WA_MESSAGES_PER_MONTH: 500,
} as const;

export const MONEY_SCALE = 1_000_000 as const;

export function senToRupiah(sen: number): string {
  const rp = sen / MONEY_SCALE;
  return `Rp ${rp.toLocaleString("id-ID")}`;
}

export function rupiahToSen(rp: number): number {
  return rp * MONEY_SCALE;
}

export function generateMidtransOrderId(billId: string): string {
  const last8 = billId.replace(/-/g, "").slice(0, 8);
  const random4 = Math.floor(1000 + Math.random() * 9000);
  return `KSP-${last8}-${random4}`;
}

export function generateTicketNumber(id: number): string {
  return `TKT-${String(id).padStart(6, "0")}`;
}
