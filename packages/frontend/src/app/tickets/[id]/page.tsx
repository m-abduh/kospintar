"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { apiFetch, formatDate } from "@/lib/api";
import { toast } from "sonner";

export default function TicketDetailPage() {
  const params = useParams();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => { loadTicket(); }, [params.id]);

  async function loadTicket() {
    try {
      const data = await apiFetch(`/api/tickets/${params.id}`);
      setTicket(data.ticket);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  async function handleStatusChange(status: string) {
    try {
      await apiFetch(`/api/tickets/${params.id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      toast.success("Status updated");
      loadTicket();
    } catch (err: any) { toast.error(err.message); }
  }

  async function handleReply() {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await apiFetch(`/api/tickets/${params.id}/reply`, {
        method: "POST",
        body: JSON.stringify({ message: replyText }),
      });
      toast.success("Balasan terkirim!");
      setReplyText("");
      loadTicket();
    } catch (err: any) { toast.error(err.message); }
    finally { setSending(false); }
  }

  if (loading) return <AppLayout><div className="card animate-pulse h-48" /></AppLayout>;
  if (!ticket) return null;

  return (
    <AppLayout>
      <div className="max-w-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="font-mono text-sm text-gray-400">#{ticket.ticket_number}</p>
            <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {ticket.tenant ? `${ticket.tenant.name} - Kamar ${ticket.tenant.room_number}` : "Manual"} &middot; {ticket.property.name}
            </p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            ticket.priority === "high" ? "bg-red-100 text-red-700" :
            ticket.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
            "bg-blue-100 text-blue-700"
          }`}>{ticket.priority}</span>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {["open", "in_progress", "resolved", "closed"].map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`text-xs px-3 py-1 rounded-full border ${
                ticket.status === s ? "bg-primary-100 text-primary-700 border-primary-300" : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >{s.replace("_", " ")}</button>
          ))}
        </div>

        {ticket.description && (
          <div className="card mb-4">
            <p className="text-sm text-gray-500 mb-1">Deskripsi</p>
            <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
          </div>
        )}

        {ticket.chat_messages?.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Chat</h2>
            <div className="space-y-2">
              {ticket.chat_messages.map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.direction === "outgoing" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                    msg.direction === "outgoing"
                      ? "bg-primary-500 text-white rounded-br-none"
                      : "bg-gray-200 text-gray-800 rounded-bl-none"
                  }`}>
                    <p>{msg.message_body}</p>
                    <p className={`text-xs mt-1 ${msg.direction === "outgoing" ? "text-primary-200" : "text-gray-400"}`}>
                      {formatDate(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <p className="label mb-2">Balas Pesan</p>
          <textarea
            className="input mb-2"
            rows={3}
            placeholder="Tulis balasan..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <button onClick={handleReply} className="btn-primary w-full" disabled={sending || !replyText.trim()}>
            {sending ? "Mengirim..." : "Kirim Balasan"}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
