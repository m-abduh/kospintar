"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface Property { id: string; name: string; }

export default function NewTenantPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [form, setForm] = useState({
    property_id: "", name: "", phone: "", room_number: "",
    rent_amount: "", deposit: "",
    contract_start: "", contract_end: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch("/api/properties").then((d) => setProperties(d.data || [])).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/api/tenants", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          rent_amount: Number(form.rent_amount) * 1_000_000,
          deposit: Number(form.deposit || 0) * 1_000_000,
        }),
      });
      toast.success("Penghuni berhasil ditambahkan!");
      router.push("/tenants");
    } catch (err: any) {
      toast.error(err.message);
    } finally { setLoading(false); }
  }

  return (
    <AppLayout>
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Tambah Penghuni</h1>
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label">Properti</label>
            <select className="input" value={form.property_id} onChange={(e) => setForm({ ...form, property_id: e.target.value })} required>
              <option value="">Pilih properti</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nama</label>
              <input type="text" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">No. HP (62xx)</label>
              <input type="text" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">No. Kamar</label>
              <input type="text" className="input" value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} required />
            </div>
            <div>
              <label className="label">Sewa/Bulan (Rp)</label>
              <input type="number" className="input" value={form.rent_amount} onChange={(e) => setForm({ ...form, rent_amount: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="label">Deposit (Rp)</label>
            <input type="number" className="input" value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Kontrak Mulai</label>
              <input type="date" className="input" value={form.contract_start} onChange={(e) => setForm({ ...form, contract_start: e.target.value })} required />
            </div>
            <div>
              <label className="label">Kontrak Selesai</label>
              <input type="date" className="input" value={form.contract_end} onChange={(e) => setForm({ ...form, contract_end: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="label">Catatan</label>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</button>
            <button type="button" className="btn-secondary" onClick={() => router.back()}>Batal</button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
