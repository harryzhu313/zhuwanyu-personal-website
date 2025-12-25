/**
 * Remark 插件：将 Markdown 图片转换为普通 HTML img 标签
 * 这样可以完全绕过 Astro 5.x 的图片优化系统，避免 HTML 转义问题
 */
export default function remarkImagesToHtml() {
  return (tree) => {
    // 手动遍历所有节点
    function visit(node, parent, index) {
      // 如果是图片节点，转换为 HTML
      if (node.type === 'image') {
        // 创建一个 HTML 节点替代图片节点
        const htmlNode = {
          type: 'html',
          value: `<img src="${node.url}" alt="${node.alt || ''}" loading="lazy" />`
        };
        
        // 在父节点中替换
        if (parent && typeof index === 'number') {
          parent.children[index] = htmlNode;
        }
        
        console.log(`🖼️ 转换图片为 HTML: ${node.url.substring(0, 80)}`);
      }
      
      // 递归处理子节点
      if (node.children && Array.isArray(node.children)) {
        for (let i = 0; i < node.children.length; i++) {
          visit(node.children[i], node, i);
        }
      }
    }
    
    visit(tree);
  };
}

