import { getCollection } from "astro:content";
import { fileToUrl } from "notion-astro-loader";
import { slugify } from "..";
import { preprocessPhoto } from "../content/config";

export interface ProcessedPhoto {
  id: string;
  title: string;
  description: string;
  categories: string[];
  date: Date;
  image: string; // 本地化后的图片 URL
  exif: ExifData;
  slug: string;
  isRemote: boolean; // 是否仍然是远程图片（本地化失败时）
  cached: boolean; // 是否来自缓存
}

export async function getNotionPhotos(): Promise<ProcessedPhoto[]> {
  try {
    // 1. 获取原始 Notion 数据 - 使用 Astro Content Collections API
    const rawPhotos = await getCollection("photos");
    console.log('📸 获取到原始照片数量:', rawPhotos?.length || 0);

    // 2. 处理每张照片
    const processedPhotos: ProcessedPhoto[] = [];
    
    for (const entry of rawPhotos) {
      if (!entry.data?.cover) {
        console.warn(`⚠️ 照片 "${entry.id}" 没有封面图片，跳过`);
        continue;
      }

      try {
        // 3. 获取基本信息
        const title = entry.data.properties?.Name || entry.id;
        const description = entry.data.properties?.Description || "";
        const categories = entry.data.properties?.Categories 
          ? [entry.data.properties.Categories] 
          : [];
        // 日期处理交给 preprocessPhoto 统一处理（优先级：EXIF > Notion Date > 当前时间）

        // 4. 使用 preprocessPhoto 处理照片（包含本地化逻辑）
        const processedPhoto = await preprocessPhoto(entry);
        
        if (!processedPhoto) {
          console.warn(`⚠️ 照片 "${title}" 处理失败，跳过`);
          continue;
        }

        // 5. 生成 slug
        const slug = slugify(title);
        if (!slug || slug.trim() === "") {
          console.warn(`⚠️ 照片 "${title}" 生成的 slug 无效，跳过`);
          continue;
        }

        // 6. 检查图片是否本地化
        // 在开发模式下，比较URL是否与原始远程URL不同来判断是否本地化
        const originalUrl = entry.data.cover ? fileToUrl(entry.data.cover) : '';
        const isLocal = processedPhoto.image !== originalUrl && !processedPhoto.image.includes('prod-files-secure.s3.us-west-2.amazonaws.com');
        const statusText = isLocal ? '本地化成功' : '使用远程URL';
        console.log(`📸 ${title}: ${statusText} -> ${processedPhoto.image.substring(0, 60)}...`);

        processedPhotos.push({
          id: entry.id,
          title: processedPhoto.title,
          description: processedPhoto.description,
          categories: processedPhoto.categories,
          date: processedPhoto.date,
          image: processedPhoto.image,
          exif: processedPhoto.exif,
          slug,
          isRemote: !isLocal, // 基于 URL 格式判断
          cached: false, // 简化处理
        });

      } catch (error) {
        console.error(`❌ 处理照片时出错: ${entry.id}`, error);
      }
    }

    console.log(`🎉 成功处理 ${processedPhotos.length} 张照片`);
    return processedPhotos;

  } catch (error) {
    console.error('❌ 获取 Notion 照片数据时出错:', error);
    return [];
  }
} 