"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { apiFetch, formatRupiah, formatDate } from "@/lib/api";
import { toast } from "sonner";

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTenant(); }, [params.id]);

  async function loadTenant() {
    try {
      const data = await apiFetch(`/api/tenants/${params.id}`);
      setTenant(data.tenant);
    } catch (err: any) { toast.error(err.message); router.push("/tenants"); }
    finally { setLoading(false); }
  }

  async function handleCheckout() {
    if (!confirm("Checkout penghuni ini? Tagihan prorata akan dibuat otomatis.")) return;
    try {
      await apiFetch(`/api/tenants/${params.id}`, { method: "DELETE" });
      toast.success("Penghuni di-checkout");
      router.push("/tenants");
    } catch (err: any) { toast.error(err.message); }
  }

  if (loading) return <AppLayout><div className="card animate-pulse h-48" /></AppLayout>;
  if (!tenant) return null;

  return (
    <AppLayout>
      <div className="max-w-lg">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
            <p className="text-gray-500">Kamar {tenant.room_number} &middot; {tenant.property.name}</p>
          </div>
          <div className="flex gap-2">
            <a href={`/tenants/${params.id}/edit`} className="btn-secondary text-sm">Edit</a>
            {tenant.status === "active" && <button onClick={handleCheckout} className="btn-danger text-sm">Checkout</button>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card"><p className="text-sm text-gray-500">Sewa/Bulan</p><p className="font-bold">{formatRupiah(tenant.rent_amount)}</p></div>
          <div className="card"><p className="text-sm text-gray-500">Deposit</p><p className="font-bold">{formatRupiah(tenant.deposit)}</p></div>
          <div className="card"><p className="text-sm text-gray-500">Status</p><p className="font-bold">{tenant.status === "active" ? "Aktif" : "Checkout"}</p></div>
          <div className="card"><p className="text-sm text-gray-500">HP</p><p className="font-bold">{tenant.phone}</p></div>
        </div>

        <div className="card mb-6">
          <p className="text-sm text-gray-500 mb-1">Kontrak</p>
          <p className="font-medium">{formatDate(tenant.contract_start)} - {formatDate(tenant.contract_end)}</p>
        </div>

        {tenant.bills?.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Riwayat Tagihan</h2>
            <div className="space-y-2">
              {tenant.bills.map((b: any) => (
                <div key={b.id} className="card flex justify-between items-center py-3">
                  <div>
                    <p className="font-medium">{b.period_label}</p>
                    <p className="text-sm text-gray-500">{formatRupiah(b.amount)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    b.status === "paid" ? "bg-green-100 text-green-700" :
                    b.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    "bg-gray-100 text-gray-500"
                  }`}>{b.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
