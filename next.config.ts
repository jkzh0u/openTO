import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Bundles only the files the server needs, which keeps the Docker image small.
  output: 'standalone'
}

export default nextConfig
