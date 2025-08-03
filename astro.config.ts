import { defineConfig } from "astro/config";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import icon from "astro-icon";
import AstroPWA from "@vite-pwa/astro";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import { description, site, title } from "./src";

export default defineConfig({
  site,
  integrations: [
    react(),
    icon(),
    sitemap(),
    // 暂时注释掉 PWA 功能以简化测试
    // AstroPWA({
    //   base: "/",
    //   scope: "/",
    //   includeAssets: ["favicon.svg"],
    //   registerType: "autoUpdate",
    //   manifest: {
    //     name: title,
    //     short_name: title,
    //     description: description,
    //     theme_color: "#ffffff",
    //   },
    //   pwaAssets: {
    //     config: true,
    //   },
    //   workbox: {
    //     navigateFallback: "/404",
    //     globPatterns: ["**/*.{css,js,html,xml,svg,png,webp,gif,ico,txt}"],
    //     maximumFileSizeToCacheInBytes: 10000000
    //   },
    //   experimental: {
    //     directoryAndTrailingSlashHandler: true,
    //   },
    // }),
  ],
  // 恢复图片处理配置以支持 fileToImageAsset 功能
  image: {
    domains: ["**.amazonaws.com", "**.notion.so", "image.harryrou.wiki"],
    remotePatterns: [
      {
        protocol: "https",
      },
    ],
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false,
      },
    },
  },
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      langAlias: {
        fortran: "fortran-free-form",
      },
    },
  },
});
