"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { apiFetch, formatRupiah } from "@/lib/api";

interface Tenant {
  id: string;
  name: string;
  phone: string;
  room_number: string;
  rent_amount: number;
  status: string;
  property: { id: string; name: string };
}

export default function TenantsPage() {
  const searchParams = useSearchParams();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterProperty, setFilterProperty] = useState(searchParams.get("property_id") || "");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => { loadTenants(); }, [filterProperty, filterStatus]);

  async function loadTenants() {
    setLoading(true);
    try {
      let url = `/api/tenants?search=${search}`;
      if (filterProperty) url += `&property_id=${filterProperty}`;
      if (filterStatus) url += `&status=${filterStatus}`;
      const data = await apiFetch(url);
      setTenants(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Penghuni</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola data penghuni</p>
        </div>
        <Link href="/tenants/new" className="btn-primary">+ Tambah Penghuni</Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" placeholder="Cari nama..." className="input flex-1 max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadTenants()} />
        <select className="input max-w-xs" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="checkout">Checkout</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="card animate-pulse h-16" />)}
        </div>
      ) : tenants.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-5xl mb-4">👤</p>
          <p className="text-gray-500">Belum ada penghuni</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tenants.map((t) => (
            <Link key={t.id} href={`/tenants/${t.id}`} className="card flex justify-between items-center hover:shadow-md transition-shadow">
              <div>
                <p className="font-medium text-gray-900">{t.name}</p>
                <p className="text-sm text-gray-500">Kamar {t.room_number} &middot; {t.property.name}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">{formatRupiah(t.rent_amount)}/bln</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {t.status === "active" ? "Aktif" : "Checkout"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
