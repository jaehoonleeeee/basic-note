"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { NoteEditor } from "@/components/notes/note-editor";

// Single static route for the note editor. The note id lives in the query
// string (?id=...) read client-side via useSearchParams — so this route is
// one fixed path the service worker can fully precache (RSC + document),
// which makes offline "create → open" and "list → open" work without any
// per-id network fetch. (Previously /notes/[noteId] required an RSC fetch
// per id, which failed offline.)
function NoteEditorRoute() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  useEffect(() => {
    if (!id) router.replace("/notes");
  }, [id, router]);

  if (!id) return null;

  return <NoteEditor noteId={id} />;
}

export default function NotePage() {
  return (
    <Suspense fallback={null}>
      <NoteEditorRoute />
    </Suspense>
  );
}
