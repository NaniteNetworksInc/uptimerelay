import Image from "next/image";
import Link from "next/link";
import { Activity } from "lucide-react";
import type { SiteSettings } from "@/lib/site/shared";
export default function Brand({ settings }: { settings: SiteSettings }) {
  return (
    <Link
      href="/"
      aria-label={`${settings.name} status home`}
      className="flex min-w-0 items-center gap-2.5 text-[19px] font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--accent)"
    >
      {settings.logo ? (
        <Image
          src={settings.logo}
          alt=""
          width={64}
          height={64}
          unoptimized
          priority
          className="size-11 shrink-0 object-contain"
        />
      ) : (
        <Activity
          className="size-9 shrink-0 text-(--accent)"
          aria-hidden="true"
        />
      )}
      <span className="wrap-break-word">{settings.name}</span>
    </Link>
  );
}
