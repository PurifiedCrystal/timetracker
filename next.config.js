/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // PERFORMANCE: Disable i18n for development (missing translation files causing overhead)
  // i18n: {
  //   locales: ['en', 'es', 'fr', 'de', 'it'],
  //   defaultLocale: 'en',
  //   localeDetection: false,
  // },
}

module.exports = nextConfig