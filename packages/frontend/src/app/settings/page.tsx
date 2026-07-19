"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState({ name: "", phone: "" });

  useEffect(() => {
    apiFetch("/api/auth/me").then((d) => {
      setUser(d.user);
      setEdit({ name: d.user.name, phone: d.user.phone || "" });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const d = await apiFetch("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify(edit),
      });
      setUser(d.user);
      setEdit({ name: d.user.name, phone: d.user.phone || "" });
      toast.success("Profil berhasil disimpan");
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan profil");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Pengaturan</h1>

        {loading ? (
          <div className="card animate-pulse h-48" />
        ) : user ? (
          <div className="card space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Nama</label>
              <input
                className="input w-full"
                value={edit.name}
                onChange={(e) => setEdit({ ...edit, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Email</label>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Telepon</label>
              <input
                className="input w-full"
                value={edit.phone}
                onChange={(e) => setEdit({ ...edit, phone: e.target.value })}
              />
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="font-medium capitalize">{user.role}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Terdaftar Sejak</p>
              <p className="font-medium">{new Date(user.created_at).toLocaleDateString("id-ID")}</p>
            </div>
            <hr />
            <div>
              <p className="text-sm text-gray-500 mb-2">Tier: <span className="font-medium text-primary-600">Free</span></p>
              <p className="text-xs text-gray-400">Max 3 properti, 50 penghuni/properti, 500 pesan WA/bulan</p>
            </div>
            <button
              className="btn btn-primary w-full"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        ) : (
          <div className="card text-center py-8"><p className="text-gray-500">Gagal memuat profil</p></div>
        )}
      </div>
    </AppLayout>
  );
}
