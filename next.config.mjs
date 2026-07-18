/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/learn/bitcoin-cycle", destination: "/learn/btc-cycle", permanent: true },
      { source: "/learn/spx-cycle", destination: "/learn/equity-cycle", permanent: true },
      { source: "/learn/how-scoring-works", destination: "/learn/scoring", permanent: true },
    ];
  },
};

export default nextConfig;
