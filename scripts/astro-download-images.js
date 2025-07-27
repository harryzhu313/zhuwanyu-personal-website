#!/usr/bin/env node

/**
 * Astro 环境下的图片本地化脚本
 * 使用 astro:content 获取数据，然后调用本地化函数
 */

import { getCollection } from "astro:content";
import { processPhotosLocalization } from "./download-images.mjs";

async function main() {
  try {
    console.log('📸 从 Astro Content Collections 获取照片数据...');
    const photos = await getCollection("photos");
    console.log(`📊 找到 ${photos.length} 张照片\n`);
    
    if (!photos || photos.length === 0) {
      console.log('⚠️ 没有找到照片数据，请检查 Notion 配置');
      return;
    }
    
    // 调用本地化处理函数
    const result = await processPhotosLocalization(photos);
    
    // 根据结果设置退出码
    if (result.errorCount > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  }
}

main(); 