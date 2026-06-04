"use client";

import { useEffect } from "react";

export function SwRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // In development, unregister any SW to prevent stale-chunk errors with Turbopack
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
      return;
    }

    // Version the SW script URL so each deploy installs a fresh worker
    // (new cache name → old caches purged, shell re-precached).
    const version = process.env.NEXT_PUBLIC_APP_VERSION || "dev";
    navigator.serviceWorker.register(`/sw.js?v=${version}`).catch(() => {});
  }, []);

  return null;
}
