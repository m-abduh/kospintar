"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export default function NewPropertyPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", address: "", total_rooms: 1 });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/api/properties", {
        method: "POST",
        body: JSON.stringify({ ...form, total_rooms: Number(form.total_rooms) }),
      });
      toast.success("Properti berhasil ditambahkan!");
      router.push("/properties");
    } catch (err: any) {
      toast.error(err.message || "Gagal menambah properti");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Tambah Properti</h1>
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label">Nama Properti</label>
            <input type="text" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Contoh: Kos Bahagia" />
          </div>
          <div>
            <label className="label">Alamat</label>
            <textarea className="input" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Jl. Contoh No. 123" />
          </div>
          <div>
            <label className="label">Jumlah Kamar</label>
            <input type="number" className="input" min={1} value={form.total_rooms} onChange={(e) => setForm({ ...form, total_rooms: parseInt(e.target.value) || 1 })} required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => router.back()}>Batal</button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
