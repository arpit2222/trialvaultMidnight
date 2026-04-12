/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    // Silence missing optional peer dependencies that don't affect functionality
    config.resolve.alias = {
      ...config.resolve.alias,
      'pino-pretty': false,
      '@react-native-async-storage/async-storage': false,
    };
    return config;
  },
};

export default nextConfig;
