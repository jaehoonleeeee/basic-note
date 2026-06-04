import type { NextConfig } from "next";
import pkg from "./package.json";

// Two versions, on purpose:
// - APP_VERSION = commit SHA (changes every deploy) → drives update detection
//   in the UpdateGate. Must auto-change so updates are never missed.
// - DISPLAY_VERSION = package.json semver (human-managed) → shown in Settings.
const appVersion = process.env.VERCEL_GIT_COMMIT_SHA || "dev";

const nextConfig: NextConfig = {
  transpilePackages: ["@plus-experience/design-system"],
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
    NEXT_PUBLIC_APP_DISPLAY_VERSION: pkg.version,
  },
};

export default nextConfig;
