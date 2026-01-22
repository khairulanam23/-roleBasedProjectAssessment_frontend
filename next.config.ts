/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // or 'export' if you want fully static
  images: {
    unoptimized: true, // if using images
  },
};

export default nextConfig;
