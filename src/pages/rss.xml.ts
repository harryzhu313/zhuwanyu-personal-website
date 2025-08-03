import rss, { type RSSFeedItem } from "@astrojs/rss";
import { getCollection, type DataEntryMap } from "astro:content";
import collections, { description, email, slugify, title } from "..";
import { preprocessAll } from "../content/config";
import sanitizeHtml from "sanitize-html";
import MarkdownIt from "markdown-it";
const parser = new MarkdownIt();

async function generateItems() {
  const result: RSSFeedItem[] = [];
  
  // 处理 articles 集合
  for (const article of await getCollection("articles")) {
    const { data } = article;
    result.push({
      title: data.title,
      pubDate: data.date,
      description: data.description,
      link: `/articles/${slugify(data.title)}`,
      enclosure: undefined, // TODO: add enclosure for articles
    });
  }
  
  // 安全处理其他集合
  for (const type of Object.keys(collections) as (keyof DataEntryMap)[]) {
    if (type === "articles") continue;
    
    try {
      const collectionData = await getCollection(type);
      // 检查集合是否为空
      if (!collectionData || collectionData.length === 0) {
        console.log(`RSS: 跳过空集合 ${type}`);
        continue;
      }
      
      for (const raw of collectionData) {
        const data = await preprocessAll(type, raw);
        if (!data) continue; // 跳过处理失败的条目
        
        const { title, date, description, categories } = data as any;
        const link = `/${type}/${slugify(title)}`;
        result.push({
          title,
          link,
          description,
          categories,
          pubDate: date,
          content: raw.body
            ? sanitizeHtml(parser.render(raw.body), {
                allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
              })
            : undefined,
          author: email,
          commentsUrl: link,
          enclosure: undefined, // TODO: add enclosure for photos, recipes, dresses
        });
      }
    } catch (error) {
      console.error(`RSS: 处理集合 ${type} 时出错:`, error);
      // 继续处理其他集合，不让一个集合的错误影响整个 RSS 生成
      continue;
    }
  }
  
  result.sort((a, b) => b.pubDate!.getTime() - a.pubDate!.getTime());
  return result;
}

const items = await generateItems();

export function GET(context: any) {
  return rss({
    title,
    description,
    site: context.site,
    items,
    stylesheet: "/pretty-feed-v3.xsl",
  });
}
