"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDown, Settings, LogOut, ShieldCheck } from "lucide-react";
export default function AccountMenu({
  staff,
}: {
  staff: {
    name: string;
    email: string;
    avatar: string | null;
    mfaEnabled: boolean;
  };
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  async function signOut() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      router.replace("/admin/login");
      router.refresh();
    } catch {
      setError("Unable to sign out. Try again.");
    } finally {
      setPending(false);
    }
  }
  const initials = staff.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="account-dropdown"
        aria-label={`Account menu for ${staff.name}`}
        className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg p-1 focus-visible:outline-2 focus-visible:outline-(--accent)"
      >
        {staff.avatar ? (
          <Image
            src={staff.avatar}
            alt=""
            width={36}
            height={36}
            unoptimized
            className="size-9 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-9 items-center justify-center rounded-full border border-(--tag-line) bg-(--group-bg) text-xs font-semibold text-(--tag-ink)">
            {initials}
          </span>
        )}
        <ChevronDown size={13} aria-hidden="true" />
      </button>
      {open && (
        <div
          id="account-dropdown"
          className="absolute top-full right-0 z-30 mt-2 w-64 rounded-xl border border-(--line) bg-(--panel-bg) p-2 shadow-lg shadow-black/10"
        >
          <div className="border-b border-(--line) px-3 py-3">
            <p className="text-sm font-semibold">{staff.name}</p>
            <p className="mt-1 truncate text-xs text-(--muted)">
              {staff.email}
            </p>
          </div>
          <Link
            onClick={() => setOpen(false)}
            href="/admin/account"
            className="mt-1 flex min-h-11 items-center gap-3 rounded-md px-3 text-sm hover:bg-(--hover)"
          >
            <Settings size={16} />
            Account & security
          </Link>
          <p className="flex items-center gap-3 px-3 py-2 text-xs text-(--muted)">
            <ShieldCheck size={15} />
            2FA {staff.mfaEnabled ? "enabled" : "not enabled"}
          </p>
          <button
            onClick={signOut}
            disabled={pending}
            className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-sm text-(--tag-ink) hover:bg-(--hover) disabled:opacity-50"
          >
            <LogOut size={16} />
            {pending ? "Signing out…" : "Sign out"}
          </button>
          {error && (
            <p role="alert" className="px-3 py-2 text-xs text-(--tag-ink)">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
