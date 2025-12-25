import { fileToImageAsset, fileToUrl } from "notion-astro-loader";
import fs from 'fs/promises';
import path from 'path';

export interface LocalizedImage {
  src: string;
  isLocal: boolean;
  originalUrl: string;
  cached: boolean;
}

/**
 * 清理和验证图片 URL
 * 处理被截断或格式错误的 Notion 图片 URL
 */
function sanitizeImageUrl(src: string | null | undefined): string | null {
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

// 缓存目录 - 记录成功本地化的图片信息
const CACHE_DIR = './public/cached-images';
const CACHE_MANIFEST_FILE = './public/cached-images/manifest.json';

// 缓存清单接口
interface CacheManifest {
  [notionFileId: string]: {
    localizedPath: string; // fileToImageAsset 生成的路径
    timestamp: number;
    originalUrl: string;
    title?: string;
  };
}

/**
 * 确保缓存目录存在
 */
async function ensureCacheDir() {
  try {
    await fs.access(CACHE_DIR);
  } catch {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  }
}

/**
 * 读取缓存清单
 */
async function readCacheManifest(): Promise<CacheManifest> {
  try {
    const content = await fs.readFile(CACHE_MANIFEST_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

/**
 * 写入缓存清单
 */
async function writeCacheManifest(manifest: CacheManifest) {
  await ensureCacheDir();
  await fs.writeFile(CACHE_MANIFEST_FILE, JSON.stringify(manifest, null, 2));
}

/**
 * 生成文件ID（从Notion文件对象中提取）
 */
function getNotionFileId(notionFile: any): string {
  // 尝试从不同的可能位置提取文件ID
  if (notionFile?.file?.url) {
    // 从URL中提取文件ID
    const match = notionFile.file.url.match(/([a-f0-9-]{36})/);
    return match ? match[1] : Math.random().toString(36);
  }
  
  if (notionFile?.id) {
    return notionFile.id;
  }
  
  // 作为后备，使用URL的哈希
  const url = fileToUrl(notionFile);
  if (url) {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const filename = pathParts[pathParts.length - 1];
    return filename.split('.')[0] || Math.random().toString(36);
  }
  
  return Math.random().toString(36);
}

/**
 * 尝试从缓存获取已本地化的图片路径
 */
async function tryGetFromCache(fileId: string): Promise<string | null> {
  try {
    const manifest = await readCacheManifest();
    const cacheEntry = manifest[fileId];
    
    if (cacheEntry && cacheEntry.localizedPath) {
      console.log(`💾 从缓存获取本地化路径: ${fileId} -> ${cacheEntry.localizedPath}`);
      return cacheEntry.localizedPath;
    }
  } catch (error) {
    console.warn(`⚠️ 读取缓存失败:`, error);
  }
  
  return null;
}

/**
 * 保存本地化结果到缓存
 */
async function saveToCache(fileId: string, localizedPath: string, originalUrl: string, title?: string): Promise<void> {
  try {
    await ensureCacheDir();
    
    // 更新缓存清单
    const manifest = await readCacheManifest();
    manifest[fileId] = {
      localizedPath,
      timestamp: Date.now(),
      originalUrl,
      title,
    };
    await writeCacheManifest(manifest);
    
    console.log(`💾 保存本地化结果到缓存: ${fileId} -> ${localizedPath}`);
  } catch (error) {
    console.warn(`⚠️ 保存缓存失败:`, error);
  }
}

/**
 * 检查URL是否可访问
 */
async function isUrlAccessible(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * 将 Notion 远程图片本地化（使用 fileToImageAsset）
 * @param notionFile Notion 文件对象
 * @returns 本地化的图片信息
 */
export async function localizeNotionImage(notionFile: any): Promise<LocalizedImage> {
  const rawUrl = fileToUrl(notionFile);
  const fileId = getNotionFileId(notionFile);
  
  // 清理和验证 URL
  const originalUrl = sanitizeImageUrl(rawUrl);
  
  if (!originalUrl) {
    console.error(`❌ URL 无效或已损坏: ${rawUrl?.substring(0, 60)}...`);
    throw new Error('无法获取有效的图片URL');
  }

  console.log(`🔄 开始处理图片: ${fileId}`);

  // 1. 首先尝试从缓存获取已本地化的路径
  const cachedPath = await tryGetFromCache(fileId);
  if (cachedPath) {
    return {
      src: cachedPath,
      isLocal: true,
      originalUrl,
      cached: true,
    };
  }

  // 2. 检查原始URL是否可访问
  const urlAccessible = await isUrlAccessible(originalUrl);
  console.log(`🌐 URL可访问性检查: ${urlAccessible ? '✅' : '❌'} - ${originalUrl.substring(0, 60)}...`);

  if (!urlAccessible) {
    console.warn(`⚠️ URL不可访问，跳过本地化: ${fileId}`);
    return {
      src: originalUrl,
      isLocal: false,
      originalUrl,
      cached: false,
    };
  }

  // 3. 使用 fileToImageAsset 进行真正的本地化
  try {
    console.log(`🔄 使用 fileToImageAsset 本地化: ${fileId}`);
    const imageAsset = await fileToImageAsset(notionFile);
    
    console.log(`✅ 本地化成功: ${fileId} -> ${imageAsset.src}`);
    
    // 4. 保存本地化结果到缓存（异步，不阻塞）
    saveToCache(fileId, imageAsset.src, originalUrl).catch(error => {
      console.warn(`⚠️ 异步保存缓存失败:`, error);
    });
    
    return {
      src: imageAsset.src,
      isLocal: true,
      originalUrl,
      cached: false,
    };
  } catch (error) {
    console.error(`❌ fileToImageAsset 本地化失败: ${fileId}`, error);
    
    // 5. 降级：返回原始URL
    return {
      src: originalUrl,
      isLocal: false,
      originalUrl,
      cached: false,
    };
  }
}

/**
 * 批量本地化多个 Notion 图片
 * @param notionFiles Notion 文件对象数组
 * @returns 本地化的图片信息数组
 */
export async function localizeNotionImages(notionFiles: any[]): Promise<LocalizedImage[]> {
  const results: LocalizedImage[] = [];
  
  for (const file of notionFiles) {
    try {
      const localizedImage = await localizeNotionImage(file);
      results.push(localizedImage);
    } catch (error) {
      console.error(`❌ 处理图片失败:`, error);
    }
  }
  
  return results;
}

/**
 * 清理过期的缓存记录
 * @param maxAge 最大缓存时间（毫秒），默认30天
 */
export async function cleanupCache(maxAge = 30 * 24 * 60 * 60 * 1000) {
  try {
    const manifest = await readCacheManifest();
    const now = Date.now();
    let cleaned = 0;
    
    for (const [fileId, entry] of Object.entries(manifest)) {
      if (now - entry.timestamp > maxAge) {
        delete manifest[fileId];
        cleaned++;
        console.log(`🗑️ 清理过期缓存记录: ${fileId}`);
      }
    }
    
    if (cleaned > 0) {
      await writeCacheManifest(manifest);
      console.log(`✅ 清理完成，删除 ${cleaned} 个过期缓存记录`);
    }
  } catch (error) {
    console.warn(`⚠️ 清理缓存失败:`, error);
  }
} 