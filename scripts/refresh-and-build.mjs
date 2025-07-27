#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🔄 开始刷新并构建流程...');

try {
  // 1. 清理缓存，强制重新获取 Notion 数据
  console.log('📁 清理缓存...');
  await execAsync('rm -rf node_modules/.astro .astro dist');
  
  // 2. 重新安装依赖（确保环境干净）
  console.log('📦 重新安装依赖...');
  await execAsync('npm install');
  
  // 3. 构建项目（此时会重新从 Notion 获取新鲜数据）
  console.log('🏗️ 开始构建...');
  await execAsync('npm run build');
  
  console.log('✅ 构建成功！图片已本地化到 dist/_astro/');
  console.log('');
  console.log('🎉 构建完成！接下来可以：');
  console.log('   • 运行 npm run preview 启动预览服务器');
  console.log('   • 部署 dist/ 文件夹到生产环境');
  console.log('   • 检查 dist/_astro/ 目录中的本地化图片');
  
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  
  console.log('💡 建议解决方案:');
  console.log('1. 检查 Notion 图片 URL 是否过期');
  console.log('2. 在 Notion 中重新编辑页面以刷新 URL');
  console.log('3. 确保 NOTION_TOKEN 环境变量正确');
  
  process.exit(1);
} 