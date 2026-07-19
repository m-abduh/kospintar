"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { apiFetch } from "@/lib/api";

interface Property {
  id: string;
  name: string;
  address: string | null;
  total_rooms: number;
  is_active: boolean;
  created_at: string;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadProperties();
  }, []);

  async function loadProperties() {
    try {
      const data = await apiFetch(`/api/properties?search=${search}`);
      setProperties(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properti</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola properti kos kamu</p>
        </div>
        <Link href="/properties/new" className="btn-primary">
          + Tambah Properti
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Cari properti..."
          className="input max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadProperties()}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-40 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-60 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-5xl mb-4">🏠</p>
          <p className="text-gray-500 mb-4">Belum ada properti</p>
          <Link href="/properties/new" className="btn-primary">Tambah Properti Pertama</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => (
            <Link key={p.id} href={`/properties/${p.id}`} className="card hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900">{p.name}</h3>
              {p.address && <p className="text-sm text-gray-500 mt-1">{p.address}</p>}
              <div className="flex items-center gap-4 mt-3">
                <span className="text-sm text-gray-600">🚪 {p.total_rooms} kamar</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {p.is_active ? "Aktif" : "Nonaktif"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
