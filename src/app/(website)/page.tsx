import { Suspense } from "react";
import Homepage from "./Homepage";
export default function Home() {
  return (
    <Suspense
      fallback={
        <p className="py-10 text-sm text-(--muted)">Loading service status…</p>
      }
    >
      <Homepage />
    </Suspense>
  );
}
