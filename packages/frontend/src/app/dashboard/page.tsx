"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { apiFetch, formatRupiah } from "@/lib/api";

interface Summary {
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
  outstanding_count: number;
}

interface RevenuePoint {
  month: string;
  income: number;
}

export default function DashboardPage() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sumData, revData] = await Promise.all([
          apiFetch("/api/dashboard/summary"),
          apiFetch("/api/dashboard/revenue"),
        ]);
        setSummaries(sumData.summaries || []);
        setRevenue(revData.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalIncome = summaries.reduce((s, x) => s + x.current_month_income, 0);
  const totalTenants = summaries.reduce((s, x) => s + x.total_active_tenants, 0);
  const totalRooms = summaries.reduce((s, x) => s + x.total_rooms, 0);
  const totalOccupied = summaries.reduce((s, x) => s + x.occupied_rooms, 0);
  const totalOutstanding = summaries.reduce((s, x) => s + x.outstanding_bills, 0);

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Ringkasan properti kos kamu</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="card">
              <p className="text-sm text-gray-500">Pemasukan Bulan Ini</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatRupiah(totalIncome)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500">Total Penghuni</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalTenants}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500">Okupansi</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {totalRooms > 0 ? Math.round((totalOccupied / totalRooms) * 100) : 0}%
              </p>
              <p className="text-xs text-gray-400">{totalOccupied}/{total_rooms(totalRooms)} kamar</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500">Tagihan Outstanding</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{formatRupiah(totalOutstanding)}</p>
            </div>
          </div>

          {summaries.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500 mb-4">Belum ada properti</p>
              <a href="/properties/new" className="btn-primary">Tambah Properti Pertama</a>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Detail Properti</h2>
              {summaries.map((s) => (
                <div key={s.property_id} className="card">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{s.property_name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {s.total_active_tenants} penghuni aktif &middot; {s.occupancy_rate}% okupansi
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatRupiah(s.current_month_income)}</p>
                      {s.income_change_pct !== 0 && (
                        <p className={`text-xs ${s.income_change_pct > 0 ? "text-green-600" : "text-red-600"}`}>
                          {s.income_change_pct > 0 ? "↑" : "↓"} {Math.abs(s.income_change_pct)}%
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {revenue.length > 0 && (
            <div className="card mt-8">
              <h2 className="text-lg font-semibold mb-4">Pemasukan 6 Bulan</h2>
              <div className="space-y-2">
                {revenue.map((r) => (
                  <div key={r.month} className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 w-20">{r.month}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-primary-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min((r.income / Math.max(...revenue.map((x) => x.income), 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-28 text-right">{formatRupiah(r.income)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}

function total_rooms(x: number) { return x; }
