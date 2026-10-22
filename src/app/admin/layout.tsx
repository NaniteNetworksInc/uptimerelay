import Brand from "@/app/components/Brand";
import { getSiteSettings } from "@/lib/site/server";
import { Suspense } from "react";
import AdminNav from "./AdminNav";

import type { ReactNode } from "react";
import ThemeShell, { ThemeToggle } from "../(website)/ThemeShell";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> { const settings = await getSiteSettings(); return { title: { default: "Staff access", template: `%s | ${settings.name}` }, robots: { index: false, follow: false }, referrer: "no-referrer" }; }

async function copyrightYear() {
  "use cache";
  return new Date().getFullYear();
}

async function AdminBrandLayout({ children }: { children: ReactNode }) {
  const year = await copyrightYear();
  const settings = await getSiteSettings();
  return (
    <ThemeShell branding={{ accent: settings.accent, buttonColor: settings.buttonColor }} className="flex min-h-screen flex-col bg-(--page) text-(--ink) selection:bg-(--button) selection:text-(--button-ink)">
      <header className="mx-auto flex w-full max-w-260 flex-wrap items-center justify-between gap-6 px-6 pt-9 sm:px-8">
        <Brand settings={settings} />
        <Suspense fallback={null}><AdminNav /></Suspense>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-14 sm:py-20">{children}</main>
      <footer className="mx-auto flex w-full max-w-260 items-center justify-between gap-4 px-6 pb-8 text-xs text-(--muted) sm:px-8">
        <span>© {year} {settings.copyright}</span><ThemeToggle />
      </footer>
    </ThemeShell>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) { return <Suspense fallback={<p>Loading staff area…</p>}><AdminBrandLayout>{children}</AdminBrandLayout></Suspense>; }
