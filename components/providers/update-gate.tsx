"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Spinner } from "@plus-experience/design-system/ui/spinner";
import { Button } from "@plus-experience/design-system/ui/button";
import { useLanguage } from "@/components/providers/language-provider";

// Baked into the bundle at build time (see next.config.ts). On Vercel this is
// the deploy's commit SHA; locally it's "dev" (update flow disabled).
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "dev";

// Guards against a reload loop: if a reload didn't resolve the mismatch
// (e.g. a stale cache), we fall back to a manual banner instead of looping.
const RELOAD_GUARD_KEY = "bn_update_reloaded_for";

async function fetchServerVersion(): Promise<string | null> {
  try {
    const res = await fetch("/api/version", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.version === "string" ? data.version : null;
  } catch {
    return null; // offline / unreachable — stay on current version
  }
}

export function UpdateGate() {
  const { t } = useLanguage();
  const [updating, setUpdating] = useState(false);
  const [bannerVersion, setBannerVersion] = useState<string | null>(null);
  const checkedInitial = useRef(false);

  const applyUpdate = useCallback(async (serverVersion: string) => {
    setUpdating(true);
    setBannerVersion(null);
    try {
      sessionStorage.setItem(RELOAD_GUARD_KEY, serverVersion);
    } catch {}
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      await reg?.update();
    } catch {}
    // Brief, intentional pause so the update reads as a real, official step
    // (network-first shell means the reload pulls the fresh build).
    setTimeout(() => window.location.reload(), 1200);
  }, []);

  // Initial entry: if this bundle is behind the live deploy, auto-apply with a
  // full-screen "updating" screen.
  useEffect(() => {
    if (APP_VERSION === "dev") return;
    if (checkedInitial.current) return;
    checkedInitial.current = true;

    (async () => {
      const serverVersion = await fetchServerVersion();
      if (!serverVersion || serverVersion === APP_VERSION) return;
      let alreadyTried = false;
      try {
        alreadyTried = sessionStorage.getItem(RELOAD_GUARD_KEY) === serverVersion;
      } catch {}
      if (alreadyTried) {
        setBannerVersion(serverVersion);
        return;
      }
      applyUpdate(serverVersion);
    })();
  }, [applyUpdate]);

  // Re-check when the app regains focus (PWA kept open across a deploy).
  // Mid-use we show a non-intrusive banner rather than reloading abruptly.
  useEffect(() => {
    if (APP_VERSION === "dev") return;
    const onVisible = async () => {
      if (document.visibilityState !== "visible") return;
      if (updating || bannerVersion) return;
      const serverVersion = await fetchServerVersion();
      if (serverVersion && serverVersion !== APP_VERSION) {
        setBannerVersion(serverVersion);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [updating, bannerVersion]);

  if (updating) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-background">
        <span
          className="flex size-14 items-center justify-center rounded-2xl bg-foreground text-3xl font-bold text-background"
          aria-hidden
        >
          b
        </span>
        <Spinner className="h-6 w-6 text-muted-foreground" />
        <div className="text-center">
          <p className="text-base font-medium tracking-tight">{t("update.updating")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("update.subtitle")}</p>
        </div>
      </div>
    );
  }

  if (bannerVersion) {
    return (
      <div className="fixed inset-x-0 bottom-5 z-[100] flex justify-center px-4">
        <div className="flex items-center gap-4 rounded-2xl bg-card px-5 py-3 text-card-foreground shadow-lg shadow-black/10 dark:shadow-black/40">
          <span className="text-sm font-medium">{t("update.available")}</span>
          <Button size="sm" onClick={() => applyUpdate(bannerVersion)}>
            {t("update.refresh")}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
