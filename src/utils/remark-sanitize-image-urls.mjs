import { visit } from 'unist-util-visit';

/**
 * 清理和验证图片 URL
 * 处理被截断或格式错误的图片 URL
 */
function sanitizeImageUrl(src) {
  if (!src || typeof src !== 'string') {
    console.warn('⚠️ 图片 URL 为空或类型错误');
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
    // 只清理以 http:// 或 https:// 开头的绝对 URL
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
      const urlObj = new URL(cleaned);
      
      // 确保协议是 http 或 https
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        console.warn(`⚠️ 不支持的协议: ${urlObj.protocol}`);
        return null;
      }
      
      return cleaned;
    }
    
    // 相对路径或其他格式，直接返回
    return cleaned;
  } catch (err) {
    console.error(`❌ URL 格式无效: ${cleaned.substring(0, 60)}...`);
    // 如果 URL 无效，返回原始值（让 Astro 处理错误）
    return cleaned;
  }
}

/**
 * Remark 插件：清理 Markdown 中的图片 URL
 * 使用官方的 unist-util-visit 确保可靠地遍历所有节点
 */
export default function remarkSanitizeImageUrls() {
  return (tree) => {
    visit(tree, 'image', (node) => {
      if (node.url) {
        const originalUrl = node.url;
        const cleanedUrl = sanitizeImageUrl(node.url);
        
        if (cleanedUrl && cleanedUrl !== originalUrl) {
          console.log(`🔧 清理图片 URL:`);
          console.log(`   原始: ${originalUrl.substring(0, 80)}`);
          console.log(`   清理后: ${cleanedUrl.substring(0, 80)}`);
          node.url = cleanedUrl;
        } else if (!cleanedUrl) {
          console.warn(`⚠️ 无效的图片 URL 已跳过: ${originalUrl.substring(0, 80)}`);
          // 将无效 URL 替换为空字符串，避免构建崩溃
          node.url = '';
        }
      }
    });
  };
}

