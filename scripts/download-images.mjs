#!/usr/bin/env node

/**
 * 预本地化脚本 - 使用 Astro 环境
 * 在 Notion URL 还有效时，使用 fileToImageAsset 将所有图片本地化到 Astro 资源系统
 */

import { fileToUrl, fileToImageAsset } from "notion-astro-loader";
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 缓存配置
const CACHE_DIR = path.join(__dirname, '../public/cached-images');
const CACHE_MANIFEST_FILE = path.join(CACHE_DIR, 'manifest.json');

/**
 * 清理和验证图片 URL
 * 处理被截断或格式错误的 Notion 图片 URL
 */
function sanitizeImageUrl(src) {
  if (!src || typeof src !== 'string') {
    console.warn('⚠️ URL 为空或类型错误');
    return null;
  }
  
  // 去除首尾空白字符
  let cleaned = src.trim();
  
  // 移除尾部的多余 & 符号（这是导致构建失败的主要原因）
  cleaned = cleaned.replace(/&+$/, '');
  
  // 移除尾部的其他可疑字符
  cleaned = cleaned.replace(/[?&]+$/, '');
  
  // 验证是否为有效 URL
  try {
    const urlObj = new URL(cleaned);
    
    // 确保协议是 http 或 https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      console.warn(`⚠️ 不支持的协议: ${urlObj.protocol}`);
      return null;
    }
    
    console.log(`✅ URL 清理成功: ${cleaned.substring(0, 60)}...`);
    return cleaned;
  } catch (err) {
    console.error(`❌ URL 格式无效: ${cleaned.substring(0, 60)}...`, err);
    return null;
  }
}

// 确保缓存目录存在
async function ensureCacheDir() {
  try {
    await fs.access(CACHE_DIR);
  } catch {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  }
}

