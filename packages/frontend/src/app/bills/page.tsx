"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { apiFetch, formatRupiah } from "@/lib/api";

interface Bill {
  id: string;
  amount: number;
  due_date: string;
  period_label: string;
  status: string;
  paid_at: string | null;
  tenant: { id: string; name: string; room_number: string };
  property: { id: string; name: string };
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("");

  useEffect(() => { loadBills(); }, [filterStatus, filterPeriod]);

  async function loadBills() {
    setLoading(true);
    try {
      let url = "/api/bills?";
      if (filterStatus) url += `status=${filterStatus}&`;
      if (filterPeriod) url += `period_label=${filterPeriod}`;
      const data = await apiFetch(url);
      setBills(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tagihan</h1>
        <p className="text-gray-500 text-sm mt-1">Kelola tagihan sewa</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select className="input max-w-xs" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="expired">Expired</option>
          <option value="void">Void</option>
        </select>
        <input type="month" className="input max-w-xs" value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} />
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="card animate-pulse h-16" />)}</div>
      ) : bills.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-5xl mb-4">💰</p>
          <p className="text-gray-500">Belum ada tagihan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map((b) => (
            <a key={b.id} href={`/bills/${b.id}`} className="card flex justify-between items-center hover:shadow-md transition-shadow">
              <div>
                <p className="font-medium text-gray-900">{b.tenant.name} - Kamar {b.tenant.room_number}</p>
                <p className="text-sm text-gray-500">{b.property.name} &middot; {b.period_label}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatRupiah(b.amount)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  b.status === "paid" ? "bg-green-100 text-green-700" :
                  b.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                  b.status === "expired" ? "bg-red-100 text-red-700" :
                  "bg-gray-100 text-gray-500"
                }`}>{b.status}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
