/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/learn/bitcoin-cycle", destination: "/learn/btc-cycle", permanent: true },
      { source: "/learn/spx-cycle", destination: "/learn/equity-cycle", permanent: true },
      { source: "/learn/how-scoring-works", destination: "/learn/scoring", permanent: true },
    ];
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder",
  },
};

export default nextConfig;
