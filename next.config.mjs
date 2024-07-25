/** @type {import('next').NextConfig} */

export const reactStrictMode = true;
export const distDir = "./dist";

export default {
  webpack: (config) => {
    config.resolve.alias.canvas = false;

    return config;
  },
};
