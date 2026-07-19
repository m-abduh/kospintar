"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/auth/me").then((d) => setUser(d.user)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Pengaturan</h1>

        {loading ? (
          <div className="card animate-pulse h-48" />
        ) : user ? (
          <div className="card space-y-4">
            <div>
              <p className="text-sm text-gray-500">Nama</p>
              <p className="font-medium">{user.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Telepon</p>
              <p className="font-medium">{user.phone}</p>
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
          </div>
        ) : (
          <div className="card text-center py-8"><p className="text-gray-500">Gagal memuat profil</p></div>
        )}
      </div>
    </AppLayout>
  );
}
