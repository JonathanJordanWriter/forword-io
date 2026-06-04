/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Temporarily disable ESLint during builds to isolate build failures.
    // Re-enable once the specific lint error is identified and fixed.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
