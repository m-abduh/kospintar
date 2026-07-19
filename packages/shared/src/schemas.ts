import { z } from "zod";

export const phoneRegex = /^62\d{9,13}$/;

export const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255).toLowerCase(),
  password: z.string().min(8).regex(/[a-zA-Z]/, "Password must contain letters").regex(/\d/, "Password must contain numbers"),
  phone: z.string().regex(phoneRegex, "Phone must start with 62 and be min 10 digits"),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export const propertySchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().optional(),
  total_rooms: z.number().int().positive(),
  photo_url: z.string().url().optional(),
});

export const tenantSchema = z.object({
  property_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  phone: z.string().regex(phoneRegex),
  room_number: z.string().min(1).max(20),
  rent_amount: z.number().int().positive(),
  deposit: z.number().int().min(0).optional(),
  due_date_override: z.number().int().min(1).max(28).optional().nullable(),
  contract_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  contract_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
});

export const billSchema = z.object({
  tenant_id: z.string().uuid(),
  property_id: z.string().uuid(),
  amount: z.number().int().positive(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period_label: z.string().regex(/^\d{4}-\d{2}$/),
});

export const billVoidSchema = z.object({
  void_reason: z.string().min(1).max(200),
});

export const ticketUpdateSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

export const ticketReplySchema = z.object({
  message: z.string().min(1),
});

export const chatSendSchema = z.object({
  tenant_id: z.string().uuid(),
  message: z.string().min(1),
});

export const waConnectSchema = z.object({
  property_id: z.string().uuid(),
  phone_number: z.string().regex(phoneRegex),
});

export const waSendSchema = z.object({
  property_id: z.string().uuid(),
  to: z.string().regex(phoneRegex),
  message: z.string().min(1),
});

export const paymentStatusSchema = z.object({
  bill_id: z.string().uuid(),
  status: z.enum(["pending", "paid", "expired", "void"]),
  paid_at: z.string().datetime().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PropertyInput = z.infer<typeof propertySchema>;
export type TenantInput = z.infer<typeof tenantSchema>;
export type BillInput = z.infer<typeof billSchema>;
export type BillVoidInput = z.infer<typeof billVoidSchema>;
export type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>;
export type TicketReplyInput = z.infer<typeof ticketReplySchema>;
export type ChatSendInput = z.infer<typeof chatSendSchema>;
export type WaConnectInput = z.infer<typeof waConnectSchema>;
export type WaSendInput = z.infer<typeof waSendSchema>;
