import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { currentStaff } from "@/lib/auth/server";
import Login from "./Login";
import { installationHasAccounts } from "@/lib/site/server";

export const metadata: Metadata = { title: "Staff sign in" };
async function LoginRoute() {
  if (!await installationHasAccounts()) redirect("/admin/setup");
  if (await currentStaff()) redirect("/admin");
  return <Login />;
}
export default function LoginPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-(--muted)">Loading sign in…</p>}
    >
      <LoginRoute />
    </Suspense>
  );
}
