"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { apiFetch, formatRupiah, formatDate } from "@/lib/api";
import { toast } from "sonner";

export default function BillDetailPage() {
  const params = useParams();
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadBill(); }, [params.id]);

  async function loadBill() {
    try {
      const data = await apiFetch(`/api/bills/${params.id}`);
      setBill(data.bill);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  async function handleVoid() {
    const reason = prompt("Alasan void:");
    if (!reason) return;
    try {
      await apiFetch(`/api/bills/${params.id}/void`, {
        method: "PUT",
        body: JSON.stringify({ void_reason: reason }),
      });
      toast.success("Tagihan di-void");
      loadBill();
    } catch (err: any) { toast.error(err.message); }
  }

  async function handlePay() {
    try {
      const token = generatePayToken(bill.id, bill.tenant.phone);
      await navigator.clipboard.writeText(`${window.location.origin}/pay/${token}`);
      toast.success("Link pembayaran disalin!");
    } catch {
      toast.error("Gagal menyalin link");
    }
  }

  if (loading) return <AppLayout><div className="card animate-pulse h-48" /></AppLayout>;
  if (!bill) return null;

  return (
    <AppLayout>
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Detail Tagihan</h1>

        <div className="card space-y-4 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-500">Penghuni</span>
            <span className="font-medium">{bill.tenant.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Kamar</span>
            <span className="font-medium">{bill.tenant.room_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Properti</span>
            <span className="font-medium">{bill.property.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Periode</span>
            <span className="font-medium">{bill.period_label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Jumlah</span>
            <span className="text-xl font-bold text-gray-900">{formatRupiah(bill.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Jatuh Tempo</span>
            <span className="font-medium">{formatDate(bill.due_date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span className={`text-sm px-3 py-1 rounded-full font-medium ${
              bill.status === "paid" ? "bg-green-100 text-green-700" :
              bill.status === "pending" ? "bg-yellow-100 text-yellow-700" :
              bill.status === "expired" ? "bg-red-100 text-red-700" :
              "bg-gray-100 text-gray-500"
            }`}>{bill.status.toUpperCase()}</span>
          </div>
          {bill.paid_at && (
            <div className="flex justify-between">
              <span className="text-gray-500">Dibayar</span>
              <span className="font-medium">{formatDate(bill.paid_at)}</span>
            </div>
          )}
        </div>

        {bill.status === "pending" && (
          <div className="flex gap-3 mb-6">
            <button onClick={handlePay} className="btn-primary flex-1">Kirim Link Bayar</button>
            <button onClick={handleVoid} className="btn-danger">Void</button>
          </div>
        )}

        {bill.payment_logs?.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Payment Logs</h2>
            <div className="space-y-2">
              {bill.payment_logs.map((log: any) => (
                <div key={log.id} className="card py-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">{log.midtrans_order_id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      log.status === "settlement" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>{log.status}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{formatRupiah(log.gross_amount)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function generatePayToken(billId: string, phone: string): string {
  return btoa(JSON.stringify({ bill_id: billId, tenant_phone: phone }));
}
