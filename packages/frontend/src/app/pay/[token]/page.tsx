"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatRupiah } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function PayPage() {
  const params = useParams();
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    checkStatus();
  }, [params.token]);

  async function checkStatus() {
    try {
      const res = await fetch(`${API_URL}/api/pay/${params.token}/status`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Link tidak valid"); return; }
      setBill(data.bill);
    } catch { setError("Gagal memuat data tagihan"); }
    finally { setLoading(false); }
  }

  async function handlePay() {
    setPaying(true);
    try {
      const res = await fetch(`${API_URL}/api/pay/${params.token}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Gagal memproses pembayaran"); setPaying(false); return; }
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      }
    } catch { setError("Gagal terhubung ke payment gateway"); setPaying(false); }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="card animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mx-auto mb-4" />
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-8" />
          <div className="h-12 bg-gray-200 rounded w-full" />
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm card text-center py-8">
        <p className="text-5xl mb-4">❌</p>
        <p className="text-gray-700 font-medium mb-2">Link Tidak Valid</p>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    </div>
  );

  if (bill?.status === "paid") return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm card text-center py-8">
        <p className="text-5xl mb-4">✅</p>
        <p className="text-gray-700 font-medium mb-2">Sudah Lunas</p>
        <p className="text-sm text-gray-500">Tagihan {bill.period_label} sudah dibayar.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary-600">Kospintar</h1>
          <p className="text-gray-500 text-sm mt-1">Pembayaran Tagihan Kos</p>
        </div>
        <div className="card space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">{bill.period_label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{formatRupiah(bill.amount)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Status</p>
            <p className={`font-medium ${bill.status === "paid" ? "text-green-600" : "text-yellow-600"}`}>
              {bill.status === "paid" ? "Lunas" : "Belum Dibayar"}
            </p>
          </div>
          {bill.status === "pending" && (
            <button
              onClick={handlePay}
              disabled={paying}
              className="btn-primary w-full py-3 text-lg"
            >
              {paying ? "Memproses..." : "Bayar Sekarang"}
            </button>
          )}
          <p className="text-xs text-gray-400 text-center">
            Pembayaran diproses oleh Midtrans (QRIS/VA/Bank Transfer)
          </p>
        </div>
      </div>
    </div>
  );
}
