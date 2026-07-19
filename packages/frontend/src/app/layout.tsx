import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Kospintar - Manajemen Kos",
  description: "SaaS manajemen kos all-in-one via dashboard + WhatsApp",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
