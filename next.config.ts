
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
      // If you are serving images from your own domain (e.g., via the /public folder or an API route)
      // and want to use Next.js Image Optimization, you might need to add your domain here.
      // However, for files served directly from `/public`, Next.js often handles them correctly.
      // If you deploy and images from /uploads don't work with <Image>, consider adding:
      // {
      //   protocol: 'http', // or 'https' if your local dev server uses https
      //   hostname: 'localhost',
      //   port: process.env.PORT || '3000', // or your specific dev port
      //   pathname: '/uploads/**',
      // },
    ],
  },
};

export default nextConfig;
