"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { apiFetch } from "@/lib/api";

interface Ticket {
  id: string;
  ticket_number: string;
  title: string;
  status: string;
  priority: string;
  source: string;
  created_at: string;
  tenant: { name: string; room_number: string } | null;
  property: { name: string };
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  useEffect(() => { loadTickets(); }, [filterStatus, filterPriority]);

  async function loadTickets() {
    setLoading(true);
    try {
      let url = "/api/tickets?";
      if (filterStatus) url += `status=${filterStatus}&`;
      if (filterPriority) url += `priority=${filterPriority}`;
      const data = await apiFetch(url);
      setTickets(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tiket</h1>
        <p className="text-gray-500 text-sm mt-1">Komplain & laporan dari penghuni</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select className="input max-w-xs" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select className="input max-w-xs" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="">Semua Prioritas</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="card animate-pulse h-16" />)}</div>
      ) : tickets.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-5xl mb-4">🎫</p>
          <p className="text-gray-500">Belum ada tiket</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link key={t.id} href={`/tickets/${t.id}`} className="card flex justify-between items-center hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm text-gray-400">#{t.ticket_number}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    t.priority === "high" ? "bg-red-100 text-red-700" :
                    t.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>{t.priority}</span>
                </div>
                <p className="font-medium text-gray-900 mt-1">{t.title}</p>
                <p className="text-sm text-gray-500">
                  {t.tenant ? `${t.tenant.name} - Kamar ${t.tenant.room_number}` : "Manual"} &middot; {t.property.name}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                t.status === "open" ? "bg-blue-100 text-blue-700" :
                t.status === "in_progress" ? "bg-yellow-100 text-yellow-700" :
                t.status === "resolved" ? "bg-green-100 text-green-700" :
                "bg-gray-100 text-gray-500"
              }`}>{t.status.replace("_", " ")}</span>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
