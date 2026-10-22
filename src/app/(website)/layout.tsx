import { Suspense } from "react";
import type { Metadata } from "next";
import Brand from "@/app/components/Brand";
import { getSiteSettings } from "@/lib/site/server";
import type { ReactNode } from "react";
import ThemeShell, { ThemeToggle } from "./ThemeShell";


async function copyrightYear() {
  "use cache";
  return new Date().getFullYear();
}

async function PublicBrandLayout({
  children,
}: {
  children: ReactNode;
}) {
  const year = await copyrightYear();
  const settings = await getSiteSettings();
  return (
    <ThemeShell branding={{ accent: settings.accent, buttonColor: settings.buttonColor }} className="min-h-screen bg-(--page) text-(--ink) selection:bg-(--button) selection:text-(--button-ink) [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-5 [&_a:focus-visible]:outline-(--accent) [&_summary:focus-visible]:outline-2 [&_summary:focus-visible]:outline-offset-[-3px] [&_summary:focus-visible]:outline-(--accent)">
      <a
        className="fixed -top-24 left-5 z-50 rounded-md bg-white px-4.5 py-3 text-black focus:top-3"
        href="#main"
      >
        Skip to service status
      </a>
      <header className="bg-transparent">
        <div className="mx-auto flex max-w-260 items-center px-8 pt-9 pb-2 max-[600px]:px-4.5 max-[600px]:pt-6">
          <Brand settings={settings} />
        </div>
      </header>
      <main
        id="main"
        className="mx-auto max-w-260 px-8 pt-13.5 pb-9 max-[600px]:px-4.5 max-[600px]:pt-8 max-[600px]:pb-6"
      >
        {children}
      </main>
      <footer className="mx-auto max-w-260 px-8 pb-8.75 text-xs text-(--muted) max-[600px]:px-4.5">
        <div className="flex items-center justify-between gap-4 border-t border-(--line) pt-6">
          <span>© {year} {settings.copyright}</span>
          <ThemeToggle />
        </div>
      </footer>
    </ThemeShell>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return { title: /status$/i.test(settings.name) ? settings.name : `${settings.name} Status`, description: settings.description };
}
export default function PublicLayout({ children }: { children: ReactNode }) { return <Suspense fallback={<div className="min-h-screen" />}><PublicBrandLayout>{children}</PublicBrandLayout></Suspense>; }
