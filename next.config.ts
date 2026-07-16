import type { NextConfig } from "next";

// Member photos and church logos are both stored in Supabase Storage and
// referenced by full public URL — next/image needs the host allow-listed
// to optimize them. Derived from the same env var the Supabase client uses
// rather than hardcoded, so this doesn't drift from whichever project
// NEXT_PUBLIC_SUPABASE_URL actually points at.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
