import Link from "next/link";
import { MoveLeft, HelpCircle } from "lucide-react";

export const metadata = {
  title: "Page Not Found",
};

export default function Custom404() {
  return (
    <main className="min-h-[85vh] flex items-center justify-center px-6 font-sans">
      <div className="max-w-2xl w-full text-center relative">
        {/* Subtle Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#2BB2FF]/5 blur-[120px] pointer-events-none" />

        <div className="relative z-10">
          {/* Diagnostic Code */}
          <span className="text-[#2BB2FF] font-black text-xs tracking-[0.5em] uppercase mb-4 block">
            Error Diagnostic: 404
          </span>

          <h1 className="text-8xl md:text-9xl font-black text-white tracking-tighter drop-shadow-[0_0_30px_rgba(43,178,255,0.2)]">
            LOST.
          </h1>

          <h2 className="mt-6 text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
            Instance Not Found
          </h2>

          <p className="mt-4 text-slate-400 text-lg max-w-md mx-auto leading-relaxed">
            The path you followed does not exist on the Ezrinix network. 
            The resource may have been moved or decommissioned.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="group flex items-center justify-center gap-2 rounded-full bg-white text-[#05070A] px-8 py-4 font-black transition-all hover:bg-slate-200 uppercase text-xs tracking-widest"
            >
              <MoveLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Return to HQ
            </Link>

            <Link
              href="/contact"
              className="flex items-center justify-center gap-2 rounded-full border border-slate-800 text-slate-400 px-8 py-4 font-bold transition-all hover:border-[#2BB2FF] hover:text-[#2BB2FF] uppercase text-xs tracking-widest bg-[#0D1117]/50"
            >
              <HelpCircle size={16} />
              Support Desk
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}