import Link from "next/link";
import { currentStaff } from "@/lib/auth/server";
import AccountMenu from "./AccountMenu";
export default async function AdminNav() {
  const staff = await currentStaff();
  if (!staff) return null;
  return <nav aria-label="Admin navigation" className="flex flex-wrap items-center gap-4 text-xs sm:gap-6"><Link href="/admin" className="hover:text-(--accent)">Incidents</Link><Link href="/admin/components" className="hover:text-(--accent)">Components</Link>{staff.role === "owner" && <><Link href="/admin/staff" className="hover:text-(--accent)">Staff</Link><Link href="/admin/settings" className="hover:text-(--accent)">Settings</Link></>}<Link href="/" className="text-(--muted) hover:text-(--ink)">Public page</Link><AccountMenu staff={staff} /></nav>;
}
