/** @type {import('next').NextConfig} */

// En GitHub Pages el sitio vive en /nueve-habitaciones; en dev y en el
// artifact de un solo archivo, en la raíz.
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
