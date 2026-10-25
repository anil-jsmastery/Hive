import type { NextConfig } from 'next';

// Hive renders every page per user (Clerk session + Supabase RLS), so it uses
// classic dynamic rendering: Cache Components and partial prefetching stay off.
const nextConfig: NextConfig = {
  cacheComponents: false,
  reactCompiler: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
