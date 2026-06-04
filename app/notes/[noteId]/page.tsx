"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

// Backward-compat shim. The editor moved to the static /notes/note?id=...
// route (offline-friendly). Old /notes/<id> links/bookmarks redirect here.
// Note: this redirect itself needs the app loaded; the live app no longer
// produces /notes/<id> URLs, so this only matters for external bookmarks.
export default function LegacyNoteRedirect({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  const { noteId } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/notes/note?id=${noteId}`);
  }, [noteId, router]);

  return null;
}
