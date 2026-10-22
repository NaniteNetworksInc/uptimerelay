import { Suspense } from "react";
import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/server";
import { getServiceGroups } from "@/lib/services/server";
import Components from "./Components";
export const metadata: Metadata = { title: "Components" };
async function ComponentsRoute() {
  await requireStaff();
  return <Components groups={await getServiceGroups()} />;
}
export default function ComponentsPage() {
  return (
    <Suspense fallback={<p>Loading components…</p>}>
      <ComponentsRoute />
    </Suspense>
  );
}
