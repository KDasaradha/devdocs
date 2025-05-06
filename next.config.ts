import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // If you decide to use MDX later, you'll configure it here.
  // For example:
  // pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  // experimental: {
  //   mdxRs: true,
  // },
};

// If using MDX:
// const withMDX = require('@next/mdx')({
//   extension: /\.mdx?$/,
//   options: {
//     remarkPlugins: [],
//     rehypePlugins: [],
//   },
// });
// module.exports = withMDX(nextConfig);

export default nextConfig;
