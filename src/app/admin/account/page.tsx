import { Suspense } from "react";
import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/server";
import { mfaConfigured } from "@/lib/auth/mfa";
import Account from "./Account";
export const metadata: Metadata = { title: "Account & security" };
async function AccountRoute() { const staff = await requireStaff(); return <Account staff={staff} mfaReady={mfaConfigured()} />; }
export default function AccountPage() { return <Suspense fallback={<p>Loading account…</p>}><AccountRoute /></Suspense>; }
