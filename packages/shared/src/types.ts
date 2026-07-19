export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  phone: string;
  role: "owner";
  is_active: boolean;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Property {
  id: string;
  owner_id: string;
  name: string;
  address: string | null;
  total_rooms: number;
  photo_url: string | null;
  is_active: boolean;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Tenant {
  id: string;
  property_id: string;
  name: string;
  phone: string;
  room_number: string;
  rent_amount: number;
  deposit: number;
  due_date_override: number | null;
  contract_start: Date;
  contract_end: Date;
  status: "active" | "checkout";
  ktp_url: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Bill {
  id: string;
  tenant_id: string;
  property_id: string;
  amount: number;
  due_date: Date;
  period_label: string;
  status: "pending" | "paid" | "expired" | "void";
  paid_at: Date | null;
  midtrans_order_id: string | null;
  void_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentLog {
  id: string;
  bill_id: string;
  midtrans_transaction_id: string;
  midtrans_order_id: string;
  status: "pending" | "settlement" | "expire" | "deny" | "cancel" | "failure";
  gross_amount: number;
  raw_response: Record<string, unknown>;
  created_at: Date;
}

export interface Ticket {
  id: string;
  property_id: string;
  tenant_id: string | null;
  ticket_number: string;
  title: string;
  description: string | null;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  source: "wa" | "manual";
  wa_message_id: string | null;
  closed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ChatMessage {
  id: string;
  ticket_id: string | null;
  tenant_id: string;
  property_id: string;
  direction: "outgoing" | "incoming";
  message_body: string;
  wa_message_id: string | null;
  status: "sent" | "delivered" | "read" | "failed";
  created_at: Date;
}

export interface MessageTemplate {
  id: string;
  property_id: string | null;
  name: string;
  body: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface WaInstance {
  id: string;
  property_id: string;
  instance_name: string;
  phone_number: string;
  connection_status: "connected" | "disconnected" | "connecting" | "expired";
  last_connected_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface NotificationLog {
  id: string;
  bill_id: string | null;
  ticket_id: string | null;
  chat_message_id: string | null;
  type: "reminder" | "payment_confirmation" | "ticket_reply" | "ticket_created";
  recipient_phone: string;
  message_body: string;
  status: "sent" | "delivered" | "failed";
  error_message: string | null;
  sent_at: Date;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string;
  created_at: Date;
}

export interface CronLog {
  id: string;
  job_name: string;
  status: "running" | "completed" | "failed";
  started_at: Date;
  finished_at: Date | null;
  summary: Record<string, unknown> | null;
  error_message: string | null;
}

export interface DashboardSummary {
  property_id: string;
  property_name: string;
  total_active_tenants: number;
  occupied_rooms: number;
  total_rooms: number;
  occupancy_rate: number;
  current_month_income: number;
  last_month_income: number;
  income_change_pct: number;
  outstanding_bills: number;
  avg_daily_payment: number;
}

export interface RevenueData {
  month: string;
  income: number;
}

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export interface PayTokenPayload {
  bill_id: string;
  tenant_phone: string;
  exp: number;
}
