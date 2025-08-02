import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection, type DataEntryMap } from "astro:content";
import type { ZodRawShape } from "astro:schema";
import { fileToImageAsset, fileToUrl, notionLoader } from "notion-astro-loader";
import {
  notionPageSchema,
  propertySchema,
  transformedPropertySchema,
} from "notion-astro-loader/schemas";
import type { Dress, Music, Photo, Recipe, Video } from "..";
import exifr from "exifr";
import type { ExifData } from "../components/ExifImage.astro";

const articles = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./articles" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    categories: z.array(z.string()),
    cover: z.string(),
    date: z.coerce.date(),
  }),
});

function defineNotionCollection<T extends ZodRawShape>(
  database: string,
  extra: T
) {
  return defineCollection({
    loader: notionLoader({
      auth: import.meta.env.NOTION_TOKEN,
      database_id: database,
    }),
    schema: notionPageSchema({
      properties: z.object({
        Name: transformedPropertySchema.title,
        Date: transformedPropertySchema.date.transform((x) => x!.start),
        Categories: transformedPropertySchema.multi_select,
        Description: transformedPropertySchema.rich_text,
        ...extra,
      }),
    }),
  });
}

const notNull = <T>(x: T) => x !== null;

// 只保留 photos 集合用于测试 Notion 照片库 - 简化字段要求
const photos = defineCollection({
  loader: notionLoader({
    auth: import.meta.env.NOTION_TOKEN || "",
    database_id: "1dc62405089a80cdb786d46602d9d582", // 您的数据库ID
  }),
  schema: notionPageSchema({
    properties: z.object({
      Name: transformedPropertySchema.title,
      // 将 Date 和 Categories 设为可选，避免报错
      Date: transformedPropertySchema.date.optional(),
      Categories: transformedPropertySchema.select.optional(), // 改为 select 类型
      Description: transformedPropertySchema.rich_text.optional(),
    }),
  }),
});

// 临时创建空集合
const videos = defineCollection({ loader: () => [], schema: z.any() });
const musics = defineCollection({ loader: () => [], schema: z.any() });
const recipes = defineCollection({ loader: () => [], schema: z.any() });
const dresses = defineCollection({ loader: () => [], schema: z.any() });

export const collections = {
  articles,
  photos,
  videos,
  musics,
  recipes,
  dresses,
};

type Entry<K extends keyof DataEntryMap> = DataEntryMap[K][string];
type NotionKey = Exclude<keyof DataEntryMap, "articles">;

function preprocess(entry: Entry<NotionKey>) {
  const { properties } = entry.data;
  
  return {
    title: properties.Name,
    date: properties.Date || new Date(), // 如果没有日期，使用当前日期
    categories: properties.Categories 
      ? [properties.Categories]  // Select 类型返回单个值，转换为数组
      : [], // 如果没有分类，使用空数组
    description: properties.Description || "", // 如果没有描述，使用空字符串
  };
}

