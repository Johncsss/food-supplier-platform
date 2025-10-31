/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'firebasestorage.googleapis.com'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    
    // Handle undici module parsing issue
    config.module.rules.push({
      test: /node_modules\/undici/,
      use: 'null-loader',
    });
    
    return config;
  },
  experimental: {
    esmExternals: 'loose',
  },
}

module.exports = nextConfig 