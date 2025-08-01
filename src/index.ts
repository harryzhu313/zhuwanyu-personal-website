import { pinyin } from "pinyin-pro";
import type { ExifData } from "./components/ExifImage.astro";

export interface Entry {
  title: string;
  date: Date;
  categories: string[];
  description: string;
  suite?: string;
}

export interface Article extends Entry {
  cover: string;
}

export interface Photo extends Entry {
  image: string;
  exif: ExifData;
}

export interface Video extends Entry {
  uid: string;
}

export interface Music extends Entry {
  opus: number;
  number: number;
  lilypond: string;
  score: string;
  url?: string;
}

export interface Recipe extends Entry {
  image: string;
  rating: string;
}

export interface Dress extends Entry {
  photographer: string;
  image: string;
  exif: ExifData;
}

export interface Suite<T extends Entry> {
  name: string;
}

export interface Collection {
  image: string;
  name: string;
  icon: string;
  description: string;
}

export const title = "Harry 的个人网站";
export const description = "Harry 的个人网站";
export const site = "https://zhuwanyu.com";
export const email = "harryzhu@gmail.com";
// 智能API端点配置
export const endpoint = (() => {
  if (typeof window === 'undefined') {
    // 服务端渲染时使用生产域名
    return "https://zhuwanyu.com/api";
  }
  
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // 本地开发
    return "http://localhost:8888/api";
  } else if (hostname.includes('.netlify.app')) {
    // Netlify预览域名
    return `${window.location.protocol}//${hostname}/api`;
  } else {
    // 自定义域名（zhuwanyu.com）
    return "https://zhuwanyu.com/api";
  }
})();

export const yymmdd = (d: Date) =>
  `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
export const mmdd = (d: Date) => `${d.getMonth() + 1} 月 ${d.getDate()} 日`;
export const basename = (path: string) => path.split("/").pop()!.split(".")[0];
export const createDate = (s: string) => {
  const date = new Date(s);
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );
};

const articles: Collection = {
  image: "../images/index/articles.jpg",
  name: "文章",
  icon: "fa6-solid:pen",
  description: "阅读我笔下的文字",
};
const photos: Collection = {
  image: "../images/index/photos.jpg",
  name: "照片",
  icon: "fa6-solid:image",
  description: "欣赏我拍的照片",
};
const videos: Collection = {
  image: "../images/index/videos.jpg",
  name: "视频",
  icon: "fa6-solid:video",
  description: "观看我拍的视频",
};
const musics: Collection = {
  image: "../images/index/musics.jpg",
  name: "音乐",
  icon: "fa6-solid:music",
  description: "聆听我写的音乐",
};
const recipes: Collection = {
  image: "../images/index/recipes.jpg",
  name: "菜谱",
  icon: "fa6-solid:utensils",
  description: "品尝我做的佳肴",
};
const dresses: Collection = {
  image: "../images/index/recipes.jpg",
  name: "女装",
  icon: "fa6-solid:female",
  description: "好耶，是女装！",
};

export default { articles, photos, videos, musics, recipes, dresses };

export function slugify(title: string) {
  if (!title || title.trim() === "") {
    return "";
  }
  
  const slug = pinyin(title.trim(), {
    toneType: "none",
    type: "array",
    removeNonZh: true,
  }).join("-");
  
  // 确保生成的 slug 不为空，如果为空则使用时间戳
  return slug || `untitled-${Date.now()}`;
}

export async function get<T>(route: string): Promise<T> {
  const response = await fetch(endpoint + route);
  return await response.json();
}

export async function put<T>(route: string, data: T): Promise<any | void> {
  try {
    const response = await fetch(endpoint + route, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "PUT",
      body: JSON.stringify(data),
    });
    window.alert("提交成功！");
    return response.json();
  } catch (error) {
    window.alert("提交失败！");
  }
}


// 用户交互

export interface Message {
  id: number;
  name: string;
  email: string;
  content: string;
  datetime: string;
}

export interface Comment extends Message {
  collection: string;
  entry: string;
}

type MealType = "早餐" | "午餐" | "晚餐";
type OrderType = "提前选择菜品" | "请我即兴发挥";

export interface Order extends Message {
  mealtype: MealType;
  ordertype: OrderType;
  summary: string;
}
