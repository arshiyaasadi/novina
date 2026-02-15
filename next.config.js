const path = require('path');
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const aliasPath = path.resolve(__dirname, 'i18n/request.ts');
const aliasPathRelative = './i18n/request.ts';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // RTL support
  experimental: {
    optimizePackageImports: ['lucide-react'],
    turbo: {
      resolveAlias: {
        'next-intl/config': aliasPathRelative,
      },
    },
  },
  turbopack: {
    resolveAlias: {
      'next-intl/config': aliasPathRelative,
    },
  },
  webpack: (config, { isServer }) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      'next-intl/config': aliasPath,
    };
    return config;
  },
};

module.exports = withNextIntl(nextConfig);