export const preprocessPhoto = async (entry: Entry<"photos">): Promise<Photo | null> => {
  // 检查是否有封面图片
  if (!entry.data.cover) {
    console.warn(`照片 "${entry.data.properties.Name}" 没有封面图片，跳过`);
    return null; // 返回 null，后续会被过滤掉
  }
  
  // 智能图片处理：尝试本地化，失败时提供详细诊断
  let image: string;
  try {
    console.log(`🔄 本地化照片: ${entry.data.properties.Name}`);
    const imageAsset = await fileToImageAsset(entry.data.cover);
    image = imageAsset.src;
    console.log(`✅ 本地化成功: ${entry.data.properties.Name} -> ${image.includes('_astro') ? '本地' : 'dev代理'}`);
  } catch (error) {
    const remoteUrl = fileToUrl(entry.data.cover);
    console.error(`❌ 图片本地化失败: ${entry.data.properties.Name}`);
    console.error(`   远程URL: ${remoteUrl.substring(0, 100)}...`);
    console.error(`   错误信息: ${error instanceof Error ? error.message : String(error)}`);
    
    // 检查是否是 URL 过期问题
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('403') || errorMessage.includes('expired')) {
      console.error(`🚨 Notion URL 已过期！请执行以下操作之一:`);
      console.error(`   1. 运行 npm run fresh-build（推荐）`);
      console.error(`   2. 在 Notion 中重新编辑此页面以刷新 URL`);
      console.error(`   3. 重新上传图片到 Notion`);
    }
    
    // 使用远程 URL 作为回退（即使可能过期）
    image = remoteUrl;
  }
  
  let exif: Partial<ExifData> = {};
  let photoDate = new Date(); // 默认使用当前时间
  
  // 优先级1: 尝试从 EXIF 获取拍摄时间
  try {
    // 对于 EXIF 解析，我们使用原始的远程 URL，因为本地化的图片可能没有EXIF信息
    const imageUrl = fileToUrl(entry.data.cover);
    const parsedExif = await exifr.parse(imageUrl, true);
    if (parsedExif) {
      exif = parsedExif as ExifData;
      // 如果有EXIF中的拍摄时间，优先使用它
      if (exif.DateTimeOriginal && typeof exif.DateTimeOriginal === 'string') {
        photoDate = new Date(exif.DateTimeOriginal);
        console.log(`📅 使用EXIF日期: ${entry.data.properties.Name} -> ${photoDate.toISOString()}`);
      } else {
        // 优先级2: 如果EXIF中没有拍摄时间，使用 Notion 中的 Date 字段
        if (entry.data.properties.Date?.start) {
          photoDate = new Date(entry.data.properties.Date.start);
          console.log(`📅 使用Notion日期: ${entry.data.properties.Name} -> ${photoDate.toISOString()}`);
        } else {
          // 优先级3: 都没有则使用当前时间
          console.log(`📅 使用当前时间: ${entry.data.properties.Name} -> ${photoDate.toISOString()}`);
        }
      }
    } else {
      // EXIF解析失败，尝试使用 Notion 日期
      if (entry.data.properties.Date?.start) {
        photoDate = new Date(entry.data.properties.Date.start);
        console.log(`📅 EXIF解析失败，使用Notion日期: ${entry.data.properties.Name} -> ${photoDate.toISOString()}`);
      } else {
        console.log(`📅 EXIF解析失败且无Notion日期，使用当前时间: ${entry.data.properties.Name} -> ${photoDate.toISOString()}`);
      }
    }
  } catch (error) {
    console.warn(`无法解析照片 "${entry.data.properties.Name}" 的EXIF信息:`, error);
    // EXIF解析出错，尝试使用 Notion 日期
    if (entry.data.properties.Date?.start) {
      photoDate = new Date(entry.data.properties.Date.start);
      console.log(`📅 EXIF解析出错，使用Notion日期: ${entry.data.properties.Name} -> ${photoDate.toISOString()}`);
    } else {
      console.log(`📅 EXIF解析出错且无Notion日期，使用当前时间: ${entry.data.properties.Name} -> ${photoDate.toISOString()}`);
    }
    // 提供一个基本的空 EXIF 对象
    exif = {};
  }
  
  return {
    ...preprocess(entry),
    image, // 这是本地化的图片URL字符串
    exif: exif as ExifData,
    date: photoDate,
  } satisfies Photo;
};

export const preprocessVideo = async (entry: Entry<"videos">) => {
  return {
    uid: entry.data.properties.UID,
    ...preprocess(entry),
  } satisfies Video;
};

export const preprocessMusic = async (entry: Entry<"musics">) => {
  const { Opus, Number, Lilypond, Score } = entry.data.properties;
  return {
    opus: Opus,
    number: Number,
    lilypond: Lilypond,
    score: Score,
    ...preprocess(entry),
  } satisfies Music;
};

export const preprocessRecipe = async (entry: Entry<"recipes">) => {
  // 使用基础的 fileToUrl
  const image = fileToUrl(entry.data.cover!);
  
  let exif: Partial<ExifData> = {};
  let recipeDate = new Date();
  
  try {
    const imageUrl = fileToUrl(entry.data.cover!);
    const parsedExif = await exifr.parse(imageUrl, true);
    if (parsedExif) {
      exif = parsedExif as ExifData;
      if (exif.DateTimeOriginal && typeof exif.DateTimeOriginal === 'string') {
        recipeDate = new Date(exif.DateTimeOriginal);
      }
    }
  } catch (error) {
    console.warn(`无法解析食谱图片的EXIF信息:`, error);
    exif = {};
  }
  
  return {
    ...preprocess(entry),
    rating: entry.data.properties.Rating,
    image, // 这是本地化的图片URL字符串
    date: recipeDate,
  } satisfies Recipe;
};

export const preprocessDress = async (entry: Entry<"dresses">) => {
  // 使用基础的 fileToUrl
  const image = fileToUrl(entry.data.cover!);
  
  let exif: Partial<ExifData> = {};
  let dressDate = new Date();
  
  try {
    const imageUrl = fileToUrl(entry.data.cover!);
    const parsedExif = await exifr.parse(imageUrl, true);
    if (parsedExif) {
      exif = parsedExif as ExifData;
      if (exif.DateTimeOriginal && typeof exif.DateTimeOriginal === 'string') {
        dressDate = new Date(exif.DateTimeOriginal);
      }
    }
  } catch (error) {
    console.warn(`无法解析服装图片的EXIF信息:`, error);
    exif = {};
  }
  
  return {
    ...preprocess(entry),
    photographer: entry.data.properties.Photographer,
    image, // 这是本地化的图片URL字符串
    exif: exif as ExifData,
    date: dressDate,
  } satisfies Dress;
};

export const preprocessAll = async (
  key: Exclude<keyof DataEntryMap, "articles">,
  entry: any
) => {
  if (key === "photos") return await preprocessPhoto(entry);
  if (key === "videos") return await preprocessVideo(entry);
  if (key === "musics") return await preprocessMusic(entry);
  if (key === "recipes") return await preprocessRecipe(entry);
  return await preprocessDress(entry);
};
