"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      localStorage.setItem("token", data.token);
      toast.success("Registrasi berhasil!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">Kospintar</h1>
          <p className="text-gray-500 mt-2">Buat akun baru</p>
        </div>
        <form onSubmit={handleRegister} className="card space-y-4">
          <div>
            <label className="label">Nama</label>
            <input type="text" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
            <p className="text-xs text-gray-500 mt-1">Min 8 karakter, kombinasi huruf + angka</p>
          </div>
          <div>
            <label className="label">Nomor HP (62xx)</label>
            <input type="text" className="input" placeholder="62812xxxxxxx" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Loading..." : "Daftar"}
          </button>
          <p className="text-center text-sm text-gray-500">
            Sudah punya akun? <Link href="/login" className="text-primary-600 hover:underline">Masuk</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