// 读取缓存清单
async function readCacheManifest() {
  try {
    const content = await fs.readFile(CACHE_MANIFEST_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

// 写入缓存清单
async function writeCacheManifest(manifest) {
  await ensureCacheDir();
  await fs.writeFile(CACHE_MANIFEST_FILE, JSON.stringify(manifest, null, 2));
}

// 生成文件ID
function getNotionFileId(notionFile) {
  if (notionFile?.file?.url) {
    const match = notionFile.file.url.match(/([a-f0-9-]{36})/);
    return match ? match[1] : Math.random().toString(36);
  }
  
  if (notionFile?.id) {
    return notionFile.id;
  }
  
  const url = fileToUrl(notionFile);
  if (url) {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const filename = pathParts[pathParts.length - 1];
    return filename.split('.')[0] || Math.random().toString(36);
  }
  
  return Math.random().toString(36);
}

// 检查 URL 可访问性
async function isUrlAccessible(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

// 本地化单个图片
async function localizeImage(notionFile, title) {
  const fileId = getNotionFileId(notionFile);
  const rawUrl = fileToUrl(notionFile);
  
  // 清理和验证 URL
  const originalUrl = sanitizeImageUrl(rawUrl);
  
  if (!originalUrl) {
    console.error(`❌ URL 无效或已损坏: ${rawUrl?.substring(0, 60)}...`);
    throw new Error('无法获取有效的图片URL');
  }

  // 1. 检查缓存
  const manifest = await readCacheManifest();
  const cacheEntry = manifest[fileId];
  
  if (cacheEntry && cacheEntry.localizedPath) {
    console.log(`💾 使用缓存: ${cacheEntry.localizedPath}`);
    return {
      src: cacheEntry.localizedPath,
      isLocal: true,
      cached: true,
    };
  }

  // 2. 检查 URL 可访问性
  const urlAccessible = await isUrlAccessible(originalUrl);
  if (!urlAccessible) {
    console.log(`⚠️ URL不可访问，跳过本地化`);
    return {
      src: originalUrl,
      isLocal: false,
      cached: false,
    };
  }

  // 3. 使用 fileToImageAsset 本地化
  try {
    console.log(`🔄 使用 fileToImageAsset 本地化...`);
    const imageAsset = await fileToImageAsset(notionFile);
    
    console.log(`✅ 本地化成功: ${imageAsset.src}`);
    
    // 4. 保存到缓存
    manifest[fileId] = {
      localizedPath: imageAsset.src,
      timestamp: Date.now(),
      originalUrl,
      title,
    };
    await writeCacheManifest(manifest);
    
    return {
      src: imageAsset.src,
      isLocal: true,
      cached: false,
    };
  } catch (error) {
    console.error(`❌ 本地化失败: ${error.message}`);
    return {
      src: originalUrl,
      isLocal: false,
      cached: false,
    };
  }
}

// 导出函数供 Astro 环境使用
export { localizeImage, getNotionFileId, isUrlAccessible, sanitizeImageUrl };

// 如果需要独立运行（通过 Astro 调用）
export async function processPhotosLocalization(photos) {
  console.log('🚀 开始预本地化 Notion 图片...\n');
  
  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;
  let cachedCount = 0;
  
  // 收集所有需要处理的图片文件
  const imageFiles = [];
  
  for (const [index, entry] of photos.entries()) {
    if (!entry.data?.cover) {
      console.log(`⚠️ [${index + 1}/${photos.length}] 跳过无封面图片的条目: ${entry.id}`);
      skipCount++;
      continue;
    }
    
    const title = entry.data.properties?.Name || entry.id;
    const rawUrl = fileToUrl(entry.data.cover);
    
    // 清理和验证 URL
    const originalUrl = sanitizeImageUrl(rawUrl);
    
    if (!originalUrl) {
      console.error(`❌ [${index + 1}/${photos.length}] 无法获取有效的图片URL: ${title}`);
      console.error(`   原始URL: ${rawUrl?.substring(0, 60)}...`);
      errorCount++;
      continue;
    }
    
    imageFiles.push({
      index: index + 1,
      total: photos.length,
      title,
      notionFile: entry.data.cover,
      originalUrl,
    });
  }
  
  console.log(`🔄 开始本地化 ${imageFiles.length} 张图片...\n`);
  
  // 逐个处理图片本地化
  for (const { index, total, title, notionFile, originalUrl } of imageFiles) {
    console.log(`🔄 [${index}/${total}] 处理: ${title}`);
    console.log(`📍 原始URL: ${originalUrl.substring(0, 80)}...`);
    
    try {
      // 使用本地化函数
      const result = await localizeImage(notionFile, title);
      
      if (result.cached) {
        cachedCount++;
      } else if (result.isLocal) {
        successCount++;
      } else {
        skipCount++;
      }
      
    } catch (error) {
      console.error(`❌ 处理失败: ${error.message}`);
      errorCount++;
    }
    
    console.log(''); // 空行分隔
  }
  
  // 统计结果
  console.log('📊 预本地化完成统计:');
  console.log(`✅ 新本地化: ${successCount} 张`);
  console.log(`💾 使用缓存: ${cachedCount} 张`);
  console.log(`⚠️ 保持远程: ${skipCount} 张`);
  console.log(`❌ 处理失败: ${errorCount} 张`);
  
  const totalProcessed = successCount + cachedCount;
  const totalImages = imageFiles.length;
  
  if (totalProcessed === totalImages) {
    console.log('\n🎉 所有图片已本地化！构建时将使用本地资源，不受 URL 过期影响。');
  } else if (totalProcessed > 0) {
    console.log(`\n✅ ${totalProcessed}/${totalImages} 图片已本地化，${skipCount} 张保持远程状态。`);
  } else {
    console.log('\n⚠️ 没有图片被本地化，可能所有 URL 都已过期。请在 Notion 中刷新图片后重试。');
  }
  
  if (errorCount > 0) {
    console.log(`\n❌ ${errorCount} 张图片处理失败，请检查错误信息。`);
  }
  
  return { successCount, cachedCount, skipCount, errorCount };
} 