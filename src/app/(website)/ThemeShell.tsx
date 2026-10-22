"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
  type CSSProperties,
} from "react";
import { Moon, Sun } from "lucide-react";
import { buttonInk } from "@/lib/site/colors";

type Theme = "dark" | "light";
const ThemeContext = createContext<Theme>("dark");
const eventName = "uptimerelay-theme-change";

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(eventName, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(eventName, listener);
  };
}
function getTheme(): Theme {
  try {
    return localStorage.getItem("uptimerelay-theme") === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export default function ThemeShell({
  children,
  className,
  branding = { accent: "#ff555f", buttonColor: "#b52839" },
}: {
  children: ReactNode;
  className: string;
  branding?: { accent: string; buttonColor: string };
}) {
  const theme = useSyncExternalStore(
    subscribe,
    getTheme,
    () => "dark" as Theme,
  );
  return (
    <ThemeContext.Provider value={theme}>
      <div
        data-theme={theme}
        style={{ "--accent": branding.accent, "--button": branding.buttonColor, "--button-hover": `color-mix(in srgb, ${branding.buttonColor} 85%, black)`, "--button-ink": buttonInk(branding.buttonColor) } as CSSProperties}
        className={`${className} scheme-dark [--page:#09090c] [--ink:#f4f4f6] [--header:#0c0c10] [--line:#25252d] [--muted:#a0a0ae] [--tag-line:#493035] [--tag-ink:#ff9ca3] [--health-line:#214738] [--health-bg:#0b1914] [--healthy:#35d6a0] [--health-copy:#b3c8bd] [--health-divider:#1c3529] [--health-meta:#abc5b6] [--preview-line:#51402a] [--preview-ink:#e9bd77] [--panel-line:#1c1e27] [--panel-bg:#050609] [--group-line:#20232e] [--group-bg:#0b0d14] [--secondary:#a4afc0] [--chevron-bg:#c8cdd6] [--chevron-ink:#151820] [--check-ink:#071910] [--hover:#ffffff06] data-[theme=light]:scheme-light data-[theme=light]:[--page:#fafafb] data-[theme=light]:[--ink:#17171d] data-[theme=light]:[--header:#ffffff] data-[theme=light]:[--line:#dcdce3] data-[theme=light]:[--muted:#626271] data-[theme=light]:[--tag-line:#ebbac0] data-[theme=light]:[--tag-ink:#a92132] data-[theme=light]:[--health-line:#b5d9c7] data-[theme=light]:[--health-bg:#edf8f1] data-[theme=light]:[--healthy:#087748] data-[theme=light]:[--health-copy:#365d47] data-[theme=light]:[--health-divider:#cce4d5] data-[theme=light]:[--health-meta:#42684e] data-[theme=light]:[--preview-line:#dcc49b] data-[theme=light]:[--preview-ink:#81530e] data-[theme=light]:[--panel-line:#dcdce3] data-[theme=light]:[--panel-bg:#ffffff] data-[theme=light]:[--group-line:#dedee6] data-[theme=light]:[--group-bg:#f1f2f6] data-[theme=light]:[--secondary:#5c6577] data-[theme=light]:[--chevron-bg:#515968] data-[theme=light]:[--chevron-ink:#ffffff] data-[theme=light]:[--check-ink:#ffffff] data-[theme=light]:[--hover:#00000004]`}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function ThemeToggle() {
  const theme = useContext(ThemeContext);
  function selectTheme(value: Theme) {
    try {
      localStorage.setItem("uptimerelay-theme", value);
      window.dispatchEvent(new Event(eventName));
    } catch {
      /* Keep the current theme when browser storage is unavailable. */
    }
  }

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="inline-flex shrink-0 items-center gap-0.5 rounded-[10px] border border-(--line) bg-(--panel-bg) p-0.5"
    >
      <button
        type="button"
        aria-label="Light mode"
        aria-pressed={theme === "light"}
        onClick={() => selectTheme("light")}
        className="flex size-8 cursor-pointer items-center justify-center rounded-[7px] text-(--muted) transition-colors hover:text-(--ink) aria-pressed:bg-(--group-bg) aria-pressed:text-(--ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) motion-reduce:transition-none"
      >
        <Sun size={12} fill="currentColor" strokeWidth={0} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Dark mode"
        aria-pressed={theme === "dark"}
        onClick={() => selectTheme("dark")}
        className="flex size-8 cursor-pointer items-center justify-center rounded-[7px] text-(--muted) transition-colors hover:text-(--ink) aria-pressed:bg-[#222c3a] aria-pressed:text-[#f1f5f9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) motion-reduce:transition-none"
      >
        <Moon
          size={14}
          fill="currentColor"
          strokeWidth={0}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
