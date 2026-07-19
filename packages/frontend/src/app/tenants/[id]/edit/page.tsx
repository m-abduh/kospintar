"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export default function EditTenantPage() {
  const params = useParams();
  const router = useRouter();
  const [form, setForm] = useState({
    property_id: "", name: "", phone: "", room_number: "",
    rent_amount: "", deposit: "",
    contract_start: "", contract_end: "",
    due_date_override: "",
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadTenant(); }, [params.id]);

  async function loadTenant() {
    try {
      const data = await apiFetch(`/api/tenants/${params.id}`);
      const t = data.tenant;
      setForm({
        property_id: t.property_id,
        name: t.name,
        phone: t.phone,
        room_number: t.room_number,
        rent_amount: String(t.rent_amount / 100),
        deposit: String(t.deposit / 100),
        contract_start: t.contract_start?.split("T")[0] || "",
        contract_end: t.contract_end?.split("T")[0] || "",
        due_date_override: t.due_date_override ? String(t.due_date_override) : "",
        notes: t.notes || "",
      });
    } catch (err: any) {
      toast.error(err.message);
      router.push("/tenants");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch(`/api/tenants/${params.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          rent_amount: Number(form.rent_amount) * 100,
          deposit: Number(form.deposit || 0) * 100,
          due_date_override: form.due_date_override ? Number(form.due_date_override) : null,
        }),
      });
      toast.success("Penghuni berhasil diupdate!");
      router.push(`/tenants/${params.id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout>
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Penghuni</h1>
        {loading ? (
          <div className="card animate-pulse h-64" />
        ) : (
          <form onSubmit={handleSubmit} className="card space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Nama</label>
                <input type="text" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="label">No. HP</label>
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
            <div>
              <label className="label">Due Date Override (1-28, kosongkan = tgl 10)</label>
              <input type="number" className="input" min={1} max={28} value={form.due_date_override} onChange={(e) => setForm({ ...form, due_date_override: e.target.value })} />
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
              <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
              <button type="button" className="btn-secondary" onClick={() => router.back()}>Batal</button>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
