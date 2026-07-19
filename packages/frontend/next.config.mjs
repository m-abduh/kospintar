/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@kospintar/shared"],
};

export default nextConfig;
