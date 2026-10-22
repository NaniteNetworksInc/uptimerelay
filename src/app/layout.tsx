import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/globals.css";

export const metadata: Metadata = {
  icons: { icon: "/api/site-icon", apple: "/api/site-icon" },
  title: {
    default: "UptimeRelay",
    template: "%s | UptimeRelay",
  },
  description:
    "Current service status, incident updates, and scheduled maintenance.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="scroll-pt-7 scroll-smooth motion-reduce:scroll-auto">
      <body className="min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}