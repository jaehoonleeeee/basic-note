import { NextResponse } from "next/server";

// Always reflects the CURRENTLY deployed build. A client running an older
// bundle will see its baked NEXT_PUBLIC_APP_VERSION differ from this and
// trigger the in-app update flow. Must never be cached.
export const dynamic = "force-dynamic";

export function GET() {
  const version = process.env.VERCEL_GIT_COMMIT_SHA || "dev";
  return NextResponse.json(
    { version },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
