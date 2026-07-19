"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { apiFetch, formatRupiah } from "@/lib/api";
import { toast } from "sonner";

interface PropertyDetail {
  id: string;
  name: string;
  address: string | null;
  total_rooms: number;
  active_tenants: number;
  occupied_rooms: number;
  occupancy_rate: number;
  is_active: boolean;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProperty();
  }, [params.id]);

  async function loadProperty() {
    try {
      const data = await apiFetch(`/api/properties/${params.id}`);
      setProperty(data.property);
    } catch (err: any) {
      toast.error(err.message);
      router.push("/properties");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Yakin hapus properti?")) return;
    try {
      await apiFetch(`/api/properties/${params.id}`, { method: "DELETE" });
      toast.success("Properti dihapus");
      router.push("/properties");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="card animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-64 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-40" />
        </div>
      </AppLayout>
    );
  }

  if (!property) return null;

  return (
    <AppLayout>
      <div className="max-w-lg">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
            {property.address && <p className="text-gray-500 mt-1">{property.address}</p>}
          </div>
          <div className="flex gap-2">
            <a href={`/properties/${params.id}/edit`} className="btn-secondary text-sm">Edit</a>
            <button onClick={handleDelete} className="btn-danger text-sm">Hapus</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-gray-500">Total Kamar</p>
            <p className="text-xl font-bold">{property.total_rooms}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Okupansi</p>
            <p className="text-xl font-bold">{property.occupancy_rate}%</p>
            <p className="text-xs text-gray-400">{property.occupied_rooms}/{property.total_rooms} kamar terisi</p>
          </div>
        </div>

        <div className="flex gap-3">
          <a href={`/tenants?property_id=${params.id}`} className="btn-secondary flex-1 text-center">Lihat Penghuni</a>
          <a href={`/wa/${params.id}`} className="btn-secondary flex-1 text-center">Hubungkan WA</a>
        </div>
      </div>
    </AppLayout>
  );
}
