"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", address: "", total_rooms: 1 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProperty();
  }, [params.id]);

  async function loadProperty() {
    try {
      const data = await apiFetch(`/api/properties/${params.id}`);
      const p = data.property;
      setForm({ name: p.name, address: p.address || "", total_rooms: p.total_rooms });
    } catch (err: any) {
      toast.error(err.message);
      router.push("/properties");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch(`/api/properties/${params.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...form, total_rooms: Number(form.total_rooms) }),
      });
      toast.success("Properti berhasil diupdate!");
      router.push(`/properties/${params.id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout>
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Properti</h1>
        {loading ? (
          <div className="card animate-pulse h-64" />
        ) : (
          <form onSubmit={handleSubmit} className="card space-y-4">
            <div>
              <label className="label">Nama Properti</label>
              <input type="text" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Alamat</label>
              <textarea className="input" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <label className="label">Jumlah Kamar</label>
              <input type="number" className="input" min={1} value={form.total_rooms} onChange={(e) => setForm({ ...form, total_rooms: parseInt(e.target.value) || 1 })} required />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
              <button type="button" className="btn-secondary" onClick={() => router.back()}>Batal</button>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
