"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export default function WaPage() {
  const params = useParams();
  const [status, setStatus] = useState<string>("disconnected");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => { checkStatus(); }, [params.propertyId]);

  async function checkStatus() {
    try {
      const data = await apiFetch(`/api/wa/status/${params.propertyId}`);
      setStatus(data.status);
    } catch { setStatus("disconnected"); }
    finally { setFetching(false); }
  }

  async function handleConnect() {
    if (!phone) { toast.error("Masukkan nomor HP"); return; }
    setLoading(true);
    try {
      const data = await apiFetch("/api/wa/connect", {
        method: "POST",
        body: JSON.stringify({ property_id: params.propertyId, phone_number: phone }),
      });
      setQrCode(data.qr_code);
      setStatus("connecting");
      toast.info("Scan QR code dengan WhatsApp kamu");
      pollStatus();
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  function pollStatus() {
    const interval = setInterval(async () => {
      try {
        const data = await apiFetch(`/api/wa/status/${params.propertyId}`);
        if (data.status === "connected") {
          setStatus("connected");
          setQrCode(null);
          toast.success("WhatsApp terhubung!");
          clearInterval(interval);
        }
      } catch {}
    }, 5000);
    setTimeout(() => clearInterval(interval), 120000);
  }

  async function handleDisconnect() {
    try {
      await apiFetch(`/api/wa/disconnect/${params.propertyId}`, { method: "POST" });
      setStatus("disconnected");
      setQrCode(null);
      toast.success("WhatsApp terputus");
    } catch (err: any) { toast.error(err.message); }
  }

  return (
    <AppLayout>
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">WhatsApp</h1>

        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${
              status === "connected" ? "bg-green-500" :
              status === "connecting" ? "bg-yellow-500 animate-pulse" :
              "bg-red-500"
            }`} />
            <span className="font-medium capitalize">{status}</span>
          </div>

          {status === "disconnected" && (
            <div className="space-y-3">
              <div>
                <label className="label">Nomor HP WhatsApp</label>
                <input type="text" className="input" placeholder="62812xxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <button onClick={handleConnect} className="btn-primary w-full" disabled={loading}>
                {loading ? "Menghubungkan..." : "Hubungkan WhatsApp"}
              </button>
            </div>
          )}

          {status === "connected" && (
            <button onClick={handleDisconnect} className="btn-danger w-full">Putuskan Koneksi</button>
          )}
        </div>

        {qrCode && (
          <div className="card text-center">
            <p className="text-sm text-gray-500 mb-4">Scan QR ini dengan WhatsApp</p>
            <img src={qrCode} alt="QR Code" className="mx-auto max-w-xs rounded-lg" />
            <p className="text-xs text-gray-400 mt-3">QR akan refresh otomatis</p>
          </div>
        )}

        {status === "connecting" && !qrCode && (
          <div className="card text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">Menunggu QR code...</p>
            <button onClick={checkStatus} className="btn-secondary mt-3 text-sm">Refresh</button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
