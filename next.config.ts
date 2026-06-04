import type { NextConfig } from "next";

// App version baked into the client bundle at build time. On Vercel each
// deploy has a unique commit SHA; the in-app update gate compares this against
// the live /api/version to detect when a client is running an old build.
const appVersion = process.env.VERCEL_GIT_COMMIT_SHA || "dev";

const nextConfig: NextConfig = {
  transpilePackages: ["@plus-experience/design-system"],
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },
};

export default nextConfig;
