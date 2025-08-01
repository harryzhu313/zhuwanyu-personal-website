import { defineConfig } from "astro/config";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import icon from "astro-icon";
import AstroPWA from "@vite-pwa/astro";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import netlify from "@astrojs/netlify";
import { description, site, title } from "./src";

export default defineConfig({
  site,
  output: "static",
  adapter: netlify(),
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
  image: {
    domains: ["**.amazonaws.com", "**.notion.so"], // 添加域名
    remotePatterns: [ // 添加远程模式
      {
        protocol: "https", // 协议  
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
